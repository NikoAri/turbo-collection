import assert from "node:assert/strict";
import console from "node:console";
import process from "node:process";
import { test } from "node:test";

import {
  getAllDependencies,
  getPackagesToUpdate,
  getRequestedVersion,
  getSaveSettings,
  parseCliArgs,
} from "../helpers/package-json-npm-updater.ts";

// A process.exit stand-in: throwing unwinds the call the way a real exit would
// end the process, and carries the code for a test to assert on.
class ExitSignal extends Error {
  code: number;
  constructor(code: number) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

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
    dryRun: false,
    typesNode: true,
    dependencies: true,
    packages: [],
  });
});

test("parseCliArgs: --no-types-node and --no-dependencies each leave one step out", () => {
  const noTypesNode = parseCliArgs(["--no-types-node"]);
  assert.equal(noTypesNode.typesNode, false);
  assert.equal(noTypesNode.dependencies, true);

  const noDependencies = parseCliArgs(["--no-dependencies"]);
  assert.equal(noDependencies.typesNode, true);
  assert.equal(noDependencies.dependencies, false);
});

test("parseCliArgs: --types-node and --dependencies state the default", () => {
  const stated = parseCliArgs(["--types-node", "--dependencies"]);
  assert.equal(stated.typesNode, true);
  assert.equal(stated.dependencies, true);
});

test("parseCliArgs: --dry-run sets the dry-run flag", () => {
  assert.equal(parseCliArgs(["--dry-run"]).dryRun, true);
});

test("parseCliArgs: positional names are collected in order", () => {
  assert.deepEqual(parseCliArgs(["cspell", "prettier"]).packages, [
    "cspell",
    "prettier",
  ]);
});

test("parseCliArgs: flags and package names mix freely", () => {
  assert.deepEqual(
    parseCliArgs(["--dry-run", "--no-types-node", "typescript"]),
    {
      dryRun: true,
      typesNode: false,
      dependencies: true,
      packages: ["typescript"],
    },
  );
});

test("parseCliArgs: --help prints usage and exits 0", (t) => {
  const out: string[] = [];
  t.mock.method(console, "log", (...args: unknown[]) => {
    out.push(String(args[0] ?? ""));
  });
  t.mock.method(process, "exit", (code?: number): never => {
    throw new ExitSignal(code ?? 0);
  });
  assert.throws(
    () => parseCliArgs(["--help"]),
    (error: unknown) => error instanceof ExitSignal && error.code === 0,
  );
  assert.match(out.join("\n"), /Usage:/);
});

test("parseCliArgs: an unknown option exits 1", (t) => {
  const errors: string[] = [];
  t.mock.method(console, "error", (...args: unknown[]) => {
    errors.push(String(args[0] ?? ""));
  });
  t.mock.method(process, "exit", (code?: number): never => {
    throw new ExitSignal(code ?? 0);
  });
  assert.throws(
    () => parseCliArgs(["--bogus"]),
    (error: unknown) => error instanceof ExitSignal && error.code === 1,
  );
  assert.match(errors.join("\n"), /Unknown option/);
});
