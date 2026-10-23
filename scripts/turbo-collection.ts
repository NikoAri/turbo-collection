import console from "node:console";
import os from "node:os";
import process from "node:process";
import { parseArgs } from "node:util";

import { TcError } from "./helpers/tc-error.ts";
import { importIntoCopy, type ImportArgs } from "./import.ts";
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
  turbo-collection import local-folder <directory> [<copy>] [--dry-run]

Commands:
  init [<directory>]  Make <directory> the first copy of a new collection,
                      creating it where it does not exist. Without
                      <directory>, the current directory.
  import local-folder <directory> [<copy>]
                      Import every file in <directory> into the copy
                      <copy>, under local-folder/<name of directory>/, each
                      at its path there. Without <copy>, the current
                      directory.

Options:
  -n, --name <name>      Name the new collection. Without it, the collection
                         takes the name of its directory.
      --copy <name>      Name the new copy. Without it, the copy is "main".
      --dry-run          With import, say what it would import, and change
                         nothing.
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
  // What the command line gives import, where it names import
  import: ImportArgs | undefined;
};

// Reads the command line. An unknown option, command or import source, init
// given more than one directory, and import given no directory or more than a
// directory and a copy, are each an error.
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
      "dry-run": { type: "boolean", default: false },
    },
    allowPositionals: true,
  });
  const [command, ...commandArgs] = positionals;

  if (command !== undefined && command !== "init" && command !== "import") {
    throw new TcError(`Unknown command: ${command}`);
  }

  return {
    help: values.help,
    version: values.version,
    verbose: values.verbose,
    logDir: values["log-dir"],
    init:
      command === "init"
        ? {
            directory: initDirectoryOf(commandArgs),
            collectionName: values.name,
            copyName: values.copy,
          }
        : undefined,
    import:
      command === "import"
        ? importArgsOf(commandArgs, values["dry-run"])
        : undefined,
  };
}

// The directory init is given in `commandArgs`, the arguments after init.
// Given none, init acts on the current one (init-spec.md R-INIT-2).
function initDirectoryOf(commandArgs: readonly string[]): string {
  const [directory = ".", ...unexpected] = commandArgs;
  if (unexpected.length > 0) {
    throw new TcError(
      `init takes one directory, and was also given: ${unexpected.join(" ")}\nA path that holds a space needs quotes around it.`,
    );
  }
  return directory;
}

// What import is given in `commandArgs`, the arguments after import: the
// import source, local-folder alone, then the directory and the copy. Given
// no copy, import acts on the current directory (import-spec.md R-SRC-25).
function importArgsOf(
  commandArgs: readonly string[],
  dryRun: boolean,
): ImportArgs {
  const [importSource, directory, copy = ".", ...unexpected] = commandArgs;
  if (importSource !== "local-folder") {
    throw new TcError(
      importSource === undefined
        ? "import takes an import source: import local-folder <directory> [<copy>]"
        : `Unknown import source: ${importSource}. The one there is: local-folder.`,
    );
  }
  if (directory === undefined) {
    throw new TcError(
      "import local-folder takes the directory to import: import local-folder <directory> [<copy>]",
    );
  }
  if (unexpected.length > 0) {
    throw new TcError(
      `import local-folder takes a directory and a copy, and was also given: ${unexpected.join(" ")}\nA path that holds a space needs quotes around it.`,
    );
  }
  return { directory, copy, dryRun };
}

// The version report (turbo-collection-core-spec.md R-CLI-16).
function getVersionReportString(): string {
  return [
    `turbo-collection ${TurboCollectionVersion}`,
    ...SpecificationVersionStamps,
  ].join("\n");
}

// Carries out what the command line asks, in the run `runId`.
async function runCommand(tcCliArgs: TcCliArgs, runId: string): Promise<void> {
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

  if (tcCliArgs.import !== undefined) {
    await importIntoCopy(tcCliArgs.import, runId);
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
  using runLog = createRunLog(logDirectory, /*verbose*/ tcCliArgs.verbose);
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
    await runCommand(tcCliArgs, runLog.runId);
  } catch (e) {
    runScope.error = e;

    // Rethrow
    throw e;
  }
}

if (import.meta.main) {
  await main(process.argv.slice(2));
}
