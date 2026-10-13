import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import { writeNodeTypesException } from "./node-types-version-exception.ts";

// Update every npm dependency to its newest allowed release, rewriting both package.json and
// package-lock.json, then report what moved.
//
// * Uses `@latest` for most packages.
// * Any package listed in npm-version-exceptions.json is held to the range recorded there instead.
//   A file that is missing or incorrect holds no package, and the run that writes an entry
//   writes the file afresh.
// * `@types/node` always has an entry there. Each run starts by writing it, derived from the Node
//   floor that package.json records in `engines.node`, so the types never describe a newer Node
//   than the one this code has to run on. See node-types-version-exception.ts.
// * A run writes that entry, then updates the dependencies. Each step is on by default:
//   `--no-types-node` leaves out the first and `--no-dependencies` the second. A dry run reports
//   what each step would do and changes no file.
//
// Held or not, a package resolves to a concrete version first, then `npm install` pins it and
// writes into package-lock.json. Resolving first is what makes package.json move:
// `npm install pkg@^24` leaves an existing `^24.1.0` range untouched, so the floor would never
// rise. `npm install pkg@24.13.3` rewrites it to `^24.13.3`.
//
// A range keeps its form: whatever stands in front of its version (`^`, `~`, `>=`, `=`, or
// nothing) stays in front of the new one. npm would otherwise write the form its configuration
// names, so each install passes the settings that fix it, and packages whose ranges share a form
// install together. See getSaveSettings.

// This script lives in scripts/helpers/. package.json and package-lock.json live one level up in
// scripts/, which is also where npm must run so it edits the right manifest and lockfile.
// npm-version-exceptions.json sits next to this script.
const packageJsonDir = new URL("../", import.meta.url);
const packageJsonUrl = new URL("package.json", packageJsonDir);
const packageLockUrl = new URL("package-lock.json", packageJsonDir);
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

function EnsureJsonParse<T>(stringJson: string): T {
  const parsedObj = JSON.parse(stringJson) as T;

  if (parsedObj === null) {
    throw Error();
  }

  return parsedObj;
}

function EnsureJsonParseUrl<T>(url: URL): T {
  return EnsureJsonParse<T>(readFileSync(url, "utf8"));
}

function EnsureObj<T>(obj: T | undefined): T {
  if (obj === undefined) {
    throw Error();
  }

  return obj;
}

// Parse output down to the newest version: the string itself, or the last array element. The last
// element is the newest only where publish order follows version order, which is why
// nodeTypesRangeFromEngines confines its range to one major. An empty output (nothing matched) or
// an empty array throws. Kept separate from the shell call so it can be tested directly.
export function getRequestedVersion(
  npmViewOutputJson: string,
  packageName: PackageName,
  requestedRange: VersionRange,
): Version {
  try {
    const npmViewVersions = EnsureJsonParse<NpmViewVersions>(npmViewOutputJson);

    // Single Version
    if (!Array.isArray(npmViewVersions)) {
      return npmViewVersions;
    }

    // Last Version in Array
    const lastVersion = npmViewVersions[npmViewVersions.length - 1];

    return EnsureObj(lastVersion);
  } catch (e) {
    throw new Error(
      `no published version of ${packageName} satisfies ${requestedRange}: npmViewOutputJson: ${npmViewOutputJson}`,
      { cause: e },
    );
  }
}

// Newest published version satisfying `requestedRange` (a range like "^24", or a dist-tag like
// "latest" in a range's place).
//
// The spec is double-quoted because a range is made of characters a shell acts on: `^` is the
// cmd.exe escape, `*` globs under a POSIX shell, and `>=24.0.0 <=24.19.0` adds a space and two
// redirects. npm forbids a quote inside a package name or a range, so the wrapping is
// unambiguous.
function queryRequestedNpmVersion(
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
  requestedRange: VersionRange | undefined;
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
      requestedRange: exceptions[packageName],
    }));
}

// Holds recorded in npm-version-exceptions.json, by package name. A file that is missing or
// incorrect holds no package, and the run says so.
function findPackageExceptions(): Record<PackageName, VersionRange> {
  try {
    return (
      EnsureJsonParseUrl<{ packages?: Record<PackageName, VersionRange> }>(
        npmVersionExceptionsUrl,
      ).packages ?? {}
    );
  } catch {
    console.warn(
      "npm-version-exceptions.json is missing or incorrect. No package is held.",
    );
    return {};
  }
}

// package-lock.json, read for the version it has installed of each package. Its `packages` are
// keyed by where a package sits, `node_modules/<name>` for a direct dependency. A lockfile that
// is missing or incorrect reads as one with no package, so every package is then installed.
type PackageLockType = {
  packages?: Record<string, { version?: Version }>;
};

function findPackageLock(): PackageLockType {
  try {
    return EnsureJsonParseUrl<PackageLockType>(packageLockUrl);
  } catch {
    return {};
  }
}

// The npm settings that make `npm install name@version` write a range of the same form as
// `origRange`: whatever stands in front of its version stays in front of the new one. That is
// `^`, `~`, `>=`, `=`, or nothing for an exact version. Left alone, npm writes the form its own
// configuration names, a caret by default, whatever the range was. Both settings are always
// passed, so the form written does not depend on how npm is configured on the machine.
//
// The prefix setting is double-quoted because a shell acts on these characters: `^` is the
// cmd.exe escape, `~` expands under a POSIX shell, and `>` redirects under both.
//
// A range that is not one version with one of those in front throws rather than being rewritten:
// an upper bound such as `<2.0.0`, a range in parts such as `>=1.0.0 <2.0.0`, `1.x`, a tag. None
// of them has a single version that the newest release could replace.
export function getSaveSettings(
  packageName: PackageName,
  origRange: VersionRange,
): string {
  const form = /^(\^|~|>=|=)?\d+\.\d+\.\d+([-+][\w.+-]*)?$/.exec(origRange);
  if (form === null) {
    throw new Error(
      `cannot keep the form of the range "${origRange}" of ${packageName}: only a version with ^, ~, >=, = or nothing in front is updated`,
    );
  }
  const [, prefix] = form;
  return prefix
    ? `"--save-prefix=${prefix}" --save-exact=false`
    : "--save-exact";
}

function updateNpmPackageVersions(npmUpdaterCliArgs: NpmUpdaterCliArgs): void {
  const packageJsonObj = EnsureJsonParseUrl<PackageJsonType>(packageJsonUrl);
  const origAllDependencies = getAllDependencies(packageJsonObj);

  const packageExceptions = findPackageExceptions();

  // An exception naming a package that is not a dependency is a stale entry. Report it rather than
  // letting `npm install` add the package as a side effect.
  for (const packageException of Object.keys(packageExceptions)) {
    if (!(packageException in origAllDependencies)) {
      console.warn(
        `npm-version-exceptions.json lists ${packageException}, which is not a dependency. Ignoring it.`,
      );
    }
  }

  // An unrecognized CLI package name on the command line is a typo worth stopping for,
  // not a package
  // to silently add.
  const unrecognizedCliPackage = npmUpdaterCliArgs.packages.filter(
    (name) => !(name in origAllDependencies),
  );
  if (unrecognizedCliPackage.length > 0) {
    console.error(`Not a dependency: ${unrecognizedCliPackage.join(", ")}`);
    process.exit(1);
  }

  const packagesToUpdate: PackageToUpdate[] = getPackagesToUpdate(
    packageJsonObj,
    packageExceptions,
    npmUpdaterCliArgs.packages,
  );
  if (packagesToUpdate.length === 0) {
    console.log("No dependencies to update.");
    return;
  }

  console.log("Resolving newest versions:");
  // npm takes its save settings once for a whole command, so packages are installed together
  // only where their ranges have the same form. Keyed by those settings.
  const nameVersionStringsBySaveSettings: Record<string, string[]> = {};
  const packageLock = findPackageLock();
  for (const { packageName, requestedRange } of packagesToUpdate) {
    const origVersion = EnsureObj(origAllDependencies[packageName]);
    const saveSettings = getSaveSettings(packageName, origVersion);

    const npmVersion = queryRequestedNpmVersion(
      packageName,
      requestedRange ?? "latest",
    );

    // A package is left out of the install only where both files already have this version:
    // the range in package.json and the version package-lock.json has installed. The range can
    // allow more than a hold does, so the lockfile is what shows a package that drifted.
    //
    // getSaveSettings has checked that the range is one version with at most a prefix in front,
    // so the version starts at the first digit.
    const origVersionNumber = origVersion.slice(origVersion.search(/\d/));
    const lockedVersion =
      packageLock.packages?.[`node_modules/${packageName}`]?.version;
    const alreadyAtVersion =
      origVersionNumber === npmVersion && lockedVersion === npmVersion;

    let versionNoteString: string;
    if (requestedRange) {
      versionNoteString = alreadyAtVersion
        ? `already at newest allowed, held to ${requestedRange}, not updating`
        : `held to ${requestedRange}`;
    } else {
      versionNoteString = alreadyAtVersion
        ? "already at latest, not updating"
        : "latest";
    }
    console.log(
      `Package ${packageName}: ${origVersion} -> ${npmVersion}  (${versionNoteString})`,
    );
    if (alreadyAtVersion) {
      continue;
    }

    const nameVersionStrings = (nameVersionStringsBySaveSettings[
      saveSettings
    ] ??= []);
    nameVersionStrings.push(`${packageName}@${npmVersion}`);
  }

  // Each spec is `name@version` with a concrete version
  // Used by "npm install name@version" to modify package.json and package-lock.json files
  const npmInstallArgsList: string[] = [];
  for (const [saveSettings, nameVersionStrings] of Object.entries(
    nameVersionStringsBySaveSettings,
  )) {
    npmInstallArgsList.push(
      `install ${saveSettings} ${nameVersionStrings.join(" ")}`,
    );
  }

  if (npmInstallArgsList.length === 0) {
    console.log();
    console.log("Every package is already at its version. Nothing to install.");
    return;
  }

  if (npmUpdaterCliArgs.dryRun) {
    console.log();
    for (const npmInstallArgs of npmInstallArgsList) {
      console.log(`Dry run: would run \`npm ${npmInstallArgs}\``);
    }
    return;
  }

  console.log();

  // npm install
  // Adding specific package on npm install allows modification of package.json
  // So after this command, both package.json and package-lock.json are updated
  for (const npmInstallArgs of npmInstallArgsList) {
    execNpm(npmInstallArgs, /*captureOutput*/ false);
  }

  // Verify changes in package.json
  // package.json is read a second time so the report can see what the install moved.
  const newAllDependencies = getAllDependencies(
    EnsureJsonParseUrl<PackageJsonType>(packageJsonUrl),
  );

  // The two readings are compared directly, over every name in either, so the report states
  // what package.json shows and not what this run meant to do: a range that changed, a
  // dependency that appeared, or one that went.
  const allPackageNames = Object.keys({
    ...origAllDependencies,
    ...newAllDependencies,
  }).sort();
  const updatedPackages: PackageName[] = [];
  for (const packageName of allPackageNames) {
    if (origAllDependencies[packageName] !== newAllDependencies[packageName]) {
      updatedPackages.push(packageName);
    }
  }

  console.log();
  if (updatedPackages.length === 0) {
    console.log(
      "package.json is unchanged. package-lock.json may still have moved; check `git diff`.",
    );
  } else {
    console.log("package.json:");
    for (const packageName of updatedPackages) {
      const origRange = origAllDependencies[packageName] ?? "absent";
      const newRange = newAllDependencies[packageName] ?? "absent";
      console.log(`  ${packageName}: ${origRange} -> ${newRange}`);
    }
  }
  console.log();
  console.log(
    "Next: run `npm run lint && npm test`, then review `git diff` before committing.",
  );
}

type NpmUpdaterCliArgs = {
  dryRun: boolean;
  typesNode: boolean; // Write the `@types/node` entry first. On unless --no-types-node
  dependencies: boolean; // Update the dependencies. On unless --no-dependencies
  packages: PackageName[]; // Empty means every dependency in package.json
};

const UsageMessage = `Usage: node package-json-npm-updater.ts [options] [package...]

Update dependencies to their newest allowed release, rewriting package.json and
package-lock.json. With no package names, every dependency is updated; otherwise only
the named ones. A package in npm-version-exceptions.json stays within its recorded
range. @types/node always has an entry there: each run first writes the range that
keeps it at or below the Node floor in package.json engines.

Options:
  -n, --dry-run            Report what a run would write and install, and change no
                           file.
      --[no-]types-node    Write the @types/node entry first. On by default;
                           --no-types-node skips it.
      --[no-]dependencies  Update the dependencies. On by default; --no-dependencies
                           skips it, so a run only writes the @types/node entry.
  -h, --help               Show this message.`;

export function parseCliArgs(argv: string[]): NpmUpdaterCliArgs {
  const npmUpdaterCliArgs: NpmUpdaterCliArgs = {
    dryRun: false,
    typesNode: true,
    dependencies: true,
    packages: [],
  };
  for (const arg of argv) {
    if (arg === "-n" || arg === "--dry-run") {
      npmUpdaterCliArgs.dryRun = true;
    } else if (arg === "--types-node" || arg === "--no-types-node") {
      npmUpdaterCliArgs.typesNode = arg === "--types-node";
    } else if (arg === "--dependencies" || arg === "--no-dependencies") {
      npmUpdaterCliArgs.dependencies = arg === "--dependencies";
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

function updatePackageJson(npmUpdaterCliArgs: NpmUpdaterCliArgs): void {
  // First write `@types/node` in npm-version-exceptions.json.
  // Actual update that follows
  // then reads that file and knows nothing specific about `@types/node`.
  if (npmUpdaterCliArgs.typesNode) {
    const packageJsonObj = EnsureJsonParseUrl<PackageJsonType>(packageJsonUrl);

    writeNodeTypesException(
      npmVersionExceptionsUrl,
      getAllDependencies(packageJsonObj),
      packageJsonObj.engines?.node,
      npmUpdaterCliArgs.dryRun,
    );
  }

  if (npmUpdaterCliArgs.dependencies) {
    updateNpmPackageVersions(npmUpdaterCliArgs);
  }
}

function main(): void {
  const npmUpdaterCliArgs: NpmUpdaterCliArgs = parseCliArgs(
    process.argv.slice(2),
  );

  updatePackageJson(npmUpdaterCliArgs);
}

// Run only when executed directly, so a test can import the functions above without triggering a
// real npm run.
if (import.meta.main) {
  main();
}
