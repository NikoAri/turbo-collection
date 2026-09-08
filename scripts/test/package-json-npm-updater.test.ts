import assert from "node:assert/strict";
import { test } from "node:test";

import {
  newestVersionFromNpmView,
  parseCliArgs,
  ranges,
  updateNpmPackageVersions,
  type UpdateDependencies,
} from "../helpers/package-json-npm-updater.ts";

type Manifest = ReturnType<UpdateDependencies["packageJsonManifest"]>;

// A process.exit stand-in: throwing unwinds the call the way a real exit would end the process,
// and carries the code for a test to assert on.
class ExitSignal extends Error {
  code: number;
  constructor(code: number) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

// Fake collaborators for updateNpmPackageVersions that record what it asked for and never leave
// the process. `install` can mutate the manifest through `onInstall`, so the second read sees the
// same move a real install would have written.
function fakeDeps(config: {
  manifest: Manifest;
  exceptions?: Record<string, string>;
  newest?: (name: string, spec: string) => string;
  onInstall?: (specs: string[], manifest: Manifest) => void;
}) {
  const logs: string[] = [];
  const warnings: string[] = [];
  const installed: string[][] = [];
  const resolved: Array<{ name: string; spec: string }> = [];
  const manifest = structuredClone(config.manifest);
  const newest = config.newest ?? (() => "9.9.9");

  const deps: UpdateDependencies = {
    packageJsonManifest: () => structuredClone(manifest),
    npmVersionExceptions: () => config.exceptions ?? {},
    newestVersion: (name, spec) => {
      resolved.push({ name, spec });
      return newest(name, spec);
    },
    install: (specs) => {
      installed.push(specs);
      config.onInstall?.(specs, manifest);
    },
    log: (message = "") => logs.push(message),
    warn: (message) => warnings.push(message),
  };

  return { deps, logs, warnings, installed, resolved };
}

test("ranges: merges dependencies and devDependencies", () => {
  const merged = ranges({
    dependencies: { a: "^1.0.0" },
    devDependencies: { b: "^2.0.0" },
  });
  assert.deepEqual(merged, { a: "^1.0.0", b: "^2.0.0" });
});

test("ranges: a manifest missing a section yields an empty object for it", () => {
  assert.deepEqual(ranges({}), {});
  assert.deepEqual(ranges({ dependencies: { a: "^1.0.0" } }), { a: "^1.0.0" });
});

test("newestVersionFromNpmView: a single match arrives as a JSON string", () => {
  assert.equal(
    newestVersionFromNpmView('"10.1.1"', "cspell", "latest"),
    "10.1.1",
  );
});

test("newestVersionFromNpmView: several matches arrive ascending, newest is last", () => {
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

test("parseCliArgs: no arguments updates every dependency, no dry run", () => {
  assert.deepEqual(parseCliArgs([]), { dryRun: false, only: [] });
});

test("parseCliArgs: --dry-run and -n both set the dry-run flag", () => {
  assert.equal(parseCliArgs(["--dry-run"]).dryRun, true);
  assert.equal(parseCliArgs(["-n"]).dryRun, true);
});

test("parseCliArgs: positional names are collected in order", () => {
  assert.deepEqual(parseCliArgs(["cspell", "prettier"]).only, [
    "cspell",
    "prettier",
  ]);
});

test("parseCliArgs: flags and package names mix freely", () => {
  assert.deepEqual(parseCliArgs(["-n", "typescript"]), {
    dryRun: true,
    only: ["typescript"],
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

test("updateNpmPackageVersions: a dry run resolves but does not install", () => {
  const h = fakeDeps({
    manifest: { devDependencies: { a: "^1.0.0" } },
    newest: () => "2.0.0",
  });
  updateNpmPackageVersions({ dryRun: true, only: [] }, h.deps);
  assert.deepEqual(h.installed, []);
  assert.ok(h.logs.includes("Dry run: would run `npm install a@2.0.0`"));
});

test("updateNpmPackageVersions: installs the resolved specs and reports the move", () => {
  const h = fakeDeps({
    manifest: { devDependencies: { a: "^1.0.0" } },
    newest: () => "2.0.0",
    onInstall: (_specs, manifest) => {
      manifest.devDependencies = { a: "^2.0.0" };
    },
  });
  updateNpmPackageVersions({ dryRun: false, only: [] }, h.deps);
  assert.deepEqual(h.installed, [["a@2.0.0"]]);
  assert.ok(h.logs.includes("  a: ^1.0.0 -> ^2.0.0"));
});

test("updateNpmPackageVersions: reports package.json unchanged when nothing moved", () => {
  const h = fakeDeps({
    manifest: { dependencies: { a: "^1.0.0" } },
    newest: () => "1.0.0",
  });
  updateNpmPackageVersions({ dryRun: false, only: [] }, h.deps);
  assert.deepEqual(h.installed, [["a@1.0.0"]]);
  assert.ok(h.logs.some((line) => line.includes("package.json is unchanged")));
});

test("updateNpmPackageVersions: a pinned package resolves within its recorded range", () => {
  const h = fakeDeps({
    manifest: { devDependencies: { "@types/node": "^24.1.0" } },
    exceptions: { "@types/node": "^24" },
    newest: (_name, spec) => (spec === "^24" ? "24.13.3" : "99.0.0"),
  });
  updateNpmPackageVersions({ dryRun: true, only: [] }, h.deps);
  assert.deepEqual(h.resolved, [{ name: "@types/node", spec: "^24" }]);
  assert.ok(h.logs.some((line) => line.includes("(held to ^24)")));
});

test("updateNpmPackageVersions: a stale exception entry warns and is skipped", () => {
  const h = fakeDeps({
    manifest: { dependencies: { a: "^1.0.0" } },
    exceptions: { ghost: "^1" },
  });
  updateNpmPackageVersions({ dryRun: true, only: [] }, h.deps);
  assert.ok(h.warnings.some((warning) => warning.includes("ghost")));
});

test("updateNpmPackageVersions: an empty manifest updates nothing", () => {
  const h = fakeDeps({ manifest: {} });
  updateNpmPackageVersions({ dryRun: false, only: [] }, h.deps);
  assert.deepEqual(h.installed, []);
  assert.ok(h.logs.includes("No dependencies to update."));
});

test("updateNpmPackageVersions: package names restrict the update to those", () => {
  const h = fakeDeps({
    manifest: { dependencies: { a: "^1.0.0", b: "^1.0.0" } },
    newest: () => "1.5.0",
  });
  updateNpmPackageVersions({ dryRun: true, only: ["a"] }, h.deps);
  assert.deepEqual(h.resolved, [{ name: "a", spec: "latest" }]);
});

test("updateNpmPackageVersions: a named non-dependency exits 1", (t) => {
  const errors: string[] = [];
  t.mock.method(console, "error", (...args: unknown[]) => {
    errors.push(String(args[0] ?? ""));
  });
  t.mock.method(process, "exit", (code?: number): never => {
    throw new ExitSignal(code ?? 0);
  });
  const h = fakeDeps({ manifest: { dependencies: { a: "^1.0.0" } } });
  assert.throws(
    () => updateNpmPackageVersions({ dryRun: false, only: ["ghost"] }, h.deps),
    (error: unknown) => error instanceof ExitSignal && error.code === 1,
  );
  assert.match(errors.join("\n"), /Not a dependency/);
});
