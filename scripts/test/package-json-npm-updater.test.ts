import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getAllDependencies,
  getPackagesToUpdate,
  newestVersionFromNpmView,
  nodeTypesRangeFromEngines,
  parseCliArgs,
} from "../helpers/package-json-npm-updater.ts";

// A process.exit stand-in: throwing unwinds the call the way a real exit would end the process,
// and carries the code for a test to assert on.
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

test("newestVersionFromNpmView: a single match arrives as a JSON string", () => {
  assert.equal(
    newestVersionFromNpmView('"10.1.1"', "cspell", "latest"),
    "10.1.1",
  );
});

test("newestVersionFromNpmView: several matches yield the last one listed", () => {
  const output = '["24.1.0", "24.13.2", "24.13.3"]';
  assert.equal(
    newestVersionFromNpmView(output, "@types/node", "^24"),
    "24.13.3",
  );
});

test("newestVersionFromNpmView: an empty result throws, naming the package and spec", () => {
  assert.throws(
    () => newestVersionFromNpmView("   ", "ghost", "^9"),
    /ghost.*\^9/,
  );
});

test("newestVersionFromNpmView: an empty array throws the same no-match error", () => {
  assert.throws(
    () => newestVersionFromNpmView("[]", "ghost", "^9"),
    /ghost.*\^9/,
  );
});

test("nodeTypesRangeFromEngines: a floor becomes its major, capped at its minor", () => {
  assert.equal(nodeTypesRangeFromEngines(">=24.19.0"), "^24 <=24.19");
});

test("nodeTypesRangeFromEngines: the floor's patch does not change the range", () => {
  assert.equal(nodeTypesRangeFromEngines(">=24.19.7"), "^24 <=24.19");
});

test("nodeTypesRangeFromEngines: whitespace around the floor is tolerated", () => {
  assert.equal(nodeTypesRangeFromEngines(" >= 26.3.0 "), "^26 <=26.3");
});

test("nodeTypesRangeFromEngines: a missing floor throws, naming engines.node", () => {
  assert.throws(
    () => nodeTypesRangeFromEngines(undefined),
    /engines\.node.*missing/,
  );
});

test("nodeTypesRangeFromEngines: any form other than >=MAJOR.MINOR.PATCH throws, quoting it", () => {
  for (const other of [
    "^24.19.0",
    "24.x",
    ">=24",
    ">=24.19",
    ">=24.19.0 <25",
  ]) {
    assert.throws(
      () => nodeTypesRangeFromEngines(other),
      (error: unknown) =>
        error instanceof Error && error.message.includes(`"${other}"`),
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
      { packageName: "a", heldRange: undefined },
      { packageName: "b", heldRange: undefined },
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
    [{ packageName: "@types/node", heldRange: "^24" }],
  );
});

test("getPackagesToUpdate: @types/node is held at or below the engines.node floor", () => {
  assert.deepEqual(
    getPackagesToUpdate(
      {
        engines: { node: ">=24.19.0" },
        devDependencies: { "@types/node": "^24.13.3", cspell: "^10.0.0" },
      },
      {},
      [],
    ),
    [
      { packageName: "@types/node", heldRange: "^24 <=24.19" },
      { packageName: "cspell", heldRange: undefined },
    ],
  );
});

test("getPackagesToUpdate: a recorded exception for @types/node wins over the floor", () => {
  assert.deepEqual(
    getPackagesToUpdate(
      {
        engines: { node: ">=24.19.0" },
        devDependencies: { "@types/node": "^22.1.0" },
      },
      { "@types/node": "^22" },
      [],
    ),
    [{ packageName: "@types/node", heldRange: "^22" }],
  );
});

test("getPackagesToUpdate: @types/node with no engines.node floor throws", () => {
  assert.throws(
    () =>
      getPackagesToUpdate(
        { devDependencies: { "@types/node": "^24.13.3" } },
        {},
        [],
      ),
    /engines\.node/,
  );
});

test("getPackagesToUpdate: the floor is not read when @types/node is not being updated", () => {
  assert.deepEqual(
    getPackagesToUpdate(
      { devDependencies: { "@types/node": "^24.13.3", a: "^1.0.0" } },
      {},
      ["a"],
    ),
    [{ packageName: "a", heldRange: undefined }],
  );
});

test("getPackagesToUpdate: package names restrict the update to those", () => {
  assert.deepEqual(
    getPackagesToUpdate({ dependencies: { a: "^1.0.0", b: "^1.0.0" } }, {}, [
      "a",
    ]),
    [{ packageName: "a", heldRange: undefined }],
  );
});

test("getPackagesToUpdate: an exception naming a non-dependency adds nothing", () => {
  assert.deepEqual(
    getPackagesToUpdate({ dependencies: { a: "^1.0.0" } }, { ghost: "^1" }, []),
    [{ packageName: "a", heldRange: undefined }],
  );
});

test("getPackagesToUpdate: an empty package.json yields nothing", () => {
  assert.deepEqual(getPackagesToUpdate({}, {}, []), []);
});

test("parseCliArgs: no arguments updates every dependency, no dry run", () => {
  assert.deepEqual(parseCliArgs([]), { dryRun: false, packages: [] });
});

test("parseCliArgs: --dry-run and -n both set the dry-run flag", () => {
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
  assert.deepEqual(parseCliArgs(["-n", "typescript"]), {
    dryRun: true,
    packages: ["typescript"],
  });
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
