import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Update every dependency to its newest allowed release, rewriting both package.json and
// package-lock.json, then report what moved.
//
// "Allowed" is `@latest` for most packages. A package listed in npm-version-exceptions.json is
// held to the range recorded there instead: `@types/node` tracks the newest 24.x so it stays on
// the Node major that scripts/README.md pins as the floor, while the rest of the toolchain moves
// forward freely.
//
// Both cases resolve to a concrete version first, then a single `npm install` pins it. Resolving
// first is what makes package.json move: `npm install pkg@^24` leaves an existing `^24.1.0` range
// untouched, so the floor would never rise. `npm install pkg@24.13.3` rewrites it to `^24.13.3`.

const here = new URL(".", import.meta.url);
const scriptsDir = fileURLToPath(here);

type PackageJsonManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(new URL(name, here), "utf8")) as T;
}

export function ranges(manifest: PackageJsonManifest): Record<string, string> {
  return { ...manifest.dependencies, ...manifest.devDependencies };
}

// Run npm through the shell with every argument double-quoted. Quoting keeps `^` literal under
// cmd.exe and stops a POSIX shell from globbing `*`; npm forbids a quote inside a package name or
// a range, so the wrapping is unambiguous. `npm` stays unquoted so cmd.exe resolves it to
// `npm.cmd`, and the shell avoids the `.cmd` spawn restriction that execFile hits on Windows.
function execNpm(args: string[], captureOutput: boolean): string {
  const command = `npm ${args.map((token) => `"${token}"`).join(" ")}`;
  return execSync(command, {
    cwd: scriptsDir,
    encoding: "utf8",
    stdio: captureOutput ? ["ignore", "pipe", "inherit"] : "inherit",
  });
}

// Asking `npm view` for one field (`version`) prints just that field's value, not the package
// document: a JSON string when the spec matches a single version, a JSON array of version strings
// (ascending) when it matches several.
type NpmViewVersions = string | string[];

// Parse that output down to the newest version: the string itself, or the last array element. An
// empty output (nothing matched) or an empty array throws. Kept separate from the shell call so it
// can be tested directly.
export function newestVersionFromNpmView(
  npmViewOutput: string,
  packageName: string,
  specVersion: string,
): string {
  const noMatchError = () =>
    new Error(
      `no published version of ${packageName} satisfies ${specVersion}`,
    );

  const npmViewTrimmedOutput = npmViewOutput.trim();
  if (npmViewTrimmedOutput === "") {
    throw noMatchError();
  }

  const versions = JSON.parse(npmViewTrimmedOutput) as NpmViewVersions;
  if (!Array.isArray(versions)) {
    return versions;
  }
  const newest = versions[versions.length - 1];
  if (newest === undefined) {
    throw noMatchError();
  }
  return newest;
}

// Newest published version satisfying `spec` (a dist-tag like "latest" or a range like "^24").
function queryNewestVersion(packageName: string, specVersion: string): string {
  const npmViewOutput = execNpm(
    ["view", `${packageName}@${specVersion}`, "version", "--json"],
    /*captureOutput*/ true,
  );

  return newestVersionFromNpmView(npmViewOutput, packageName, specVersion);
}

// The collaborators of updateNpmPackageVersions that reach the outside world, gathered so a test
// can substitute fakes and never touch the network, the filesystem, or the real npm. `readManifest`
// is read twice, before and after the install, so the report can see what the install moved.
export type UpdateDependencies = {
  packageJsonManifest: () => PackageJsonManifest;
  npmVersionExceptions: () => Record<
    /*packageName*/ string,
    /*specVersion*/ string
  >;
  newestVersion: (packageName: string, specVersion: string) => string;
  install: (specs: string[]) => void;
  log: (message?: string) => void;
  warn: (message: string) => void;
};

const realDependencies: UpdateDependencies = {
  packageJsonManifest: () => readJson<PackageJsonManifest>("package.json"),
  npmVersionExceptions: () =>
    readJson<{ packages?: Record<string, string> }>(
      "npm-version-exceptions.json",
    ).packages ?? {},
  newestVersion: queryNewestVersion,
  install: (specs) => {
    execNpm(["install", ...specs], false);
  },
  log: (message = "") => console.log(message),
  warn: (message) => console.warn(message),
};

export function updateNpmPackageVersions(
  options: NpmUpdaterCliArgs,
  deps: UpdateDependencies = realDependencies,
): void {
  const before = ranges(deps.packageJsonManifest());
  const exceptions = deps.npmVersionExceptions();

  // An exception naming a package that is not a dependency is a stale entry. Report it rather than
  // letting `npm install` add the package as a side effect.
  for (const name of Object.keys(exceptions)) {
    if (!(name in before)) {
      deps.warn(
        `npm-version-exceptions.json lists ${name}, which is not a dependency. Ignoring it.`,
      );
    }
  }

  let names = Object.keys(before).sort();

  // With package names on the command line, update only those. An unrecognized name is a typo
  // worth stopping for, not a package to silently add.
  if (options.only.length > 0) {
    const unknown = options.only.filter((name) => !(name in before));
    if (unknown.length > 0) {
      console.error(`Not a dependency: ${unknown.join(", ")}`);
      process.exit(1);
    }
    names = names.filter((name) => options.only.includes(name));
  }

  if (names.length === 0) {
    deps.log("No dependencies to update.");
    return;
  }

  deps.log("Resolving newest versions:");
  const specs = names.map((name) => {
    const pin = exceptions[name];
    const version = deps.newestVersion(name, pin ?? "latest");
    deps.log(
      `  ${name}: ${before[name]} -> ^${version}${pin ? `  (held to ${pin})` : ""}`,
    );
    return `${name}@${version}`;
  });

  if (options.dryRun) {
    deps.log();
    deps.log(`Dry run: would run \`npm install ${specs.join(" ")}\``);
    return;
  }

  deps.log();
  deps.install(specs);

  const after = ranges(deps.packageJsonManifest());
  const moved = names.filter((name) => before[name] !== after[name]);

  deps.log();
  if (moved.length === 0) {
    deps.log(
      "package.json is unchanged. package-lock.json may still have moved; check `git diff`.",
    );
  } else {
    deps.log("package.json:");
    for (const name of moved) {
      deps.log(`  ${name}: ${before[name]} -> ${after[name]}`);
    }
  }
  deps.log();
  deps.log(
    "Next: run `npm run lint && npm test`, then review `git diff` before committing.",
  );
}

type NpmUpdaterCliArgs = {
  dryRun: boolean;
  only: string[]; // Empty means every dependency.
};

const UsageMessage = `Usage: node package-json-npm-updater.ts [options] [package...]

Update dependencies to their newest allowed release, rewriting package.json and
package-lock.json. With no package names, every dependency is updated; otherwise only
the named ones. A package in npm-version-exceptions.json stays within its recorded range.

Options:
  -n, --dry-run   Resolve and report the newest versions without installing.
  -h, --help      Show this message.`;

export function parseCliArgs(argv: string[]): NpmUpdaterCliArgs {
  const npmUpdaterCliArgs: NpmUpdaterCliArgs = { dryRun: false, only: [] };
  for (const arg of argv) {
    if (arg === "-n" || arg === "--dry-run") {
      npmUpdaterCliArgs.dryRun = true;
    } else if (arg === "-h" || arg === "--help") {
      console.log(UsageMessage);
      process.exit(0);
    } else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}\n\n${UsageMessage}`);
      process.exit(1);
    } else {
      npmUpdaterCliArgs.only.push(arg);
    }
  }
  return npmUpdaterCliArgs;
}

function main(): void {
  const npmUpdaterCliArgs: NpmUpdaterCliArgs = parseCliArgs(
    process.argv.slice(2),
  );
  updateNpmPackageVersions(npmUpdaterCliArgs);
}

// Run only when executed directly, so a test can import the functions above without triggering a
// real npm run.
if (import.meta.main) {
  main();
}
