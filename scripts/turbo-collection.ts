import console from "node:console";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";

import { backUp, type BackupArgs } from "./backup.ts";
import { TcError } from "./helpers/tc-error.ts";
import { importIntoTcCopy, type ImportArgs } from "./import.ts";
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
  turbo-collection init [options] [<tc-directory>]
  turbo-collection import [options] <import-directory> [<tc-directory>]
  turbo-collection backup [options] <tc-directory-1> [<tc-directory-2>]

init [options] [<tc-directory>]
  Make the first TC Copy of a new collection in <tc-directory>, creating it
  where it does not exist. Default <tc-directory>: the current directory.

      --name <name>      Name the new collection. Default: name of its
                         directory.
      --tc-copy <name>   Name the new TC Copy. Default: "main".

import [options] <import-directory> [<tc-directory>]
  Import every file in <import-directory> into the TC Copy in <tc-directory>:
  each photo and video by its date, and every other file under
  local-folder/<name of import-directory>/, at its path there.
  Default <tc-directory>: the TC Copy the current directory is in.

backup [options] <tc-directory-1> [<tc-directory-2>]
  Copy into each of two TC Copies every file the other holds and it lacks,
  whichever order they are given in. Where one directory is not a TC
  Directory yet, and holds no file, make a TC Copy there.
  Default <tc-directory-2>: the TC Copy the current directory is in.

      --tc-copy <name>   Name the TC Copy this backup makes. Default: none;
                         required when it makes one.

Options for every command:
  -n, --dry-run          Make every check, say what the command would do, and
                         change nothing. Default: off.
      --verbose          Also show the details that the run's log holds.
                         Default: off.
      --log-dir <dir>    Write the run's log into <dir>. Default:
                         ${defaultLogDirectory(temporaryDirectoryAsTyped())}
  -h, --help             Show this help and exit.
      --version          Show the version of Turbo-Collection and of each
                         specification it conforms to, and exit.
`;

// How help names a run's directory for temporary files: as a person would type
// it, %TEMP% on Windows and $TMPDIR elsewhere, where that variable holds
// `os.tmpdir()`, so that help shows no user's name. Otherwise, as `os.tmpdir()`
// gives it.
function temporaryDirectoryAsTyped(): string {
  const [variable, typed] =
    process.platform === "win32" ? ["TEMP", "%TEMP%"] : ["TMPDIR", "$TMPDIR"];
  const value = process.env[variable];
  return value !== undefined && path.resolve(value) === os.tmpdir()
    ? typed
    : os.tmpdir();
}

async function runTurboCollection(): Promise<void> {
  logger.log("Turbo-Collection");
}

type TcCliArgs = {
  help: boolean;
  // --version: report versions (turbo-collection-core-spec.md R-CLI-16)
  version: boolean;
  // --verbose: show verbose log entries too (logging-spec.md R-LOG-9)
  verbose: boolean;
  // --log-dir: where this run's log goes (logging-spec.md R-LOG-10)
  logDir: string | undefined;
  // What a command line gives init, where it names init
  init: InitArgs | undefined;
  // What a command line gives import, where it names import
  import: ImportArgs | undefined;
  // What a command line gives backup, where it names backup
  backup: BackupArgs | undefined;
};

// Reads command line `args`, as POSIX's Utility Syntax Guidelines and GNU's
// long options describe (turbo-collection-core-spec.md R-CLI-23). An unknown
// command or option, an option its command does not take, and a directory too
// few or too many for its command, are each an error. Given --help or
// --version, a command line's other arguments are passed over, its log's
// options aside, so that `backup --help` shows help.
export function parseCliArgs(args: readonly string[]): TcCliArgs {
  const { values, positionals } = parseArgs({
    args: [...args],
    options: {
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", default: false },
      verbose: { type: "boolean", default: false },
      "log-dir": { type: "string" },
      name: { type: "string" },
      "tc-copy": { type: "string" },
      // -n, as in GNU's table of long options
      "dry-run": { type: "boolean", short: "n", default: false },
    },
    allowPositionals: true,
  });
  const [command, ...commandArgs] = positionals;

  if (
    command !== undefined &&
    command !== "init" &&
    command !== "import" &&
    command !== "backup"
  ) {
    throw new TcError(`Unknown command: ${command}`);
  }
  if (values.help || values.version) {
    return {
      help: values.help,
      version: values.version,
      verbose: values.verbose,
      logDir: values["log-dir"],
      init: undefined,
      import: undefined,
      backup: undefined,
    };
  }
  const notTaken = (["name", "tc-copy"] as const).filter(
    (option) =>
      values[option] !== undefined && !optionsTakenBy(command).includes(option),
  );
  if (notTaken.length > 0) {
    throw new TcError(
      `${command ?? "A run with no command"} does not take ${notTaken.map((option) => `--${option}`).join(" or ")}.`,
    );
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
            tcCopyName: values["tc-copy"],
            dryRun: values["dry-run"],
          }
        : undefined,
    import:
      command === "import"
        ? importArgsOf(commandArgs, values["dry-run"])
        : undefined,
    backup:
      command === "backup"
        ? {
            directories: backupDirectoriesOf(commandArgs),
            tcCopyName: values["tc-copy"],
            dryRun: values["dry-run"],
          }
        : undefined,
  };
}

// Options `command` takes, beside --help, --version, --verbose, --log-dir and
// --dry-run, which every run takes (turbo-collection-core-spec.md R-CLI-5).
function optionsTakenBy(command: string | undefined): readonly string[] {
  switch (command) {
    case "init":
      return ["name", "tc-copy"];
    case "backup":
      return ["tc-copy"];
    default:
      return [];
  }
}

// Which directories backup is given in `commandArgs`, every argument after
// backup: two TC Directories, in either order, the second optional
// (backup-spec.md R-BACKUP-1).
function backupDirectoriesOf(
  commandArgs: readonly string[],
): readonly [string, string | undefined] {
  const [first, second, ...unexpected] = commandArgs;
  if (first === undefined) {
    throw new TcError(
      "backup takes two TC Directories, the second optional, and was given none: backup <tc-directory-1> [<tc-directory-2>]",
    );
  }
  if (unexpected.length > 0) {
    throw new TcError(
      `backup takes two TC Directories, the second optional, and was also given: ${unexpected.join(" ")}\nA path that holds a space needs quotes around it.`,
    );
  }
  return [first, second];
}

// Which directory init is given in `commandArgs`, every argument after init.
// Given none, init acts on its working directory (init-spec.md R-INIT-2).
function initDirectoryOf(commandArgs: readonly string[]): string {
  const [directory = ".", ...unexpected] = commandArgs;
  if (unexpected.length > 0) {
    throw new TcError(
      `init takes one directory, and was also given: ${unexpected.join(" ")}\nA path that holds a space needs quotes around it.`,
    );
  }
  return directory;
}

// What import is given in `commandArgs`, every argument after import: a
// directory to import from, then an optional TC Directory (import-spec.md
// R-SRC-25).
function importArgsOf(
  commandArgs: readonly string[],
  dryRun: boolean,
): ImportArgs {
  const [importDirectory, tcDirectory, ...unexpected] = commandArgs;
  if (importDirectory === undefined) {
    throw new TcError(
      "import takes a directory to import from, then an optional TC Directory, and was given none: import <import-directory> [<tc-directory>]",
    );
  }
  if (unexpected.length > 0) {
    throw new TcError(
      `import takes a directory to import from, then an optional TC Directory, and was also given: ${unexpected.join(" ")}\nA path that holds a space needs quotes around it.`,
    );
  }
  return { importDirectory, tcDirectory, dryRun };
}

// A version report (turbo-collection-core-spec.md R-CLI-16).
function getVersionReportString(): string {
  return [
    `turbo-collection ${TurboCollectionVersion}`,
    ...SpecificationVersionStamps,
  ].join("\n");
}

// Carries out what `tcCliArgs` asks, in run `runId`.
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
    await importIntoTcCopy(tcCliArgs.import, runId);
    return;
  }

  if (tcCliArgs.backup !== undefined) {
    await backUp(tcCliArgs.backup, runId);
    return;
  }

  await runTurboCollection();
}

async function main(args: readonly string[]): Promise<void> {
  // A command line is read before its run's log is opened, since --log-dir
  // says where that log goes. A command line that cannot be read ends its
  // run, after HELP_TEXT, with no log (logging-spec.md R-LOG-10).
  let tcCliArgs: TcCliArgs;
  try {
    tcCliArgs = parseCliArgs(args);
  } catch (e) {
    console.error(HELP_TEXT);
    throw e;
  }

  // Configure Logger
  // Every run, help and version among them,
  // writes its log: into whichever directory --log-dir names,
  // and otherwise into its default log directory
  // (logging-spec.md R-LOG-6, R-LOG-10). A --log-dir
  // a run cannot use ends it with an error,
  // before it has a log.
  if (tcCliArgs.logDir !== undefined) {
    ensureUsableLogDirectory(tcCliArgs.logDir);
  }
  const logDirectory = tcCliArgs.logDir ?? defaultLogDirectory(os.tmpdir());

  // `logger` writes into `runLog` until that is disposed of
  using runLog = createRunLog(logDirectory, /*verbose*/ tcCliArgs.verbose);
  // Disposed of before `runLog`, being declared after it,
  // so that run-end is its log's last entry.
  using runScope = new RunScope(args);

  // Run Command
  // An error that ends a run is written into its log, and thrown again,
  // so that Node reports it
  // and that run exits with a non-zero status
  // (logging-spec.md R-LOG-4, R-LOG-12). A person sees
  // it twice on standard error: its `error` entry's line (R-LOG-9),
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
