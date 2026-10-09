import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import { writeNodeTypesException } from "./node-types-version-exception.ts";

// Update every npm dependency to its newest allowed release, rewriting both package.json and
// package-lock.json, then report what moved.
//
// * Uses `@latest` for most packages.
// * Any package listed in npm-version-exceptions.json is held to the range recorded there instead.
// * `@types/node` always has an entry there. Each run starts by writing it, derived from the Node
//   floor that package.json records in `engines.node`, so the types never describe a newer Node
//   than the one this code has to run on. See node-types-version-exception.ts.
//
// Held or not, a package resolves to a concrete version first, then a single `npm install` pins
// it and writes into package-lock.json. Resolving first is what makes package.json move:
// `npm install pkg@^24` leaves an existing `^24.1.0` range untouched, so the floor would never
// rise. `npm install pkg@24.13.3` rewrites it to `^24.13.3`.

// This script lives in scripts/helpers/. package.json and package-lock.json live one level up in
// scripts/, which is also where npm must run so it edits the right manifest and lockfile.
// npm-version-exceptions.json sits next to this script.
const packageJsonDir = new URL("../", import.meta.url);
const packageJsonUrl = new URL("package.json", packageJsonDir);
const npmVersionExceptionsUrl = new URL(
  "npm-version-exceptions.json",
  import.meta.url,
);
const npmCwd: string = fileURLToPath(packageJsonDir);

// Three kinds of string that this script keeps apart. Each is a plain string when the script runs:
// `__distinctStringType` is never set, and exists so `tsc` rejects one kind where another is
// expected, such as a range passed as a resolved version. The tag is optional so that a plain
// string is accepted as any kind, which lets parsed JSON and command-line arguments in without a
// cast. The price is that a value held in a plain `string` loses its kind.
type DistinctStringType<T extends string> = string & {
  readonly __distinctStringType?: T | undefined;
};
export type PackageName = DistinctStringType<"PackageName">; // "@types/node"
export type VersionRange = DistinctStringType<"VersionRange">; // "^24.1.0", ">=24.0.0 <=24.19.0"
type Version = DistinctStringType<"Version">; // "24.13.3"

type PackageJsonType = {
  engines?: { node?: string };
  dependencies?: Record<PackageName, VersionRange>;
  devDependencies?: Record<PackageName, VersionRange>;
};

function parseJson<T>(url: URL): T {
  return JSON.parse(readFileSync(url, "utf8")) as T;
}

export function getAllDependencies(
  packageJsonObj: PackageJsonType,
): Record<PackageName, VersionRange> {
  return { ...packageJsonObj.dependencies, ...packageJsonObj.devDependencies };
}

// Run npm through shell: cmd.exe resolves `npm` to `npm.cmd`, and the shell avoids the `.cmd`
// spawn restriction that execFile hits on Windows. The shell reads `npmArgs` as written, so a
// caller double-quotes any argument carrying a character a shell acts on.
// Returns output of command if requested.
function execNpm(npmArgs: string, captureOutput: boolean): string {
  return execSync(`npm ${npmArgs}`, {
    cwd: npmCwd,
    encoding: "utf8",
    stdio: captureOutput ? ["ignore", "pipe", "inherit"] : "inherit",
  });
}

// Asking `npm view` for `version`:
// * For a single match, like "latest" or "24.19.1", it prints a single value: string
// * For a range with several matches, like "^24", it prints an array in publish order: string[]
type NpmViewVersions = Version | Version[];

// Parse output down to the newest version: the string itself, or the last array element. The last
// element is the newest only where publish order follows version order, which is why
// nodeTypesRangeFromEngines confines its range to one major. An empty output (nothing matched) or
// an empty array throws. Kept separate from the shell call so it can be tested directly.
export function getRequestedVersion(
  npmViewOutputJson: string,
  packageName: PackageName,
  requestedRange: VersionRange,
): Version {
  const noMatchError = () =>
    new Error(
      `no published version of ${packageName} satisfies ${requestedRange}`,
    );

  // Check empty
  const npmViewTrimmedOutput = npmViewOutputJson.trim();
  if (npmViewTrimmedOutput === "") {
    throw noMatchError();
  }

  const npmViewVersions = JSON.parse(npmViewTrimmedOutput) as NpmViewVersions;

  // Single Version
  if (!Array.isArray(npmViewVersions)) {
    return npmViewVersions;
  }

  // Last Version in Array
  const lastVersion = npmViewVersions[npmViewVersions.length - 1];
  if (lastVersion === undefined) {
    throw noMatchError();
  }

  return lastVersion;
}

// Newest published version satisfying `requestedRange` (a range like "^24", or a dist-tag like
// "latest" in a range's place).
//
// The spec is double-quoted because a range is made of characters a shell acts on: `^` is the
// cmd.exe escape, `*` globs under a POSIX shell, and `>=24.0.0 <=24.19.0` adds a space and two
// redirects. npm forbids a quote inside a package name or a range, so the wrapping is
// unambiguous.
function queryRequestedVersion(
  packageName: PackageName,
  requestedRange: VersionRange,
): Version {
  const npmViewOutputJson: string = execNpm(
    `view "${packageName}@${requestedRange}" version --json`,
    /*captureOutput*/ true,
  );

  return getRequestedVersion(npmViewOutputJson, packageName, requestedRange);
}

// A dependency to update, and the range it is held to, if any.
type PackageToUpdate = {
  packageName: PackageName;
  heldRange: VersionRange | undefined;
};

// Package dependencies to update, sorted by name: every one, or only those named in `packages` when it
// is not empty. A name in `packages` or in `exceptions` that is not a dependency selects nothing.
//
// An entry in `exceptions` is the only thing that holds a package. No package is treated
// specially here: the hold on `@types/node` arrives as one more entry.
//
// Takes data and returns data, so it can be tested without the filesystem, the network, or npm.
export function getPackagesToUpdate(
  packageJsonObj: PackageJsonType,
  exceptions: Record<PackageName, VersionRange>,
  packages: PackageName[],
): PackageToUpdate[] {
  return Object.keys(getAllDependencies(packageJsonObj))
    .sort()
    .filter((name) => packages.length === 0 || packages.includes(name))
    .map((packageName) => ({
      packageName,
      heldRange: exceptions[packageName],
    }));
}

function updateNpmPackageVersions(npmUpdaterCliArgs: NpmUpdaterCliArgs): void {
  const packageJsonObj = parseJson<PackageJsonType>(packageJsonUrl);
  const initAllDependencies = getAllDependencies(packageJsonObj);

  const packageExceptions =
    parseJson<{ packages?: Record<PackageName, VersionRange> }>(
      npmVersionExceptionsUrl,
    ).packages ?? {};

  // An exception naming a package that is not a dependency is a stale entry. Report it rather than
  // letting `npm install` add the package as a side effect.
  for (const packageException of Object.keys(packageExceptions)) {
    if (!(packageException in initAllDependencies)) {
      console.warn(
        `npm-version-exceptions.json lists ${packageException}, which is not a dependency. Ignoring it.`,
      );
    }
  }

  // An unrecognized package name on the command line is a typo worth stopping for, not a package
  // to silently add.
  const unknown = npmUpdaterCliArgs.packages.filter(
    (name) => !(name in initAllDependencies),
  );
  if (unknown.length > 0) {
    console.error(`Not a dependency: ${unknown.join(", ")}`);
    process.exit(1);
  }

  const packagesToUpdate = getPackagesToUpdate(
    packageJsonObj,
    packageExceptions,
    npmUpdaterCliArgs.packages,
  );
  if (packagesToUpdate.length === 0) {
    console.log("No dependencies to update.");
    return;
  }

  console.log("Resolving newest versions:");
  const specs = packagesToUpdate.map(({ packageName, heldRange }) => {
    const version = queryRequestedVersion(packageName, heldRange ?? "latest");
    console.log(
      `  ${packageName}: ${initAllDependencies[packageName]} -> ^${version}${heldRange ? `  (held to ${heldRange})` : ""}`,
    );
    return `${packageName}@${version}`;
  });

  if (npmUpdaterCliArgs.dryRun) {
    console.log();
    console.log(`Dry run: would run \`npm install ${specs.join(" ")}\``);
    return;
  }

  // Each spec is `name@version` with a concrete version, which holds nothing a shell acts on.
  console.log();

  // npm install
  execNpm(`install ${specs.join(" ")}`, /*captureOutput*/ false);

  // Verify changes in package.json
  // package.json is read a second time so the report can see what the install moved.
  const after = getAllDependencies(parseJson<PackageJsonType>(packageJsonUrl));
  const moved = packagesToUpdate
    .map(({ packageName }) => packageName)
    .filter((name) => initAllDependencies[name] !== after[name]);

  console.log();
  if (moved.length === 0) {
    console.log(
      "package.json is unchanged. package-lock.json may still have moved; check `git diff`.",
    );
  } else {
    console.log("package.json:");
    for (const name of moved) {
      console.log(`  ${name}: ${initAllDependencies[name]} -> ${after[name]}`);
    }
  }
  console.log();
  console.log(
    "Next: run `npm run lint && npm test`, then review `git diff` before committing.",
  );
}

type NpmUpdaterCliArgs = {
  dryRun: boolean;
  packages: PackageName[]; // Empty means every dependency in package.json
};

const UsageMessage = `Usage: node package-json-npm-updater.ts [options] [package...]

Update dependencies to their newest allowed release, rewriting package.json and
package-lock.json. With no package names, every dependency is updated; otherwise only
the named ones. A package in npm-version-exceptions.json stays within its recorded
range. @types/node always has an entry there: each run first writes the range that
keeps it at or below the Node floor in package.json engines.

Options:
  -n, --dry-run   Resolve and report the newest versions without installing. The
                  @types/node entry is still written.
  -h, --help      Show this message.`;

export function parseCliArgs(argv: string[]): NpmUpdaterCliArgs {
  const npmUpdaterCliArgs: NpmUpdaterCliArgs = { dryRun: false, packages: [] };
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
      npmUpdaterCliArgs.packages.push(arg);
    }
  }

  return npmUpdaterCliArgs;
}

function main(): void {
  const npmUpdaterCliArgs: NpmUpdaterCliArgs = parseCliArgs(
    process.argv.slice(2),
  );

  // First record the hold on `@types/node` in npm-version-exceptions.json. The update that follows
  // then reads that file and knows nothing of `@types/node`.
  const packageJsonObj = parseJson<PackageJsonType>(packageJsonUrl);

  writeNodeTypesException(
    npmVersionExceptionsUrl,
    getAllDependencies(packageJsonObj),
    packageJsonObj.engines?.node,
  );

  updateNpmPackageVersions(npmUpdaterCliArgs);
}

// Run only when executed directly, so a test can import the functions above without triggering a
// real npm run.
if (import.meta.main) {
  main();
}
