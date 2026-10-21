import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
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

// A new, empty directory under the system's temporary directory, removed when
// the test ends. Its path is resolved, since on a Mac the temporary directory
// lies behind a link.
function temporaryDirectory(t: TestContext): string {
  const directory = realpathSync(
    mkdtempSync(path.join(tmpdir(), "turbo-collection-test-")),
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

// The environment of a run whose directory for temporary files is `temporary`,
// so that the run's log is made there (logging-spec.md R-LOG-6).
function environmentWithTemporaryDirectory(
  temporary: string,
): NodeJS.ProcessEnv {
  return { ...process.env, TEMP: temporary, TMP: temporary, TMPDIR: temporary };
}

// Runs the entry point as a person would, with its directory for temporary
// files in `temporary`, and returns its exit status and what it printed.
function runTurboCollection(temporary: string, args: string[], cwd?: string) {
  return spawnSync(process.execPath, [entryPoint, ...args], {
    encoding: "utf8",
    env: environmentWithTemporaryDirectory(temporary),
    ...(cwd === undefined ? {} : { cwd }),
  });
}

// The logs of the runs whose directory for temporary files is `temporary`.
function logsIn(temporary: string): string[] {
  const logs = path.join(temporary, "turbo-collection", "logs");
  return readdirSync(logs).map((name) => path.join(logs, name));
}

// The entries of the log file `file`, one JSON object to a line.
function entriesOf(file: string): Record<string, unknown>[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => JSON.parse(line));
}

// The entries of the log of the one run made with `temporary` as its directory
// for temporary files, where that log is in the default log directory.
function onlyRunEntries(temporary: string): Record<string, unknown>[] {
  const [log, ...others] = logsIn(temporary);
  assert.equal(others.length, 0);
  return entriesOf(log!);
}

// The path of the configuration file of a copy in `directory`
// (meta-file-spec.md R-MFILE-17).
function configurationFileOf(directory: string): string {
  return path.join(
    directory,
    ".turbo-collection",
    "turbo-collection-config.json",
  );
}

test("R-INIT-2: given no directory, init makes the current directory a copy, and exits with status 0", (t) => {
  const temporary = temporaryDirectory(t);
  const directory = path.join(temporary, "Family Photos");
  mkdirSync(directory);

  const run = runTurboCollection(temporary, ["init"], directory);

  assert.equal(run.status, 0);
  assert.match(
    run.stdout,
    /a copy named "main", of a new collection named "Family Photos"/,
  );
  const tcConfig = readFileSync(configurationFileOf(directory), "utf8");
  assert.match(tcConfig, /"collectionName": "Family Photos"/);
  assert.match(tcConfig, /"copyName": "main"/);
});

test("R-CLI-5: init is a command of its own, given the directory to act on", () => {
  assert.deepEqual(parseCliArgs(["init", "D:\\Photos"]), {
    help: false,
    version: false,
    verbose: false,
    logDir: undefined,
    name: undefined,
    copy: undefined,
    command: "init",
    commandArgs: ["D:\\Photos"],
  });
});

test("R-INIT-4: the name of a new collection is given by --name or -n, before the command or after it", () => {
  assert.equal(
    parseCliArgs(["init", "D:\\Photos", "--name", "Family Photos"]).name,
    "Family Photos",
  );
  assert.equal(
    parseCliArgs(["init", "-n", "Family Photos"]).name,
    "Family Photos",
  );
  assert.equal(
    parseCliArgs(["--name", "Family Photos", "init", "D:\\Photos"]).name,
    "Family Photos",
  );
});

test("R-INIT-4: the name of a new copy is given by --copy", () => {
  assert.equal(
    parseCliArgs(["init", "D:\\Photos", "--copy", "off-site"]).copy,
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

test("R-CLI-1: asking for help exits with status 0, and names the init command", (t) => {
  const run = runTurboCollection(temporaryDirectory(t), ["--help"]);

  assert.equal(run.status, 0);
  assert.match(run.stdout, /init \[<directory>\]/);
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

  assert.doesNotMatch(quiet.stdout, /run-start/);
  assert.match(verbose.stdout, /^run-start: turbo-collection 0\.1\.0, node /m);
  assert.match(verbose.stdout, /^run-end: success$/m);
});

test("R-CLI-1: an unknown command exits with a non-zero status, and is named", (t) => {
  const run = runTurboCollection(temporaryDirectory(t), ["bogus"]);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /Unknown command: bogus/);
});

test("R-LOG-12: a usage error is logged as an error, and the run ends in failure", (t) => {
  const temporary = temporaryDirectory(t);

  runTurboCollection(temporary, ["bogus"]);

  const entries = onlyRunEntries(temporary);
  assert.deepEqual(
    entries.map((entry) => entry.event),
    ["run-start", "error", "run-end"],
  );
  assert.equal(entries[1]?.message, "Unknown command: bogus");
  assert.equal(entries[2]?.outcome, "failure");
});

test("R-LOG-6: a command line that cannot be read is logged in the default log directory, and shows the usage text", (t) => {
  const temporary = temporaryDirectory(t);

  const run = runTurboCollection(temporary, ["--bogus"]);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /--bogus/);
  assert.match(run.stderr, /Usage:/);
  assert.equal(onlyRunEntries(temporary)[1]?.event, "error");
});

test("R-CLI-1: init given a name that cannot be a copy's name exits with a non-zero status, and says why", (t) => {
  const run = runTurboCollection(temporaryDirectory(t), [
    "init",
    "--copy",
    "a/b",
  ]);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /cannot be a copy's name/);
});

test("R-LOG-4, R-LOG-12: an error that ends a run is in its log, with its stack, before a failed run-end", (t) => {
  const temporary = temporaryDirectory(t);
  const directory = path.join(temporary, "photos");

  const run = runTurboCollection(temporary, [
    "init",
    directory,
    "--copy",
    "a/b",
  ]);

  assert.equal(run.status, 1);
  assert.match(run.stderr, /^error: "a\/b" cannot be a copy's name/m);
  assert.match(run.stderr, /^run-end: failure$/m);
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

test("R-LOG-13, R-LOG-14: init's log holds the ignore counts and the configuration it wrote", (t) => {
  const temporary = temporaryDirectory(t);
  const directory = path.join(temporary, "photos");

  runTurboCollection(temporary, ["init", directory]);

  const entries = onlyRunEntries(temporary);
  assert.deepEqual(
    entries.map((entry) => entry.event),
    ["run-start", "ignore", "configuration", "init", "run-end"],
  );
  assert.deepEqual(
    (entries[2]?.configuration as Record<string, unknown>).collectionId,
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

test("R-LOG-10: a log directory inside a copy is an error, and the run makes nothing in the copy and writes no log", (t) => {
  const temporary = temporaryDirectory(t);
  const copy = path.join(temporary, "photos");
  assert.equal(runTurboCollection(temporary, ["init", copy]).status, 0);
  const second = temporaryDirectory(t);

  const run = runTurboCollection(second, [
    "--version",
    "--log-dir",
    path.join(copy, "logs"),
  ]);

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /lies inside a copy/);
  assert.deepEqual(readdirSync(copy).sort(), [
    ".tcignore",
    ".turbo-collection",
  ]);
  assert.deepEqual(readdirSync(second), []);
});

// Runs the entry point without waiting for it, with its directory for temporary
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

test("R-PARALLEL-2, R-PARALLEL-3: of many inits at once on one directory, exactly one makes it a copy, and every other ends with an error", async (t) => {
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
    /another run made it a copy first/.test(run.stderr),
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
