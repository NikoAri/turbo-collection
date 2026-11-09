import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { test, type TestContext } from "node:test";
import { fileURLToPath, URL } from "node:url";

import { parseCliArgs } from "../turbo-collection.ts";

test("the toolchain runs a test", () => {});

const entryPoint = fileURLToPath(
  new URL("../turbo-collection.ts", import.meta.url),
);

// A new, empty directory under `tmpdir()`, removed when test `t` ends. Its
// path is resolved, since on a Mac `tmpdir()` lies behind a link.
function temporaryDirectory(t: TestContext): string {
  const directory = realpathSync(
    mkdtempSync(path.join(tmpdir(), "turbo-collection-test-")),
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

// An environment for a run whose directory for temporary files is
// `temporary`, so that its log is made there (logging-spec.md R-LOG-6).
function environmentWithTemporaryDirectory(
  temporary: string,
): NodeJS.ProcessEnv {
  return { ...process.env, TEMP: temporary, TMP: temporary, TMPDIR: temporary };
}

// Runs `entryPoint` as a person would, with its directory for temporary files
// in `temporary`, and returns its exit status and what it printed.
function runTurboCollection(temporary: string, args: string[], cwd?: string) {
  return spawnSync(process.execPath, [entryPoint, ...args], {
    encoding: "utf8",
    env: environmentWithTemporaryDirectory(temporary),
    ...(cwd === undefined ? {} : { cwd }),
  });
}

// Logs of every run whose directory for temporary files is `temporary`.
function logsIn(temporary: string): string[] {
  const logs = path.join(temporary, "turbo-collection", "logs");
  return readdirSync(logs).map((name) => path.join(logs, name));
}

// Entries of log file `file`, one JSON object to a line.
function entriesOf(file: string): Record<string, unknown>[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => JSON.parse(line));
}

// Entries in a log of a lone run made with `temporary` as its directory for
// temporary files, where that log is in its default log directory.
function onlyRunEntries(temporary: string): Record<string, unknown>[] {
  const [log, ...others] = logsIn(temporary);
  assert.equal(others.length, 0);
  return entriesOf(log!);
}

// Where a TC Copy in `directory` keeps its configuration file
// (meta-file-spec.md R-MFILE-17).
function configurationFileOf(directory: string): string {
  return path.join(
    directory,
    ".turbo-collection",
    "turbo-collection-config.json",
  );
}

test("R-INIT-2: given no directory, init makes the current directory a TC Directory, and exits with status 0", (t) => {
  const temporary = temporaryDirectory(t);
  const directory = path.join(temporary, "Family Photos");
  mkdirSync(directory);

  const run = runTurboCollection(temporary, ["init"], directory);

  assert.equal(run.status, 0);
  assert.match(
    run.stdout,
    /Created Turbo Collection named "Family Photos", with TC Copy named "main", in /,
  );
  const tcConfig = readFileSync(configurationFileOf(directory), "utf8");
  assert.match(tcConfig, /"collectionName": "Family Photos"/);
  assert.match(tcConfig, /"tcCopyName": "main"/);
});

test("R-CLI-5: init is a command of its own, given the directory to act on", () => {
  assert.deepEqual(parseCliArgs(["init", "D:\\Photos"]), {
    help: false,
    version: false,
    verbose: false,
    logDir: undefined,
    init: {
      directory: "D:\\Photos",
      collectionName: undefined,
      tcCopyName: undefined,
      dryRun: false,
    },
    import: undefined,
    backup: undefined,
  });
});

test("R-CLI-5, R-INIT-5: --dry-run makes an init a dry run", () => {
  assert.equal(
    parseCliArgs(["init", "D:\\Photos", "--dry-run"]).init?.dryRun,
    true,
  );
});

test("R-INIT-5: an init dry run says what it would make, makes no directory, and exits with status 0", (t) => {
  const temporary = temporaryDirectory(t);
  const directory = path.join(temporary, "Family Photos");

  const run = runTurboCollection(temporary, ["init", directory, "--dry-run"]);

  assert.equal(run.status, 0, run.stderr);
  assert.match(
    run.stdout,
    /Would create Turbo Collection named "Family Photos", with TC Copy named "main", in /,
  );
  assert.equal(existsSync(directory), false);
});

test("R-INIT-5, R-CLI-18: an init dry run inside a TC Copy fails, as init would", (t) => {
  const temporary = temporaryDirectory(t);
  const tcDirectory = path.join(temporary, "photos");
  assert.equal(runTurboCollection(temporary, ["init", tcDirectory]).status, 0);
  const directory = path.join(tcDirectory, "2024");

  const run = runTurboCollection(temporary, ["init", directory, "--dry-run"]);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /lies inside a TC Copy at/);
  assert.equal(existsSync(directory), false);
});

test("R-INIT-2: init given no directory acts on the current one", () => {
  assert.equal(parseCliArgs(["init"]).init?.directory, ".");
});

test("R-INIT-4: the name of a new collection is given by --name, before the command or after it", () => {
  assert.equal(
    parseCliArgs(["init", "D:\\Photos", "--name", "Family Photos"]).init
      ?.collectionName,
    "Family Photos",
  );
  assert.equal(
    parseCliArgs(["init", "--name=Family Photos"]).init?.collectionName,
    "Family Photos",
  );
  assert.equal(
    parseCliArgs(["--name", "Family Photos", "init", "D:\\Photos"]).init
      ?.collectionName,
    "Family Photos",
  );
});

test("R-INIT-4: the name of a new TC Copy is given by --tc-copy", () => {
  assert.equal(
    parseCliArgs(["init", "D:\\Photos", "--tc-copy", "off-site"]).init
      ?.tcCopyName,
    "off-site",
  );
});

test("R-LOG-9, R-LOG-10: --verbose and --log-dir are read from the command line", () => {
  const tcCliArgs = parseCliArgs([
    "init",
    "--verbose",
    "--log-dir",
    "D:\\logs",
  ]);

  assert.equal(tcCliArgs.verbose, true);
  assert.equal(tcCliArgs.logDir, "D:\\logs");
});

test("R-CLI-1, R-LOG-6: asking for help exits with status 0, and names the init command and the default log directory, by its environment variable", (t) => {
  const temporary = temporaryDirectory(t);
  const run = runTurboCollection(temporary, ["--help"]);

  assert.equal(run.status, 0);
  assert.match(run.stdout, /init \[options\] \[<tc-directory>\]/);
  const typed = process.platform === "win32" ? "%TEMP%" : "$TMPDIR";
  assert.ok(
    run.stdout.includes(path.join(typed, "turbo-collection", "logs")),
    run.stdout,
  );
  assert.equal(run.stdout.includes(temporary), false, run.stdout);
});

test("R-LOG-6: help is a run, which writes its log into turbo-collection/logs/ in the directory for temporary files", (t) => {
  const temporary = temporaryDirectory(t);

  runTurboCollection(temporary, ["--help"]);

  assert.deepEqual(readdirSync(path.join(temporary, "turbo-collection")), [
    "logs",
  ]);
  const [log, ...others] = logsIn(temporary);
  assert.equal(others.length, 0);
  assert.match(path.basename(log!), /^tc-\d{8}T\d{6}Z-[0-9a-f]{4}\.log\.json$/);
});

test("R-CLI-16: the version report names the Turbo-Collection version and each specification's, and exits with status 0", (t) => {
  const run = runTurboCollection(temporaryDirectory(t), ["--version"]);

  assert.equal(run.status, 0);
  assert.match(run.stdout, /^turbo-collection 0\.1\.0$/m);
  assert.match(run.stdout, /^turbo-collection-spec 0\.1\.0-draft$/m);
  assert.match(run.stdout, /^meta-file-spec 0\.1\.0-draft$/m);
});

test("R-LOG-11: a run's log begins with run-start and ends with run-end, both verbose where the run succeeds", (t) => {
  const temporary = temporaryDirectory(t);

  runTurboCollection(temporary, ["--version"]);

  const entries = onlyRunEntries(temporary);
  assert.equal(entries[0]?.event, "run-start");
  assert.deepEqual(entries[0]?.arguments, ["--version"]);
  assert.equal(entries.at(-1)?.event, "run-end");
  assert.equal(entries.at(-1)?.verbose, true);
  assert.equal(entries.at(-1)?.outcome, undefined);
});

test("R-LOG-9: a verbose entry is shown only under --verbose", (t) => {
  const quiet = runTurboCollection(temporaryDirectory(t), ["--version"]);
  const verbose = runTurboCollection(temporaryDirectory(t), [
    "--version",
    "--verbose",
  ]);

  assert.doesNotMatch(quiet.stdout, /, node /);
  assert.doesNotMatch(quiet.stdout, /^Done$/m);
  assert.match(verbose.stdout, /^Turbo-Collection 0\.1\.0, node /m);
  assert.match(verbose.stdout, /^Done$/m);
});

test("R-CLI-1: an unknown command exits with a non-zero status, and is named", (t) => {
  const run = runTurboCollection(temporaryDirectory(t), ["bogus"]);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /Unknown command: bogus/);
});

test("R-LOG-10: an unknown command ends the run with an error, after the usage text, and writes no log", (t) => {
  const temporary = temporaryDirectory(t);

  const run = runTurboCollection(temporary, ["bogus"]);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /Usage:[\s\S]*Unknown command: bogus/);
  assert.equal(existsSync(path.join(temporary, "turbo-collection")), false);
});

test("R-LOG-10: a command line that cannot be read ends the run with an error, after the usage text, and writes no log", (t) => {
  const temporary = temporaryDirectory(t);
  const logDirectory = path.join(temporary, "logs");

  const run = runTurboCollection(temporary, [
    "--bogus",
    "--log-dir",
    logDirectory,
  ]);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /Usage:[\s\S]*--bogus/);
  assert.equal(existsSync(logDirectory), false);
  assert.equal(existsSync(path.join(temporary, "turbo-collection")), false);
});

test("R-CLI-1: init given a name that cannot be a TC Copy's name exits with a non-zero status, and says why", (t) => {
  const run = runTurboCollection(temporaryDirectory(t), [
    "init",
    "--tc-copy",
    "a/b",
  ]);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /cannot be a TC Copy's name/);
});

test("R-LOG-4, R-LOG-12: an error that ends a run is in its log, with its stack, before a failed run-end", (t) => {
  const temporary = temporaryDirectory(t);
  const directory = path.join(temporary, "photos");

  const run = runTurboCollection(temporary, [
    "init",
    directory,
    "--tc-copy",
    "a/b",
  ]);

  assert.equal(run.status, 1);
  assert.match(run.stderr, /^"a\/b" cannot be a TC Copy's name/m);
  assert.match(run.stderr, /^Failed$/m);
  const entries = onlyRunEntries(temporary);
  assert.deepEqual(
    entries.map((entry) => entry.event),
    ["run-start", "error", "run-end"],
  );
  assert.match(entries[1]?.stack as string, /^TcError: "a\/b" cannot be/);
  assert.equal(entries[2]?.outcome, "failure");
});

test("R-CLI-1: init given a path split at a space exits with a non-zero status, and names what is left over", (t) => {
  const run = runTurboCollection(temporaryDirectory(t), [
    "init",
    "D:\\My",
    "Photos",
  ]);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /also given: Photos/);
});

test("R-LOG-13: init's log holds the configuration it wrote", (t) => {
  const temporary = temporaryDirectory(t);
  const directory = path.join(temporary, "photos");

  runTurboCollection(temporary, ["init", directory]);

  const entries = onlyRunEntries(temporary);
  assert.deepEqual(
    entries.map((entry) => entry.event),
    ["run-start", "configuration", "message", "run-end"],
  );
  assert.deepEqual(
    (entries[1]?.configuration as Record<string, unknown>).collectionId,
    JSON.parse(readFileSync(configurationFileOf(directory), "utf8"))
      .collectionId,
  );
});

test("R-LOG-10: --log-dir puts the log into the directory it names, making it, and the run makes no directory in the directory for temporary files", (t) => {
  const temporary = temporaryDirectory(t);
  const logDirectory = path.join(temporary, "named", "logs");

  const run = runTurboCollection(temporary, [
    "--version",
    "--log-dir",
    logDirectory,
  ]);

  assert.equal(run.status, 0);
  assert.deepEqual(readdirSync(temporary), ["named"]);
  const [log, ...others] = readdirSync(logDirectory);
  assert.equal(others.length, 0);
  assert.match(log!, /^tc-\d{8}T\d{6}Z-[0-9a-f]{4}\.log\.json$/);
  assert.equal(entriesOf(path.join(logDirectory, log!))[0]?.event, "run-start");
});

test("R-LOG-10: a log directory inside a TC Copy is an error, and the run makes nothing in the TC Copy and writes no log", (t) => {
  const temporary = temporaryDirectory(t);
  const tcDirectory = path.join(temporary, "photos");
  assert.equal(runTurboCollection(temporary, ["init", tcDirectory]).status, 0);
  const second = temporaryDirectory(t);

  const run = runTurboCollection(second, [
    "--version",
    "--log-dir",
    path.join(tcDirectory, "logs"),
  ]);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /lies inside a TC Copy/);
  assert.deepEqual(readdirSync(tcDirectory).sort(), [
    ".tcignore",
    ".turbo-collection",
  ]);
  assert.deepEqual(readdirSync(second), []);
});

// Runs `entryPoint` without waiting for it, with its directory for temporary
// files in `temporary`.
function startTurboCollection(
  temporary: string,
  args: string[],
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entryPoint, ...args], {
      env: environmentWithTemporaryDirectory(temporary),
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

// How many inits are started at once on one directory.
const InitsAtOnce = 20;

test("R-PARALLEL-2, R-PARALLEL-3: of many inits at once on one directory, exactly one makes it a TC Directory, and every other ends with an error", async (t) => {
  const temporary = temporaryDirectory(t);
  const directory = path.join(temporary, "photos");

  const runs = await Promise.all(
    Array.from({ length: InitsAtOnce }, () =>
      startTurboCollection(temporary, ["init", directory]),
    ),
  );

  const made = runs.filter((run) => run.status === 0);
  const failed = runs.filter((run) => run.status !== 0);
  assert.equal(made.length, 1);
  const lateToWrite = failed.filter((run) =>
    /Another run made .* a TC Directory first/.test(run.stderr),
  ).length;
  const lateToLook = failed.filter((run) =>
    /that the starter \.tcignore does not ignore/.test(run.stderr),
  ).length;
  assert.equal(lateToWrite + lateToLook, failed.length);
  t.diagnostic(
    `${lateToWrite} found the configuration file at write, ${lateToLook} found files on looking`,
  );

  const listed = readdirSync(directory, { recursive: true, encoding: "utf8" })
    .map((entry) => entry.replaceAll("\\", "/"))
    .sort();
  assert.deepEqual(listed, [
    ".tcignore",
    ".turbo-collection",
    ".turbo-collection/turbo-collection-config.json",
  ]);
  assert.equal(logsIn(temporary).length, InitsAtOnce);
});

test("R-SRC-25: import is given a directory to import from, then a TC Directory", () => {
  assert.deepEqual(
    parseCliArgs(["import", "D:\\moon-laptop", "E:\\Photos"]).import,
    {
      importDirectory: "D:\\moon-laptop",
      tcDirectory: "E:\\Photos",
      dryRun: false,
    },
  );
});

test("R-SRC-14: --dry-run makes an import a dry run", () => {
  assert.equal(
    parseCliArgs(["import", "D:\\moon-laptop", "E:\\Photos", "--dry-run"])
      .import?.dryRun,
    true,
  );
});

test("R-CLI-23: -n is --dry-run, and an argument after -- is an operand", () => {
  assert.equal(
    parseCliArgs(["import", "-n", "D:\\moon-laptop"]).import?.dryRun,
    true,
  );
  assert.equal(
    parseCliArgs(["init", "--", "-photos"]).init?.directory,
    "-photos",
  );
});

test("R-CLI-23: --help and --version pass over a command's arguments and options, but not the log's", () => {
  assert.deepEqual(parseCliArgs(["backup", "--help"]), {
    help: true,
    version: false,
    verbose: false,
    logDir: undefined,
    init: undefined,
    import: undefined,
    backup: undefined,
  });
  assert.equal(
    parseCliArgs(["init", "a", "b", "--name", "x", "--version"]).version,
    true,
  );
  assert.equal(
    parseCliArgs(["import", "--help", "--log-dir", "D:\\logs"]).logDir,
    "D:\\logs",
  );
});

test("R-CLI-23, R-LOG-10: --help with an unknown option or command is still an error", () => {
  assert.throws(() => parseCliArgs(["--help", "--bogus"]), /--bogus/);
  assert.throws(
    () => parseCliArgs(["--help", "bogus"]),
    /Unknown command: bogus/,
  );
});

test("R-CLI-23: backup --help shows help and exits with status 0", (t) => {
  const run = runTurboCollection(temporaryDirectory(t), ["backup", "--help"]);

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /^Usage:$/m);
});

test("R-LOG-10: an option its command does not take is an error", () => {
  assert.throws(
    () => parseCliArgs(["import", "D:\\x", "--tc-copy", "home", "--name", "x"]),
    /import does not take --name or --tc-copy\./,
  );
  assert.throws(
    () => parseCliArgs(["backup", "D:\\x", "--name", "Photos"]),
    /backup does not take --name\./,
  );
  assert.throws(
    () => parseCliArgs(["--tc-copy", "home"]),
    /A run with no command does not take --tc-copy\./,
  );
});

test("R-SRC-25, R-LOG-10: import given no directory to import from, or a directory after its TC Directory, is an error", () => {
  assert.throws(
    () => parseCliArgs(["import"]),
    /import takes a directory to import from, then an optional TC Directory, and was given none/,
  );
  assert.throws(
    () => parseCliArgs(["import", "local-folder", "D:\\x", "E:\\Photos"]),
    /and was also given: E:\\Photos/,
  );
});

test("R-SRC-25: import may be given no TC Directory", () => {
  assert.deepEqual(parseCliArgs(["import", "D:\\moon-laptop"]).import, {
    importDirectory: "D:\\moon-laptop",
    tcDirectory: undefined,
    dryRun: false,
  });
});

test("R-SRC-25, R-CLI-22: import given no TC Directory imports into whichever TC Copy its working directory lies inside", (t) => {
  const temporary = temporaryDirectory(t);
  const tcDirectory = path.join(temporary, "photos");
  assert.equal(runTurboCollection(temporary, ["init", tcDirectory]).status, 0);
  const workingDirectory = path.join(tcDirectory, "2024");
  mkdirSync(workingDirectory);
  const folder = path.join(temporary, "moon-laptop");
  mkdirSync(folder);
  writeFileSync(path.join(folder, "notes.txt"), "notes");

  const run = runTurboCollection(
    temporary,
    ["import", folder],
    workingDirectory,
  );

  assert.equal(run.status, 0);
  assert.equal(
    readFileSync(
      path.join(tcDirectory, "local-folder", "moon-laptop", "notes.txt"),
      "utf8",
    ),
    "notes",
  );
});

test("R-SRC-25, R-CLI-22: import given no TC Directory, from a working directory in no TC Copy, is an error and imports nothing", (t) => {
  const temporary = temporaryDirectory(t);
  const folder = path.join(temporary, "moon-laptop");
  mkdirSync(folder);
  writeFileSync(path.join(folder, "notes.txt"), "notes");

  const run = runTurboCollection(temporary, ["import", folder], temporary);

  assert.notEqual(run.status, 0);
  assert.match(
    run.stderr,
    /A TC Directory was left out, and ".*" is in no TC Copy to take it from/,
  );
  assert.equal(existsSync(path.join(temporary, "local-folder")), false);
});

test("R-SRC-25: import imports into the TC Copy in the TC Directory it is given, says what it imported, and exits with status 0", (t) => {
  const temporary = temporaryDirectory(t);
  const tcDirectory = path.join(temporary, "photos");
  assert.equal(runTurboCollection(temporary, ["init", tcDirectory]).status, 0);
  const folder = path.join(temporary, "moon-laptop");
  mkdirSync(folder);
  writeFileSync(path.join(folder, "notes.txt"), "notes");

  const run = runTurboCollection(temporary, ["import", folder, tcDirectory]);

  assert.equal(run.status, 0);
  assert.match(run.stdout, /^Imported 1 file \(5 bytes\) from /m);
  assert.equal(
    readFileSync(
      path.join(tcDirectory, "local-folder", "moon-laptop", "notes.txt"),
      "utf8",
    ),
    "notes",
  );
});

test("R-SRC-23, R-CLI-1: an import that leaves a file out exits with a non-zero status, and names the file on standard error", (t) => {
  const temporary = temporaryDirectory(t);
  const tcDirectory = path.join(temporary, "photos");
  assert.equal(runTurboCollection(temporary, ["init", tcDirectory]).status, 0);
  const folder = path.join(temporary, "moon-laptop");
  mkdirSync(folder);
  writeFileSync(path.join(folder, "notes.txt"), "notes");
  const args = ["import", folder, tcDirectory];
  assert.equal(runTurboCollection(temporary, args).status, 0);
  writeFileSync(path.join(folder, "notes.txt"), "notes, edited");

  const run = runTurboCollection(temporary, args);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /notes\.txt" is left out/);
});

test("R-BACKUP-1, R-BACKUP-10: backup is given two directories, --tc-copy names a TC Copy it makes, and --dry-run makes it a dry run", () => {
  assert.deepEqual(
    parseCliArgs(["backup", "D:\\Photos", "E:\\Photos"]).backup,
    {
      directories: ["D:\\Photos", "E:\\Photos"],
      tcCopyName: undefined,
      dryRun: false,
    },
  );
  assert.deepEqual(
    parseCliArgs([
      "backup",
      "D:\\Photos",
      "E:\\Photos",
      "--tc-copy",
      "home",
      "--dry-run",
    ]).backup,
    {
      directories: ["D:\\Photos", "E:\\Photos"],
      tcCopyName: "home",
      dryRun: true,
    },
  );
});

test("R-BACKUP-1, R-LOG-10: backup given no directory, or a directory after its second, is an error", () => {
  assert.throws(
    () => parseCliArgs(["backup"]),
    /backup takes two TC Directories, the second optional, and was given none/,
  );
  assert.throws(
    () => parseCliArgs(["backup", "a", "b", "c"]),
    /and was also given: c/,
  );
});

test("R-BACKUP-1: backup may be given one directory", () => {
  assert.deepEqual(parseCliArgs(["backup", "D:\\Photos"]).backup, {
    directories: ["D:\\Photos", undefined],
    tcCopyName: undefined,
    dryRun: false,
  });
});

test("R-BACKUP-1, R-CLI-22: backup given one directory mirrors it with whichever TC Copy its working directory is in", (t) => {
  const temporary = temporaryDirectory(t);
  const tcDirectory = path.join(temporary, "photos");
  assert.equal(runTurboCollection(temporary, ["init", tcDirectory]).status, 0);
  const folder = path.join(temporary, "moon-laptop");
  mkdirSync(folder);
  writeFileSync(path.join(folder, "notes.txt"), "notes");
  assert.equal(
    runTurboCollection(temporary, ["import", folder], tcDirectory).status,
    0,
  );
  const home = path.join(temporary, "home");

  const run = runTurboCollection(
    temporary,
    ["backup", home, "--tc-copy", "home"],
    tcDirectory,
  );

  assert.equal(run.status, 0, run.stderr);
  assert.equal(
    readFileSync(
      path.join(home, "local-folder", "moon-laptop", "notes.txt"),
      "utf8",
    ),
    "notes",
  );
});

test("R-BACKUP-1, R-LOG-16: a backup makes a new TC Copy, says what it copied into each TC Copy, and exits with status 0; the next copies nothing", (t) => {
  const temporary = temporaryDirectory(t);
  const tcDirectory = path.join(temporary, "photos");
  assert.equal(runTurboCollection(temporary, ["init", tcDirectory]).status, 0);
  const folder = path.join(temporary, "moon-laptop");
  mkdirSync(folder);
  writeFileSync(path.join(folder, "notes.txt"), "notes");
  assert.equal(
    runTurboCollection(temporary, ["import", folder, tcDirectory]).status,
    0,
  );
  const home = path.join(temporary, "backup", "photos");
  const args = ["backup", tcDirectory, home, "--tc-copy", "home"];

  const run = runTurboCollection(temporary, args);

  assert.equal(run.status, 0, run.stderr);
  assert.match(
    run.stdout,
    /^Created for Turbo Collection named "photos" a TC Copy named "home", in /m,
  );
  assert.match(run.stdout, /^Copied 1 file \(5 bytes\) into "home" at /m);
  assert.match(run.stdout, /^Copied 0 files \(0 bytes\) into "main" at /m);
  assert.equal(
    readFileSync(
      path.join(home, "local-folder", "moon-laptop", "notes.txt"),
      "utf8",
    ),
    "notes",
  );

  const again = runTurboCollection(temporary, ["backup", tcDirectory, home]);

  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /^Copied 0 files \(0 bytes\) into "home" at /m);
});

test("R-BACKUP-12, R-CLI-1: a backup that finds a file no manifest lists exits with a non-zero status, and names the file on standard error", (t) => {
  const temporary = temporaryDirectory(t);
  const tcDirectory = path.join(temporary, "photos");
  assert.equal(runTurboCollection(temporary, ["init", tcDirectory]).status, 0);
  writeFileSync(path.join(tcDirectory, "by-hand.txt"), "by hand");
  const home = path.join(temporary, "home");

  const run = runTurboCollection(temporary, [
    "backup",
    tcDirectory,
    home,
    "--tc-copy",
    "home",
  ]);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /by-hand\.txt" is listed in no manifest/);
  assert.equal(existsSync(path.join(home, "by-hand.txt")), false);
});
