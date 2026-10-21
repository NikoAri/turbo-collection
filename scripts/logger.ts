import console from "node:console";
import { closeSync, mkdirSync, openSync, writeSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { TcError } from "./helpers/tc-error.ts";
import { copyRootAtOrAbove, ensureNoLinkInPath } from "./paths.ts";
import { dateToString, generateRunId } from "./run.ts";
import {
  SpecificationVersionStamps,
  TurboCollectionVersion,
} from "./versions.ts";

// A run's log (logging-spec.md): where it is written,
// what an entry holds, and the entries every run makes

// The name of a run's log (R-LOG-6, R-LOG-10).
export function logLeafFileName(runId: string): string {
  return `tc-${runId}.log.json`;
}

// An entry of a run's log, before its date (R-LOG-8).
// `outcome` is `success` where absent, and
// `verbose` is false where absent. Every entry defines
// `toString`, the entry as a line a person can read,
// for the terminal (R-LOG-9); the log's file leaves it out.
export type LogEntry = {
  event: string; // event name
  outcome?: "success" | "failure";
  verbose?: boolean;
  toString(): string;
  [field: string]: unknown;
};

// Where a run's entries go (turbo-collection-core-spec.md,
// the Logger contract), taken as `console` takes them:
// `log` for an entry, and `error` for an error (R-LOG-12).
export type Logger = {
  log(entry: LogEntry): void;
  error(error: unknown): void;
};

// A run's log: a file holding every entry,
// one JSON object to a line (R-LOG-7), and the terminal,
// which shows each entry that is not verbose,
// and a verbose one only under --verbose (R-LOG-9).
//
// Each entry is written to the file as it is made,
// so whatever ends the run, the entries before it
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

  // Creates a log at `file`, which must not exist yet.
  // `verbose` is whether the command line holds
  // --verbose.
  static create(file: string, verbose: boolean): RunLog {
    return new RunLog(openSync(file, "wx"), verbose);
  }

  // Adds `entry` as the last line of the log, and shows
  // what its `toString` gives on the terminal: on standard error
  // for a failure, and on standard output otherwise.
  log(entry: LogEntry): void {
    // `JSON.stringify` leaves out `toString`, a function
    writeSync(
      this.#file,
      `${JSON.stringify({ date: dateToString(new Date()), ...entry })}\n`,
    );
    if (entry.outcome === "failure") {
      console.error(entry.toString());
    } else if (entry.verbose !== true || this.#verbose) {
      console.log(entry.toString());
    }
  }

  // Adds `error` as an `error` entry (R-LOG-12).
  error(error: unknown): void {
    const fields = errorFieldsOf(error);
    this.log({
      event: "error",
      outcome: "failure",
      ...fields,
      toString: () => `error: ${fields.message}`,
    });
  }

  // Closes the log file, through the Disposable mechanism
  // that `using` calls as its block ends
  [Symbol.dispose](): void {
    closeSync(this.#file);
  }
}

// Log directory of a run whose command line names none:
// `turbo-collection/logs/` in the directory for
// temporary files `temporaryDirectory` (R-LOG-6).
export function defaultLogDirectory(temporaryDirectory: string): string {
  return path.join(temporaryDirectory, "turbo-collection", "logs");
}

// Checks the directory --log-dir names, as any directory
// a run is given (turbo-collection-core-spec.md
// R-CLI-20), and that it does not lie inside a copy,
// before anything is made there (R-LOG-10).
export function ensureUsableLogDirectory(logDirectory: string): void {
  const directory = path.resolve(logDirectory);
  ensureNoLinkInPath(directory);
  const copyRoot = copyRootAtOrAbove(directory);
  if (copyRoot !== undefined) {
    throw new TcError(
      `The log directory "${directory}" lies inside a copy at "${copyRoot}", and a log is never written inside a copy. Name a directory outside every copy with --log-dir.`,
    );
  }
}

// Creates a run's log in `logDirectory`, under a new
// run ID, making the directory, with every missing
// directory above it, where it does not exist (R-LOG-6).
//
// The log is created only where nothing is at its path.
// Where something is, another run has that ID,
// and this run takes another (parallel-safety-spec.md
// R-PARALLEL-1).
export function createRunLog(
  logDirectory: string,
  verbose: boolean,
  generateRunIdFunction: () => string = generateRunId,
): RunLog {
  mkdirSync(logDirectory, { recursive: true });

  for (;;) {
    const runId = generateRunIdFunction();

    try {
      // `wx` fails if a different run already created one
      return RunLog.create(
        path.join(logDirectory, logLeafFileName(runId)),
        verbose,
      );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") {
        throw e;
      }

      // Retry with new runId
      // Until successful
    }
  }
}

// Name and Version of the operating system,
// such as `Windows_NT 10.0.26200`.
function systemNameAndVersion(): string {
  return `${os.type()} ${os.release()}`;
}

// Run's first entry (R-LOG-11).
// `args` is
// command line, without the program's own path.
export function logRunStart(logger: Logger, args: readonly string[]): void {
  const runtime = `node ${process.versions.node}`;
  const system = systemNameAndVersion();
  logger.log({
    event: "run-start",
    verbose: true,
    version: TurboCollectionVersion,
    specifications: SpecificationVersionStamps,
    arguments: args,
    system,
    runtime,
    toString: () =>
      `run-start: turbo-collection ${TurboCollectionVersion}, ${runtime}, ${system}`,
  });
}

// A run's last entry (R-LOG-11), whose outcome is
// `failure` exactly where the run exits with a
// non-zero status.
export function logRunEnd(logger: Logger, failed: boolean): void {
  if (failed) {
    logger.log({
      event: "run-end",
      outcome: "failure",
      toString: () => "run-end: failure",
    });
  } else {
    logger.log({
      event: "run-end",
      verbose: true,
      toString: () => "run-end: success",
    });
  }
}

// What a log entry records of an error: its message,
// and its stack trace and its cause where it
// has them. `JSON.stringify` of an error
// keeps none of these, so each is copied.
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
