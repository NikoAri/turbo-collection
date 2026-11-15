import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getAllDependencies,
  getPackagesToUpdate,
  getRequestedVersion,
  getSaveSettings,
  parseCliArgs,
} from "../helpers/package-json-npm-updater.ts";
import { TcError } from "../helpers/tc-error.ts";

test("getAllDependencies: merges dependencies and devDependencies", () => {
  const merged = getAllDependencies({
    dependencies: { a: "^1.0.0" },
    devDependencies: { b: "^2.0.0" },
  });
  assert.deepEqual(merged, { a: "^1.0.0", b: "^2.0.0" });
});

test("getAllDependencies: a manifest missing a section yields an empty object for it", () => {
  assert.deepEqual(getAllDependencies({}), {});
  assert.deepEqual(getAllDependencies({ dependencies: { a: "^1.0.0" } }), {
    a: "^1.0.0",
  });
});

test("getRequestedVersion:a single match arrives as a JSON string", () => {
  assert.equal(getRequestedVersion('"10.1.1"', "cspell", "latest"), "10.1.1");
});

test("getRequestedVersion:several matches yield the last one listed", () => {
  const output = '["24.1.0", "24.13.2", "24.13.3"]';
  assert.equal(getRequestedVersion(output, "@types/node", "^24"), "24.13.3");
});

test("getRequestedVersion:an empty result throws, naming the package and spec", () => {
  assert.throws(() => getRequestedVersion("   ", "ghost", "^9"), /ghost.*\^9/);
});

test("getRequestedVersion:an empty array throws the same no-match error", () => {
  assert.throws(() => getRequestedVersion("[]", "ghost", "^9"), /ghost.*\^9/);
});

test("getRequestedVersion: a null output or an empty array throws a TcError caused by a TcError", () => {
  for (const output of ["null", "[]"]) {
    assert.throws(
      () => getRequestedVersion(output, "ghost", "^9"),
      (error: unknown) =>
        error instanceof TcError && error.cause instanceof TcError,
    );
  }
});

test("getPackagesToUpdate: every dependency, sorted by name, when no package is named", () => {
  assert.deepEqual(
    getPackagesToUpdate(
      { dependencies: { b: "^1.0.0" }, devDependencies: { a: "^1.0.0" } },
      {},
      [],
    ),
    [
      { packageName: "a", requestedRange: undefined },
      { packageName: "b", requestedRange: undefined },
    ],
  );
});

test("getPackagesToUpdate: a recorded exception holds a package to its range", () => {
  assert.deepEqual(
    getPackagesToUpdate(
      { devDependencies: { "@types/node": "^24.1.0" } },
      { "@types/node": "^24" },
      [],
    ),
    [{ packageName: "@types/node", requestedRange: "^24" }],
  );
});

test("getPackagesToUpdate: @types/node with no exception is not held, whatever engines.node says", () => {
  assert.deepEqual(
    getPackagesToUpdate(
      {
        engines: { node: ">=24.19.0" },
        devDependencies: { "@types/node": "^24.13.3" },
      },
      {},
      [],
    ),
    [{ packageName: "@types/node", requestedRange: undefined }],
  );
});

test("getPackagesToUpdate: package names restrict the update to those", () => {
  assert.deepEqual(
    getPackagesToUpdate({ dependencies: { a: "^1.0.0", b: "^1.0.0" } }, {}, [
      "a",
    ]),
    [{ packageName: "a", requestedRange: undefined }],
  );
});

test("getPackagesToUpdate: an exception naming a non-dependency adds nothing", () => {
  assert.deepEqual(
    getPackagesToUpdate({ dependencies: { a: "^1.0.0" } }, { ghost: "^1" }, []),
    [{ packageName: "a", requestedRange: undefined }],
  );
});

test("getSaveSettings: a caret range and a tilde range keep their prefix", () => {
  assert.equal(
    getSaveSettings("cspell", "^10.3.6"),
    '"--save-prefix=^" --save-exact=false',
  );
  assert.equal(
    getSaveSettings("prettier", "~3.9.9"),
    '"--save-prefix=~" --save-exact=false',
  );
});

test("getSaveSettings: a range written with >= or = keeps that in front", () => {
  assert.equal(
    getSaveSettings("ms", ">=2.0.0"),
    '"--save-prefix=>=" --save-exact=false',
  );
  assert.equal(
    getSaveSettings("ignore", "=7.0.0"),
    '"--save-prefix==" --save-exact=false',
  );
});

test("getSaveSettings: an exact version stays exact, a prerelease included", () => {
  assert.equal(getSaveSettings("typescript", "7.0.2"), "--save-exact");
  assert.equal(getSaveSettings("typescript", "7.1.0-beta.1"), "--save-exact");
});

test("getSaveSettings: a range with no single version to replace throws, naming the package and the range", () => {
  for (const range of [
    ">=24.0.0 <=24.19.0",
    "<2.0.0",
    ">1.2.3",
    "1.2.3 || 2.0.0",
    "1.x",
    "*",
    "latest",
  ]) {
    assert.throws(() => getSaveSettings("ghost", range), /ghost/);
  }
  assert.throws(() => getSaveSettings("ghost", "<2.0.0"), /<2\.0\.0/);
});

test("getPackagesToUpdate: an empty package.json yields nothing", () => {
  assert.deepEqual(getPackagesToUpdate({}, {}, []), []);
});

test("parseCliArgs: no arguments runs every step on every dependency, no dry run", () => {
  assert.deepEqual(parseCliArgs([]), {
    help: false,
    dryRun: false,
    enginesNode: true,
    typesNode: true,
    dependencies: true,
    packages: [],
  });
});

test("parseCliArgs: --no-engines-node, --no-types-node and --no-dependencies each leave one step out", () => {
  const noEnginesNode = parseCliArgs(["--no-engines-node"]);
  assert.equal(noEnginesNode.enginesNode, false);
  assert.equal(noEnginesNode.typesNode, true);
  assert.equal(noEnginesNode.dependencies, true);

  const noTypesNode = parseCliArgs(["--no-types-node"]);
  assert.equal(noTypesNode.enginesNode, true);
  assert.equal(noTypesNode.typesNode, false);
  assert.equal(noTypesNode.dependencies, true);

  const noDependencies = parseCliArgs(["--no-dependencies"]);
  assert.equal(noDependencies.enginesNode, true);
  assert.equal(noDependencies.typesNode, true);
  assert.equal(noDependencies.dependencies, false);
});

test("parseCliArgs: --engines-node, --types-node and --dependencies state the default", () => {
  const stated = parseCliArgs([
    "--engines-node",
    "--types-node",
    "--dependencies",
  ]);
  assert.equal(stated.enginesNode, true);
  assert.equal(stated.typesNode, true);
  assert.equal(stated.dependencies, true);
});

test("parseCliArgs: --dry-run and -n each set the dry-run flag", () => {
  assert.equal(parseCliArgs(["--dry-run"]).dryRun, true);
  assert.equal(parseCliArgs(["-n"]).dryRun, true);
});

test("parseCliArgs: positional names are collected in order", () => {
  assert.deepEqual(parseCliArgs(["cspell", "prettier"]).packages, [
    "cspell",
    "prettier",
  ]);
});

test("parseCliArgs: flags and package names mix freely", () => {
  assert.deepEqual(parseCliArgs(["-n", "--no-types-node", "typescript"]), {
    help: false,
    dryRun: true,
    enginesNode: true,
    typesNode: false,
    dependencies: true,
    packages: ["typescript"],
  });
});

test("parseCliArgs: --help and -h each set the help flag, whatever else a command line holds", () => {
  assert.equal(parseCliArgs(["--help"]).help, true);
  assert.equal(parseCliArgs(["-h"]).help, true);
  assert.equal(
    parseCliArgs(["--no-dependencies", "ghost", "--help"]).help,
    true,
  );
});

test("parseCliArgs: an unknown option throws, --help beside it included", () => {
  for (const argv of [["--bogus"], ["--help", "--bogus"], ["-x"]]) {
    assert.throws(() => parseCliArgs(argv), {
      code: "ERR_PARSE_ARGS_UNKNOWN_OPTION",
    });
  }
});
