import console from "node:console";
import { closeSync, mkdirSync, openSync, writeSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { dateToString } from "./helpers/date-helper.ts";
import { generateRunId } from "./helpers/run-id.ts";
import { TcError } from "./helpers/tc-error.ts";
import { copyRootAtOrAbove, ensureNoLinkInPath } from "./paths.ts";
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
// `log` for an entry, or for text, as a `message` entry
// (R-LOG-17), and `error` for an error (R-LOG-12).
export type Logger = {
  log(entry: LogEntry | string): void;
  error(error: unknown): void;
};

// `entry`, or text as a `message` entry (R-LOG-17).
export function logEntryOf(entry: LogEntry | string): LogEntry {
  if (typeof entry !== "string") {
    return entry;
  }
  return { event: "message", message: entry, toString: () => entry };
}

// `error` as an `error` entry (R-LOG-12).
function errorEntryOf(error: unknown): LogEntry {
  const fields = errorFieldsOf(error);
  return {
    event: "error",
    outcome: "failure",
    ...fields,
    toString: () => fields.message,
  };
}

// Shows what `entry`'s `toString` gives on the terminal
// (R-LOG-9): on standard error for a failure, and on
// standard output otherwise, a verbose entry only where
// `verbose`, whether the command line holds --verbose.
function show(entry: LogEntry, verbose: boolean): void {
  if (entry.outcome === "failure") {
    console.error(entry.toString());
  } else if (entry.verbose !== true || verbose) {
    console.log(entry.toString());
  }
}

// Where entries go while no run's log is open: the
// terminal alone, which shows no verbose entry.
const terminalLogger: Logger = {
  log: (entry) => show(logEntryOf(entry), false),
  error: (error) => show(errorEntryOf(error), false),
};

// The run's log while one is open, and the terminal
// alone otherwise.
let currentLogger: Logger = terminalLogger;

// What code logs to, as it would to `console`: a process
// runs one run and keeps one log, so code imports this
// rather than being handed a logger. A RunLog takes it
// over from when it is created until it is disposed of.
export const logger: Logger = {
  log: (entry) => currentLogger.log(entry),
  error: (error) => currentLogger.error(error),
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
  readonly #previousLogger: Logger;

  // Constructor, private so that a RunLog comes only from create.
  // `logger` writes here from now on.
  private constructor(file: number, verbose: boolean) {
    this.#file = file;
    this.#verbose = verbose;
    this.#previousLogger = currentLogger;
    currentLogger = this;
  }

  // Creates a log at `file`, which must not exist yet.
  // `verbose` is whether the command line holds
  // --verbose.
  static create(file: string, verbose: boolean): RunLog {
    return new RunLog(openSync(file, "wx"), verbose);
  }

  // Adds `entryOrText` as the last line of the log, and shows
  // what its `toString` gives on the terminal: on standard error
  // for a failure, and on standard output otherwise.
  log(entryOrText: LogEntry | string): void {
    const entry = logEntryOf(entryOrText);
    // `JSON.stringify` leaves out `toString`, a function
    writeSync(
      this.#file,
      `${JSON.stringify({ date: dateToString(new Date()), ...entry })}\n`,
    );
    show(entry, this.#verbose);
  }

  // Adds `error` as an `error` entry (R-LOG-12).
  error(error: unknown): void {
    this.log(errorEntryOf(error));
  }

  // Hands `logger` back to whatever it wrote to before, and
  // closes the log file, through the Disposable mechanism
  // that `using` calls as its block ends
  [Symbol.dispose](): void {
    currentLogger = this.#previousLogger;
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

// A run's first and last entries (R-LOG-11):
// run-start as it is made, and run-end as `using`
// disposes of it. Where `error` was set, the error's
// entry (R-LOG-12) comes before run-end, and run-end
// is a failure.
export class RunScope implements Disposable {
  // The error that ended the run, where one did
  error: unknown = undefined;

  // Writes run-start. `args` is
  // command line, without the program's own path.
  constructor(args: readonly string[]) {
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
        `Turbo-Collection ${TurboCollectionVersion}, ${runtime}, ${system}`,
    });
  }

  // Writes the error's entry where `error` was set,
  // then run-end, whose outcome is `failure` exactly
  // where the run exits with a non-zero status.
  [Symbol.dispose](): void {
    if (this.error === undefined) {
      logger.log({
        event: "run-end",
        verbose: true,
        toString: () => "Done",
      });
    } else {
      logger.error(this.error);
      logger.log({
        event: "run-end",
        outcome: "failure",
        toString: () => "Failed",
      });
    }
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
