import console from "node:console";
import os from "node:os";
import process from "node:process";
import { parseArgs } from "node:util";

import { TcError } from "./helpers/tc-error.ts";
import { initializeTc, type InitArgs } from "./init.ts";
import {
  createRunLog,
  defaultLogDirectory,
  ensureUsableLogDirectory,
  logger,
  RunScope,
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
  logger.log("Turbo-Collection");
}

type TcCliArgs = {
  help: boolean;
  // --version: report the versions (turbo-collection-core-spec.md R-CLI-16)
  version: boolean;
  // --verbose: show verbose log entries too (logging-spec.md R-LOG-9)
  verbose: boolean;
  // --log-dir: where the run's log goes (logging-spec.md R-LOG-10)
  logDir: string | undefined;
  // What the command line gives init, where it names init
  init: InitArgs | undefined;
};

// Reads the command line. An unknown option or command, or init given more
// than one directory, is an error.
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

  if (command !== undefined && command !== "init") {
    throw new TcError(`Unknown command: ${command}`);
  }

  // Given no directory, init acts on the current one (init-spec.md R-INIT-2).
  const [directory = ".", ...unexpected] = commandArgs;
  if (unexpected.length > 0) {
    throw new TcError(
      `init takes one directory, and was also given: ${unexpected.join(" ")}\nA path that holds a space needs quotes around it.`,
    );
  }

  return {
    help: values.help,
    version: values.version,
    verbose: values.verbose,
    logDir: values["log-dir"],
    init:
      command === "init"
        ? { directory, collectionName: values.name, copyName: values.copy }
        : undefined,
  };
}

// The version report (turbo-collection-core-spec.md R-CLI-16).
function getVersionReportString(): string {
  return [
    `turbo-collection ${TurboCollectionVersion}`,
    ...SpecificationVersionStamps,
  ].join("\n");
}

// Carries out what the command line asks.
async function runCommand(tcCliArgs: TcCliArgs): Promise<void> {
  if (tcCliArgs.help) {
    logger.log(HELP_TEXT);
    return;
  }

  if (tcCliArgs.version) {
    logger.log(getVersionReportString());
    return;
  }

  if (tcCliArgs.init !== undefined) {
    initializeTc(tcCliArgs.init);
    return;
  }

  await runTurboCollection();
}

async function main(args: readonly string[]): Promise<void> {
  // The command line is read before the log is opened, since --log-dir says
  // where the log goes. A command line that cannot be read ends the run,
  // after the usage text, with no log (logging-spec.md R-LOG-10).
  let tcCliArgs: TcCliArgs;
  try {
    tcCliArgs = parseCliArgs(args);
  } catch (e) {
    console.error(HELP_TEXT);
    throw e;
  }

  // Configure Logger
  // Every run, help and version among them,
  // writes its log: into the directory --log-dir names,
  // and otherwise into the default log directory
  // (logging-spec.md R-LOG-6, R-LOG-10). A --log-dir
  // the run cannot use ends it with an error,
  // before it has a log.
  if (tcCliArgs.logDir !== undefined) {
    ensureUsableLogDirectory(tcCliArgs.logDir);
  }
  const logDirectory = tcCliArgs.logDir ?? defaultLogDirectory(os.tmpdir());

  // `logger` writes into the run's log until it is disposed of
  using _runLog = createRunLog(logDirectory, /*verbose*/ tcCliArgs.verbose);
  // Disposed of before `_runLog`, being declared after it,
  // so that run-end is the log's last entry.
  using runScope = new RunScope(args);

  // Run Command
  // The error that ends a run is written into its log, and thrown again,
  // so that Node reports it
  // and the run exits with a non-zero status
  // (logging-spec.md R-LOG-4, R-LOG-12). A person sees
  // it twice on standard error: the error entry's line (R-LOG-9),
  // then Node's report.
  try {
    await runCommand(tcCliArgs);
  } catch (e) {
    runScope.error = e;

    // Rethrow
    throw e;
  }
}

if (import.meta.main) {
  await main(process.argv.slice(2));
}
