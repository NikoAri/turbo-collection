import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getAllDependencies,
  getPackagesToUpdate,
  getRequestedVersion,
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
    [{ packageName: "@types/node", heldRange: undefined }],
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
