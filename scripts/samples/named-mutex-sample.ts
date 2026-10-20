import console from "node:console";
import process from "node:process";
import { setTimeout } from "node:timers/promises";

import { NamedMutex } from "../helpers/named-mutex.ts";
import { TcError } from "../helpers/tc-error.ts";

// A sample of NamedMutex, held the way a run holds its collection's lock. Nothing imports it.
//
// Run it in two terminals, from scripts/:
//
//   node samples/named-mutex-sample.ts [<name>]
//
// The second stops with an error while the first holds the mutex. End the first however you like
// (Ctrl+C, closing its window, Stop-Process -Id <pid> -Force on Windows, kill -9 <pid> on Linux and
// macOS), then run it again: it takes the mutex, because the system let it go when the first
// process ended.

// Two processes given the same name contend for one mutex. A run names its collection's lock with
// that collection's ID, which this stands for.
const SampleName = "00000000-0000-4000-8000-000000000000";

async function main(): Promise<void> {
  const name = process.argv[2] ?? SampleName;

  // Held while main runs, and let go as main returns or throws.
  await using mutex = await NamedMutex.take(name);

  // Where another process holds the mutex, take returns undefined at once, and its caller writes
  // the error, since only the caller knows what the name stands for. A run's error names its
  // collection (parallel-safety-spec.md R-PARALLEL-5).
  if (mutex === undefined) {
    throw new TcError(
      `Another process holds the mutex "${name}" on this computer, and its process ID is not known. Run this again once it has finished.`,
    );
  }

  console.log(
    `Process ${process.pid} holds the mutex "${name}". End it however you like to let the mutex go.`,
  );

  // Stands in for a run's work, which is what keeps a real run's process alive.
  console.log("Working for 60s...");
  await setTimeout(60_000);
  console.log("Work is done");
}

await main();
