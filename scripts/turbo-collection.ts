import console from "node:console";
import os from "node:os";
import process from "node:process";
import { parseArgs } from "node:util";

import { TcError } from "./helpers/tc-error.ts";
import { initializeTc } from "./init.ts";
import {
  createRunLog,
  defaultLogDirectory,
  ensureUsableLogDirectory,
  logRunEnd,
  logRunStart,
  type Logger,
} from "./logger.ts";
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
  // --version: report the versions (turbo-collection-core-spec.md R-CLI-16)
  version: boolean;
  // --verbose: show verbose log entries too (logging-spec.md R-LOG-9)
  verbose: boolean;
  // --log-dir: where the run's log goes (logging-spec.md R-LOG-10)
  logDir: string | undefined;
  // -n, --name: what a new collection is called
  name: string | undefined;
  // --copy: what a new copy is called
  copy: string | undefined;
  // The first argument that is not an option: `init`
  command: string | undefined;
  // What follows the command: the directory init is given
  commandArgs: string[];
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

// Whether `error` is what parseArgs throws for a command line it cannot read.
function isCliArgsError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    String((error as NodeJS.ErrnoException).code).startsWith("ERR_PARSE_ARGS_")
  );
}

// Reports an error in the command line: the error into the log, and the usage
// text after it. The run did not succeed, so it exits with a non-zero status
// (turbo-collection-core-spec.md R-CLI-1).
function reportCliUsageError(logger: Logger, error: unknown): boolean {
  logger.error(error);
  console.error(`\n${HELP_TEXT}`);
  return false;
}

// The version report (turbo-collection-core-spec.md R-CLI-16).
function versionReport(): string {
  return [
    `turbo-collection ${TurboCollectionVersion}`,
    ...SpecificationVersionStamps,
  ].join("\n");
}

// Carries out what the command line asks; returns whether the run succeeded.
async function runCommand(
  tcCliArgs: TcCliArgs,
  logger: Logger,
): Promise<boolean> {
  if (tcCliArgs.help) {
    console.log(HELP_TEXT);
    return true;
  }

  if (tcCliArgs.version) {
    console.log(versionReport());
    return true;
  }

  if (tcCliArgs.command === undefined) {
    await runTurboCollection();
    return true;
  }

  if (tcCliArgs.command !== "init") {
    return reportCliUsageError(
      logger,
      new TcError(`Unknown command: ${tcCliArgs.command}`),
    );
  }

  // Given no directory, init acts on the current one (init-spec.md R-INIT-2).
  const [directory = ".", ...unexpected] = tcCliArgs.commandArgs;
  if (unexpected.length > 0) {
    return reportCliUsageError(
      logger,
      new TcError(
        `init takes one directory, and was also given: ${unexpected.join(" ")}\nA path that holds a space needs quotes around it.`,
      ),
    );
  }

  initializeTc(directory, tcCliArgs.name, tcCliArgs.copy, logger);
  return true;
}

async function main(args: readonly string[]): Promise<void> {
  // The command line is read before the log is opened, since --log-dir says
  // where the log goes. A command line that cannot be read is an error of the
  // run, logged in the default log directory (logging-spec.md R-LOG-6).
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

  // Every run, help and version among them,
  // writes its log: into the directory --log-dir names,
  // and otherwise into the default log directory
  // (logging-spec.md R-LOG-6, R-LOG-10). A --log-dir
  // the run cannot use ends it with an error,
  // before it has a log.
  if (tcCliArgs?.logDir !== undefined) {
    ensureUsableLogDirectory(tcCliArgs.logDir);
  }
  const logDirectory = tcCliArgs?.logDir ?? defaultLogDirectory(os.tmpdir());

  using logger = createRunLog(
    logDirectory,
    /*verbose*/ tcCliArgs?.verbose ?? false,
  );
  logRunStart(logger, args);

  // The error that ends a run is written into its log, and thrown again,
  // so that Node reports it
  // and the run exits with a non-zero status
  // (logging-spec.md R-LOG-4, R-LOG-12). A person sees
  // it twice on standard error: the error entry's line (R-LOG-9),
  // then Node's report.
  let succeeded: boolean;
  try {
    succeeded =
      tcCliArgs === undefined
        ? reportCliUsageError(logger, cliArgsError)
        : await runCommand(tcCliArgs, logger);
  } catch (e) {
    logger.error(e);
    logRunEnd(logger, true);
    throw e;
  }

  logRunEnd(logger, !succeeded);
  if (!succeeded) {
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  await main(process.argv.slice(2));
}
