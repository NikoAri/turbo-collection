import { once } from "node:events";
import { constants } from "node:fs";
import { mkdir, open, type FileHandle } from "node:fs/promises";
import { createServer, type Server } from "node:net";
import process from "node:process";

import { TcError } from "./tc-error.ts";

// A mutex that one process on this computer holds under a name, and that its
// operating system lets go when that process ends, however it ends
// (parallel-safety-spec.md R-PARALLEL-6).
//
// On Windows, it is a server listening on a named pipe, not a Win32 mutex.
//
// On Linux, it is a server listening on a Unix domain socket whose name starts
// with \0, which puts that name in Linux's abstract namespace: no file is
// made, and Linux drops that name when its socket closes.
//
// On macOS, it is a file macOS locks.
//
// A name is used as it is given, after turbo-collection, in its pipe's name,
// its socket's or its file's.
//
// Hold one with `await using`, which keeps it referenced until its block ends
// and then lets it go. On macOS, garbage collection closes a file that nothing
// references, which would let that mutex go; on Windows and Linux, a mutex
// that is never let go keeps its process running.
export class NamedMutex implements AsyncDisposable {
  // Private fields
  readonly #holder: AsyncDisposable;

  // Constructor, private so that a NamedMutex comes only from take
  private constructor(holder: AsyncDisposable) {
    this.#holder = holder;
  }

  // Releases this mutex, through `Symbol.asyncDispose`, which `await using`
  // calls as its block ends
  async [Symbol.asyncDispose](): Promise<void> {
    await this.#holder[Symbol.asyncDispose]();
  }

  // Takes a mutex named `name`, or returns undefined where it is held
  // already, by this process or another. It never waits for that mutex
  // (R-PARALLEL-5).
  //
  // A second take right after a first must find that mutex held. Where that
  // second take succeeds too, its first take had no effect, and this throws
  // (R-PARALLEL-7).
  static async take(name: string): Promise<NamedMutex | undefined> {
    // Try to take this mutex
    const holder: AsyncDisposable | undefined = await hold(name);

    // Held already
    if (holder === undefined) {
      return undefined;
    }

    // Taken. An extra sanity check follows, since each system takes a mutex by
    // a mechanism of its own, and macOS's rests on O_EXLOCK, which Node does
    // not export
    await NamedMutex.verifyHeld(name);

    // Return this mutex, held and verified
    return new NamedMutex(holder);
  }

  // Throws where a mutex named `name` can be taken, which right after a take
  // means that take had no effect (R-PARALLEL-7). Whatever this takes, it lets
  // go before it throws.
  static async verifyHeld(name: string): Promise<void> {
    await using second = await hold(name);
    if (second !== undefined) {
      throw new TcError(
        `Taking the mutex "${name}" failed: it was taken twice.`,
      );
    }
  }
} // end of class

// All platforms Holds a mutex's name, or returns undefined where something
// holds it already. What holds it: - Windows and Linux: a server listening on
// that name - macOS: a file opened with O_EXLOCK
async function hold(name: string): Promise<AsyncDisposable | undefined> {
  // macOS
  if (process.platform === "darwin") {
    return await holdLockFile(name);
  }

  // Windows and Linux
  return await holdPipe(generatePipeName(name));
}

// Windows and Linux
// Generates a pipe's name, in whichever form each system requires
function generatePipeName(name: string): string {
  if (process.platform === "win32") {
    // A Windows named pipe's name starts with \\.\pipe\. String.raw keeps its
    // backslashes, which a plain template literal would read as escapes.
    return String.raw`\\.\pipe\turbo-collection-${name}`;
  } else if (process.platform === "linux") {
    // A Linux socket with no file, in Linux's abstract namespace, has a name
    // starting with \0
    return `\0turbo-collection-${name}`;
  }

  throw new TcError(
    `A named mutex is not written yet for platform ${process.platform}.`,
  );
}

// Windows and Linux Listens on `pipeName`, or returns undefined where something
// listens on it already. Its operating system deletes that name when a process
// listening on it ends, however it ends, and a second listener on that name
// gets EADDRINUSE, in this process or another.
async function holdPipe(pipeName: string): Promise<Server | undefined> {
  // A process that connects is dropped at once, so no connection keeps this
  // one alive.
  const server = createServer((connection) => connection.destroy());

  // This call returns for every invocation, even where `pipeName` is held
  // already: that error arrives as an event, which an `await` below meets.
  server.listen(pipeName);

  // On Linux, no file is made: `pipeName` is in Linux's list of sockets,
  // where `ss -xlp` shows it as @turbo-collection-<name>.

  try {
    // "listening" is emitted when `server` has been bound after
    // server.listen(), and an "error" event instead rejects this await.
    await once(server, /*eventName*/ "listening");
  } catch (error) {
    // A name held already, on Windows: { "message":"listen EADDRINUSE: address
    // already in use \\.\pipe\turbo-collection-00000000-…",
    // "code":"EADDRINUSE", "errno":-4091, "syscall":"listen",
    // "address":"\\.\pipe\turbo-collection-00000000-…" }
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "EADDRINUSE"
    ) {
      // Held already
      return undefined;
    }

    // Another error
    throw error;
  }

  return server;
}

// macOS open(2) takes a kernel lock on its file within that one call, given
// O_EXLOCK, which Node does not export. macOS releases that lock when its
// process ends, however it ends; that file stays, and its being there means
// nothing.
const O_EXLOCK = 0x20;

// macOS Opens a mutex's file, or returns undefined where another open holds
// its lock. Opened read-only (O_RDONLY is 0, so no flag says it), since nothing
// is written. O_CREAT makes that file on a computer's first take. A held lock
// fails an open with EAGAIN at once, since O_NONBLOCK says not to wait;
// without it, an open waits for that lock's holder to end.
async function holdLockFile(name: string): Promise<FileHandle | undefined> {
  // Make `/tmp/turbo-collection`, where it is missing
  await mkdir("/tmp/turbo-collection", { recursive: true });
  const lockFilePath = `/tmp/turbo-collection/${name}.lock`;
  const fileFlags = constants.O_CREAT | constants.O_NONBLOCK | O_EXLOCK;

  try {
    return await open(lockFilePath, fileFlags);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EAGAIN") {
      // Held already
      return undefined;
    }

    // Another error
    throw error;
  }
}
