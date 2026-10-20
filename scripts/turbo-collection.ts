import console from "node:console";
import os from "node:os";
import process from "node:process";
import { parseArgs } from "node:util";

import { TcError } from "./helpers/tc-error.ts";
import { initializeTc } from "./init.ts";
import {
  logError,
  logRunEnd,
  logRunStart,
  makeRunDirectory,
  openRunLog,
  runsDirectoryIn,
  type Logger,
} from "./run.ts";
import {
  SpecificationVersionStamps,
  TurboCollectionVersion,
} from "./versions.ts";

const HELP_TEXT = `Turbo-Collection

Usage:
  turbo-collection init [<directory>] [-n <name>] [--copy <name>]

Commands:
  init [<directory>]  Make <directory> the first copy of a new collection,
                      creating it where it does not exist. Without
                      <directory>, the current directory.

Options:
  -n, --name <name>      Name the new collection. Without it, the collection
                         takes the name of its directory.
      --copy <name>      Name the new copy. Without it, the copy is "main".
      --verbose          Also show the details that the run's log holds.
      --log-dir <dir>    Write the run's log into <dir>. Without it, the log
                         is in the directory for temporary files.
  -h, --help             Show this help and exit.
      --version          Show the version of Turbo-Collection and of each
                         specification it conforms to, and exit.
`;

async function runTurboCollection(): Promise<void> {
  console.log("Turbo-Collection");
}

type TcCliArgs = {
  help: boolean;
  version: boolean; // --version: report the versions (turbo-collection-core-spec.md R-CLI-16)
  verbose: boolean; // --verbose: show verbose log entries too (logging-spec.md R-LOG-9)
  logDir: string | undefined; // --log-dir: where the run's log goes (logging-spec.md R-LOG-10)
  name: string | undefined; // -n, --name: what a new collection is called
  copy: string | undefined; // --copy: what a new copy is called
  command: string | undefined; // The first argument that is not an option: `init`
  commandArgs: string[]; // What follows the command: the directory init is given
};

export function parseCliArgs(args: readonly string[]): TcCliArgs {
  const { values, positionals } = parseArgs({
    args: [...args],
    options: {
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", default: false },
      verbose: { type: "boolean", default: false },
      "log-dir": { type: "string" },
      name: { type: "string", short: "n" },
      copy: { type: "string" },
    },
    allowPositionals: true,
  });
  const [command, ...commandArgs] = positionals;

  return {
    help: values.help,
    version: values.version,
    verbose: values.verbose,
    logDir: values["log-dir"],
    name: values.name,
    copy: values.copy,
    command,
    commandArgs,
  };
}

// Whether `error` is the one parseArgs throws for a command line it cannot read.
function isCliArgsError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    String((error as NodeJS.ErrnoException).code).startsWith("ERR_PARSE_ARGS_")
  );
}

type Outcome = "success" | "failure";

// Reports an error in the command line: the error into the log, and the usage text after it. The
// run then exits with a non-zero status (turbo-collection-core-spec.md R-CLI-1).
function reportCliUsageError(log: Logger, error: unknown): Outcome {
  logError(log, error);
  console.error(`\n${HELP_TEXT}`);
  return "failure";
}

// The version report (turbo-collection-core-spec.md R-CLI-16).
function versionReport(): string {
  return [
    `turbo-collection ${TurboCollectionVersion}`,
    ...SpecificationVersionStamps,
  ].join("\n");
}

// Carries out what the command line asks.
async function runCommand(tcCliArgs: TcCliArgs, log: Logger): Promise<Outcome> {
  if (tcCliArgs.help) {
    console.log(HELP_TEXT);
    return "success";
  }

  if (tcCliArgs.version) {
    console.log(versionReport());
    return "success";
  }

  if (tcCliArgs.command === undefined) {
    await runTurboCollection();
    return "success";
  }

  if (tcCliArgs.command !== "init") {
    return reportCliUsageError(
      log,
      new TcError(`Unknown command: ${tcCliArgs.command}`),
    );
  }

  // Given no directory, init acts on the current one (init-spec.md R-INIT-2).
  const [directory = ".", ...unexpected] = tcCliArgs.commandArgs;
  if (unexpected.length > 0) {
    return reportCliUsageError(
      log,
      new TcError(
        `init takes one directory, and was also given: ${unexpected.join(" ")}\nA path that holds a space needs quotes around it.`,
      ),
    );
  }

  initializeTc(directory, tcCliArgs.name, tcCliArgs.copy, log);
  return "success";
}

async function main(args: readonly string[]): Promise<void> {
  // The command line is read before the log is opened, since --log-dir says where the log goes. A
  // command line that cannot be read is an error of the run, logged in its own directory
  // (logging-spec.md R-LOG-10).
  let tcCliArgs: TcCliArgs | undefined;
  let cliArgsError: unknown;
  try {
    tcCliArgs = parseCliArgs(args);
  } catch (e) {
    if (!isCliArgsError(e)) {
      throw e;
    }
    cliArgsError = e;
  }

  // Every run, help and version among them, makes its own directory and writes its log
  // (logging-spec.md R-LOG-6).
  const opened = openRunLog(
    makeRunDirectory(runsDirectoryIn(os.tmpdir())),
    tcCliArgs?.logDir,
    tcCliArgs?.verbose ?? false,
  );
  using log = opened.log;
  logRunStart(log, args);

  // The error that ends a run is written into its log, and thrown again, so that Node reports it
  // and the run exits with a non-zero status (logging-spec.md R-LOG-4, R-LOG-12). A person sees
  // it twice on standard error: the error entry's line (R-LOG-9), then Node's report.
  let outcome: Outcome;
  try {
    if (opened.logDirectoryError !== undefined) {
      throw opened.logDirectoryError;
    }
    outcome =
      tcCliArgs === undefined
        ? reportCliUsageError(log, cliArgsError)
        : await runCommand(tcCliArgs, log);
  } catch (e) {
    logError(log, e);
    logRunEnd(log, true);
    throw e;
  }

  logRunEnd(log, outcome === "failure");
  if (outcome === "failure") {
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  await main(process.argv.slice(2));
}
