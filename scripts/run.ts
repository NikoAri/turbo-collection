import console from "node:console";
import { randomBytes } from "node:crypto";
import { closeSync, mkdirSync, openSync, writeSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { TcError } from "./helpers/tc-error.ts";
import { copyRootAtOrAbove, ensureNoLinkInPath } from "./paths.ts";
import {
  SpecificationVersionStamps,
  TurboCollectionVersion,
} from "./versions.ts";

// A run, one invocation of Turbo-Collection: its ID, its own directory, and its log
// (logging-spec.md).

// The instant `now` as a log entry and a receipt state a date: ISO 8601, in UTC, to the second
// (meta-file-spec.md R-MFILE-14).
export function dateOf(now: Date): string {
  return now.toISOString().replace(/\.\d{3}Z$/, "Z");
}

// A new run ID (meta-file-spec.md R-MFILE-13): the instant `now` in ISO 8601 basic format, in UTC
// to the second, then `-` and four random lower-case hexadecimal digits.
export function newRunId(now: Date = new Date()): string {
  const instant = dateOf(now).replaceAll(/[-:]/g, "");
  return `${instant}-${randomBytes(2).toString("hex")}`;
}

// The directory that holds each run's own, in the directory for temporary files (R-LOG-6).
export function runsDirectoryIn(temporaryDirectory: string): string {
  return path.join(temporaryDirectory, "turbo-collection", "runs");
}

// A run's ID and its own directory.
export type RunDirectory = {
  runId: string;
  runDirectory: string;
};

// Makes a run's own directory in `runsDirectory`, under a new run ID (R-LOG-6).
//
// The directory is made without `recursive`, so only where nothing is at its path. Where
// something is, another run has that ID, and this run takes another (parallel-safety-spec.md
// R-PARALLEL-1).
export function makeRunDirectory(
  runsDirectory: string,
  nextRunId: () => string = newRunId,
): RunDirectory {
  mkdirSync(runsDirectory, { recursive: true });
  for (;;) {
    const runId = nextRunId();
    const runDirectory = path.join(runsDirectory, runId);
    try {
      mkdirSync(runDirectory);
      return { runId, runDirectory };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") {
        throw e;
      }
    }
  }
}

// The name of a run's log (R-LOG-6, R-LOG-10).
export function logFileName(runId: string): string {
  return `tc-${runId}.log.json`;
}

// An entry of a run's log, before its date (R-LOG-8). `outcome` is `success` where absent, and
// `verbose` is false where absent.
export type LogEntry = {
  event: string;
  outcome?: "success" | "failure";
  verbose?: boolean;
  [field: string]: unknown;
};

// Where a run's entries go (turbo-collection-core-spec.md, the Logger contract). `text` is the
// entry as a line a person can read, for the terminal (R-LOG-9).
export type Logger = {
  log(entry: LogEntry, text: string): void;
};

// A run's log: a file holding every entry, one JSON object to a line (R-LOG-7), and the terminal,
// which shows each entry that is not verbose, and a verbose one only under --verbose (R-LOG-9).
//
// Each entry is written to the file as it is made, so whatever ends the run, the entries before it
// are on disk.
export class RunLog implements Logger, Disposable {
  // Private fields
  readonly #file: number;
  readonly #verbose: boolean;

  // Constructor, private so that a RunLog comes only from create
  private constructor(file: number, verbose: boolean) {
    this.#file = file;
    this.#verbose = verbose;
  }

  // Creates a log at `file`, which must not exist yet. `verbose` is whether the command line holds
  // --verbose.
  static create(file: string, verbose: boolean): RunLog {
    return new RunLog(openSync(file, "wx"), verbose);
  }

  // Adds `entry` as the last line of the log, and shows `text` on the terminal: on standard error
  // for a failure, and on standard output otherwise.
  log(entry: LogEntry, text: string): void {
    writeSync(
      this.#file,
      `${JSON.stringify({ date: dateOf(new Date()), ...entry })}\n`,
    );
    if (entry.outcome === "failure") {
      console.error(text);
    } else if (entry.verbose !== true || this.#verbose) {
      console.log(text);
    }
  }

  // Closes the log file, through the Disposable mechanism that `using` calls as its block ends
  [Symbol.dispose](): void {
    closeSync(this.#file);
  }
}

// A run's log, and the error that kept it out of the directory --log-dir names, if one did.
export type OpenedRunLog = {
  log: RunLog;
  logDirectoryError: unknown;
};

// Creates a run's log: in `logDirectory` where the command line names one (R-LOG-10), and
// otherwise in the run's own directory (R-LOG-6).
//
// `logDirectory` is checked as any directory a run is given (turbo-collection-core-spec.md
// R-CLI-20), and must not lie inside a copy (R-LOG-5). Where it cannot be used, the log goes into
// the run's own directory, and the error is returned for the run to end with.
export function openRunLog(
  { runId, runDirectory }: RunDirectory,
  logDirectory: string | undefined,
  verbose: boolean,
): OpenedRunLog {
  let logDirectoryError: unknown;
  if (logDirectory !== undefined) {
    try {
      const directory = path.resolve(logDirectory);
      ensureNoLinkInPath(directory);
      const copyRoot = copyRootAtOrAbove(directory);
      if (copyRoot !== undefined) {
        throw new TcError(
          `The log directory "${directory}" lies inside a copy at "${copyRoot}", and a log is never written inside a copy. Name a directory outside every copy with --log-dir.`,
        );
      }
      mkdirSync(directory, { recursive: true });
      return {
        log: RunLog.create(path.join(directory, logFileName(runId)), verbose),
        logDirectoryError: undefined,
      };
    } catch (e) {
      logDirectoryError = e;
    }
  }

  return {
    log: RunLog.create(path.join(runDirectory, logFileName(runId)), verbose),
    logDirectoryError,
  };
}

// The name and version of the operating system, such as `Windows 10.0.26200`.
function systemNameAndVersion(): string {
  const name = process.platform === "win32" ? "Windows" : os.type();
  return `${name} ${os.release()}`;
}

// A run's first entry (R-LOG-11). `args` is the command line, without the program's own path.
export function logRunStart(logger: Logger, args: readonly string[]): void {
  const runtime = `node ${process.versions.node}`;
  const system = systemNameAndVersion();
  logger.log(
    {
      event: "run-start",
      verbose: true,
      version: TurboCollectionVersion,
      specifications: SpecificationVersionStamps,
      arguments: args,
      system,
      runtime,
    },
    `run-start: turbo-collection ${TurboCollectionVersion}, ${runtime}, ${system}`,
  );
}

// A run's last entry (R-LOG-11), whose outcome is `failure` exactly where the run exits with a
// non-zero status.
export function logRunEnd(logger: Logger, failed: boolean): void {
  if (failed) {
    logger.log({ event: "run-end", outcome: "failure" }, "run-end: failure");
  } else {
    logger.log({ event: "run-end", verbose: true }, "run-end: success");
  }
}

// What a log entry records of an error: its message, and its stack trace and its cause where it
// has them. `JSON.stringify` of an error keeps none of these, so each is copied.
type ErrorFields = {
  message: string;
  stack?: string;
  cause?: ErrorFields;
};

function errorFieldsOf(error: unknown): ErrorFields {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }
  return {
    message: error.message,
    ...(error.stack === undefined ? {} : { stack: error.stack }),
    ...(error.cause === undefined ? {} : { cause: errorFieldsOf(error.cause) }),
  };
}

// An error, as an `error` entry (R-LOG-12).
export function logError(logger: Logger, error: unknown): void {
  const fields = errorFieldsOf(error);
  logger.log(
    { event: "error", outcome: "failure", ...fields },
    `error: ${fields.message}`,
  );
}
