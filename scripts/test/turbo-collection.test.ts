import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath, URL } from "node:url";

import { parseCliArgs } from "../turbo-collection.ts";

test("the toolchain runs a test", () => {});

const entryPoint = fileURLToPath(
  new URL("../turbo-collection.ts", import.meta.url),
);

// Runs the entry point as a person would, and returns its exit status and what it printed.
function runTurboCollection(...args: string[]) {
  return spawnSync(process.execPath, [entryPoint, ...args], {
    encoding: "utf8",
  });
}

test("R-CLI-11: given no directory, init makes the current directory a copy, and exits with status 0", (t) => {
  const temporary = mkdtempSync(path.join(tmpdir(), "turbo-collection-test-"));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const directory = path.join(temporary, "Family Photos");
  mkdirSync(directory);

  const run = spawnSync(process.execPath, [entryPoint, "init"], {
    cwd: directory,
    encoding: "utf8",
  });

  assert.equal(run.status, 0);
  assert.match(run.stdout, /a copy named "family-photos"/);
  assert.match(
    readFileSync(
      path.join(directory, ".turbo-collection", "turbo-collection-config.json"),
      "utf8",
    ),
    /"collectionName": "family-photos"/,
  );
});

test("R-CLI-5: init is a command of its own, given the directory to act on", () => {
  assert.deepEqual(parseCliArgs(["init", "D:\\Photos"]), {
    help: false,
    name: undefined,
    description: undefined,
    command: "init",
    commandArgs: ["D:\\Photos"],
  });
});

test("R-CLI-11: a description of a new copy is given by --description", () => {
  assert.equal(
    parseCliArgs(["init", "--description", "The drive in the desk"])
      .description,
    "The drive in the desk",
  );
});

test("R-CLI-11: the name of a new copy is given by --name or -n, before the command or after it", () => {
  assert.equal(
    parseCliArgs(["init", "D:\\Photos", "--name", "offsite"]).name,
    "offsite",
  );
  assert.equal(parseCliArgs(["init", "-n", "offsite"]).name, "offsite");
  assert.equal(
    parseCliArgs(["--name", "offsite", "init", "D:\\Photos"]).name,
    "offsite",
  );
});

test("R-CLI-1: asking for help exits with status 0, and names the init command", () => {
  const run = runTurboCollection("--help");

  assert.equal(run.status, 0);
  assert.match(run.stdout, /init \[<directory>\]/);
});

test("R-CLI-1: an unknown command exits with a non-zero status, and is named", () => {
  const run = runTurboCollection("bogus");

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /Unknown command: bogus/);
});

test("R-CLI-1: init given a name that cannot be a copy's name exits with a non-zero status, and says why", () => {
  const run = runTurboCollection("init", "-n", "My Photos");

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /cannot be a copy's name/);
});

test("R-CLI-1: init given a path split at a space exits with a non-zero status, and names what is left over", () => {
  const run = runTurboCollection("init", "D:\\My", "Photos");

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /also given: Photos/);
});
