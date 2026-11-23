// Imports only Node's built-ins and helpers that do the same: it runs before
// node_modules exists, and its `npm ci` deletes node_modules. A test in
// test/package-json-npm-updater.test.ts runs it with no node_modules.
import { execSync } from "node:child_process";
import console from "node:console";
import { readFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { parseArgs } from "node:util";

import { nodeFloorChange } from "./engines-node-floor.ts";
import { writeNodeTypesException } from "./node-types-version-exception.ts";
import { TcError } from "./tc-error.ts";

// Update every npm dependency to its newest allowed release, rewriting both
// package.json and package-lock.json, then report what moved.
//
// * Uses `@latest` for most packages. * Any package listed in
// npm-version-exceptions.json is held to whichever range is recorded there
// instead. A file that is missing or incorrect holds no package, and a run
// that writes an entry writes that file afresh. * Each run starts by raising
// package.json's Node floor, `engines.node`, to whichever Node runs it, within
// that floor's major. See engines-node-floor.ts. * `@types/node` always has an
// entry in npm-version-exceptions.json. A run writes it next, derived from
// that floor, so those types never describe a newer Node than this code has
// to run on. See node-types-version-exception.ts. * A run raises that floor,
// writes that entry, then updates every dependency. Each step is on by
// default: `--no-engines-node` leaves out step one, `--no-types-node` step two
// and `--no-dependencies` step three. A dry run reports what each step would
// do and changes no file.
//
// Held or not, a package resolves to a concrete version first, then `npm
// install` pins it and writes into package-lock.json. Resolving first is what
// makes package.json move: `npm install pkg@^24` leaves an existing `^24.1.0`
// range untouched, so its floor would never rise. `npm install pkg@24.13.3`
// rewrites it to `^24.13.3`.
//
// A range keeps its form: whatever stands in front of its version (`^`, `~`,
// `>=`, `=`, or nothing) stays in front of its new one. npm would otherwise
// write whichever form its configuration names, so each install passes those
// settings that fix it, and packages whose ranges share a form install
// together. See getSaveSettings.

// This script lives in scripts/helpers/. package.json and package-lock.json
// live one level up in scripts/, which is also where npm must run so it edits
// those two files. npm-version-exceptions.json sits next to
// this script.
const packageJsonDir = new URL("../", import.meta.url);
const packageJsonUrl = new URL("package.json", packageJsonDir);
const packageLockUrl = new URL("package-lock.json", packageJsonDir);
const npmVersionExceptionsUrl = new URL(
  "npm-version-exceptions.json",
  import.meta.url,
);
const npmCwd: string = fileURLToPath(packageJsonDir);

// Three kinds of string that this script keeps apart. Each is a plain string
// when this script runs: `__distinctStringType` is never set, and exists so
// `tsc` rejects one kind where another is expected, such as a range passed as a
// resolved version. This tag is optional so that a plain string is accepted as
// any kind, which lets parsed JSON and command-line arguments in without a
// cast. Its price is that a value held in a plain `string` loses its kind.
type DistinctStringType<T extends string> = string & {
  readonly __distinctStringType?: T | undefined;
};
// Such as "@types/node"
export type PackageName = DistinctStringType<"PackageName">;
// Such as "^24.1.0", ">=24.0.0 <=24.19.0"
export type VersionRange = DistinctStringType<"VersionRange">;
// Such as "24.13.3"
type Version = DistinctStringType<"Version">;

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

// Run npm through shell: cmd.exe resolves `npm` to `npm.cmd`, and a shell
// avoids Node's `.cmd` spawn restriction that execFile hits on Windows. That
// shell reads `npmArgs` as written, so a caller double-quotes any argument
// carrying a character a shell acts on. Returns output of command if
// requested.
function execNpm(npmArgs: string, captureOutput: boolean): string {
  return execSync(`npm ${npmArgs}`, {
    cwd: npmCwd,
    encoding: "utf8",
    stdio: captureOutput ? ["ignore", "pipe", "inherit"] : "inherit",
  });
}

// Asking `npm view` for `version`: * For a single match, like "latest" or
// "24.19.1", it prints a single value: string * For a range with several
// matches, like "^24", it prints an array in publish order: string[]
type NpmViewVersions = Version | Version[];

// `stringJson` parsed, where it holds a value other than null. `what` names
// that text in the error thrown where it holds null. Text that is not JSON
// throws `JSON.parse`'s own error.
function EnsureJsonParse<T>(stringJson: string, what: string): T {
  const parsedObj = JSON.parse(stringJson) as T;

  if (parsedObj === null) {
    throw new TcError(`${what} holds null, where a JSON value was expected`);
  }

  return parsedObj;
}

function EnsureJsonParseUrl<T>(url: URL): T {
  return EnsureJsonParse<T>(readFileSync(url, "utf8"), fileURLToPath(url));
}

// `obj`, where it is defined. `what` names it in the error thrown where it is
// not.
function EnsureObj<T>(obj: T | undefined, what: string): T {
  if (obj === undefined) {
    throw new TcError(`${what} is missing`);
  }

  return obj;
}

// Parse output down to its newest version: a string itself, or an array's last
// element. That last element is newest only where publish order follows
// version order, which is why nodeTypesRangeFromEngines confines its range to
// one major. An empty output (nothing matched) or an empty array throws. Kept
// separate from its shell call so it can be tested directly.
export function getRequestedVersion(
  npmViewOutputJson: string,
  packageName: PackageName,
  requestedRange: VersionRange,
): Version {
  try {
    const npmViewVersions = EnsureJsonParse<NpmViewVersions>(
      npmViewOutputJson,
      "npm view's output",
    );

    // Single Version
    if (!Array.isArray(npmViewVersions)) {
      return npmViewVersions;
    }

    // Last Version in Array
    const lastVersion = npmViewVersions[npmViewVersions.length - 1];

    return EnsureObj(lastVersion, "npm view's last version");
  } catch (e) {
    throw new TcError(
      `no published version of ${packageName} satisfies ${requestedRange}: npmViewOutputJson: ${npmViewOutputJson}`,
      { cause: e },
    );
  }
}

// Newest published version satisfying `requestedRange` (a range like "^24", or
// a dist-tag like "latest" in a range's place).
//
// A spec is double-quoted because a range is made of characters a shell acts
// on: `^` is cmd.exe's escape, `*` globs under a POSIX shell, and `>=24.0.0
// <=24.19.0` adds a space and two redirects. npm forbids a quote inside a
// package name or a range, so this wrapping is unambiguous.
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

// A dependency to update, and whichever range it is held to, if any.
type PackageToUpdate = {
  packageName: PackageName;
  requestedRange: VersionRange | undefined;
};

// Package dependencies to update, sorted by name: every one, or only those
// named in `packages` when it is not empty. A name in `packages` or in
// `exceptions` that is not a dependency selects nothing.
//
// An entry in `exceptions` alone holds a package. No package is treated
// specially here: a hold on `@types/node` arrives as
// one more entry.
//
// Takes data and returns data, so it can be tested without a filesystem, a
// network, or npm.
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

// Holds recorded in npm-version-exceptions.json, by package name. A file that
// is missing or incorrect holds no package, and this script says so.
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

// package-lock.json, read for which version of each package it has installed.
// Its `packages` are keyed by where a package sits, `node_modules/<name>` for a
// direct dependency. A lockfile that is missing or incorrect reads as one with
// no package, so every package is then installed.
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

// npm settings that make `npm install name@version` write a range in
// `origRange`'s form: whatever stands in front of its version stays in front
// of its new one. That is `^`, `~`, `>=`, `=`, or nothing for an exact
// version. Left alone, npm writes whichever form its own configuration names,
// a caret by default, whatever that range was. Both settings are always
// passed, so a form written does not depend on how npm is configured on a
// given machine.
//
// Its prefix setting is double-quoted because a shell acts on these characters:
// `^` is cmd.exe's escape, `~` expands under a POSIX shell, and `>` redirects
// under both.
//
// A range that is not one version with one of those in front throws rather than
// being rewritten: an upper bound such as `<2.0.0`, a range in parts such as
// `>=1.0.0 <2.0.0`, `1.x`, a tag. None of them has a single version that a
// newest release could replace.
export function getSaveSettings(
  packageName: PackageName,
  origRange: VersionRange,
): string {
  const form = /^(\^|~|>=|=)?\d+\.\d+\.\d+([-+][\w.+-]*)?$/.exec(origRange);
  if (form === null) {
    throw new TcError(
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

  // An exception naming a package that is not a dependency is a stale
  // entry. Report it rather than letting `npm install` add that package as a
  // side effect.
  for (const packageException of Object.keys(packageExceptions)) {
    if (!(packageException in origAllDependencies)) {
      console.warn(
        `npm-version-exceptions.json lists ${packageException}, which is not a dependency. Ignoring it.`,
      );
    }
  }

  // A package name on a command line that is not a dependency is a typo worth
  // stopping for, not a package to silently add.
  const unrecognizedCliPackage = npmUpdaterCliArgs.packages.filter(
    (name) => !(name in origAllDependencies),
  );
  if (unrecognizedCliPackage.length > 0) {
    throw new TcError(
      `not a dependency in package.json: ${unrecognizedCliPackage.join(", ")}. Name only a package that package.json lists.`,
    );
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
  // npm takes its save settings once for a whole command, so packages are
  // installed together only where their ranges have one form. Keyed by
  // those settings.
  const nameVersionStringsBySaveSettings: Record<string, string[]> = {};
  const packageLock = findPackageLock();
  for (const { packageName, requestedRange } of packagesToUpdate) {
    const origVersion = EnsureObj(
      origAllDependencies[packageName],
      `${packageName}'s range in package.json`,
    );
    const saveSettings = getSaveSettings(packageName, origVersion);

    const npmVersion = queryRequestedNpmVersion(
      packageName,
      requestedRange ?? "latest",
    );

    // A package is left out of this install only where both files already have
    // this version: its range in package.json and whichever version
    // package-lock.json has installed. A range can allow more than a hold does,
    // so package-lock.json is what shows a package that drifted.
    //
    // getSaveSettings has checked that this range is one version with at most a
    // prefix in front, so its version starts at its first digit.
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
      `Package: ${packageName}: ${origVersion} -> ${npmVersion}  (${versionNoteString})`,
    );
    if (alreadyAtVersion) {
      continue;
    }

    const nameVersionStrings = (nameVersionStringsBySaveSettings[
      saveSettings
    ] ??= []);
    nameVersionStrings.push(`${packageName}@${npmVersion}`);
  }

  // Each spec is `name@version` with a concrete version Used by "npm install
  // name@version" to modify package.json and package-lock.json files
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
    console.log("Every package is already at its version.");
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

  // Verify changes in package.json package.json is read a second time so its
  // report can see what that install moved.
  const newAllDependencies = getAllDependencies(
    EnsureJsonParseUrl<PackageJsonType>(packageJsonUrl),
  );

  // Both readings are compared directly, over every name in either, so this
  // report states what package.json shows and not what this run meant to do: a
  // range that changed, a dependency that appeared, or one that went.
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
      console.log(
        `Updated Package: ${packageName}: ${origRange} -> ${newRange}`,
      );
    }
  }
}

type NpmUpdaterCliArgs = {
  // --help: show UsageMessage, and do nothing else
  help: boolean;
  dryRun: boolean;
  // Raise package.json's Node floor first. On unless --no-engines-node
  enginesNode: boolean;
  // Write `@types/node`'s entry first. On unless --no-types-node
  typesNode: boolean;
  // Update every dependency. On unless --no-dependencies
  dependencies: boolean;
  // Empty means every dependency in package.json
  packages: PackageName[];
};

// Written as turbo-collection.ts writes its help: options before operands, a
// placeholder in angle brackets, and each option's default.
const UsageMessage = `Usage:
  node helpers/package-json-npm-updater.ts [options] [<package>...]

Update each <package>, or every dependency where none is named, to its newest
allowed release, rewriting package.json and package-lock.json. Each run first
raises package.json's Node floor, engines.node, to whichever Node runs it,
within that floor's major. A package in helpers/npm-version-exceptions.json
stays within its recorded range. @types/node always has an entry there, which
each run writes next: a range that keeps it at or below that floor. Each run
ends with npm ci, which deletes node_modules and installs exactly what
package-lock.json names.

Options:
  -n, --dry-run          Report what a run would write and install, and change
                         no file. Default: off.
      --engines-node     Raise engines.node to the Node running this update,
                         within its major. Default: on; --no-engines-node
                         leaves it out.
      --types-node      Write the @types/node entry first. Default: on;
                         --no-types-node leaves it out.
      --dependencies     Update each dependency. Default: on;
                         --no-dependencies leaves it out, so a run only writes
                         the @types/node entry.
  -h, --help             Show this help and exit.
`;

// Reads command line `argv` as POSIX's Utility Syntax Guidelines and GNU's
// long options describe, as turbo-collection.ts reads its own. An unknown
// option is an error, which `parseArgs` throws. Given --help, a command line's
// package names are passed over.
export function parseCliArgs(argv: readonly string[]): NpmUpdaterCliArgs {
  const { values, positionals } = parseArgs({
    args: [...argv],
    options: {
      // -n, as in GNU's table of long options
      "dry-run": { type: "boolean", short: "n", default: false },
      "engines-node": { type: "boolean", default: true },
      "types-node": { type: "boolean", default: true },
      dependencies: { type: "boolean", default: true },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: true,
    // --no-engines-node, --no-types-node and --no-dependencies
    allowNegative: true,
  });

  return {
    help: values.help,
    dryRun: values["dry-run"],
    enginesNode: values["engines-node"],
    typesNode: values["types-node"],
    dependencies: values.dependencies,
    packages: positionals,
  };
}

// Raises package.json's Node floor, `enginesNode`, to whichever Node runs this
// update, within that floor's major, and says so. Returns that floor as this
// run leaves it, or as a dry run would leave it, so `@types/node`'s entry
// follows it in a dry run too. See engines-node-floor.ts.
//
// `npm pkg set` writes that floor into package.json, changing no other line.
// package-lock.json repeats package.json's `engines`, and `npm install
// --package-lock-only` brings it up to date, touching no other line and no
// node_modules. Both measured under npm 11.20.0 and Node 26.13.1. Its setting
// is double-quoted because `>` redirects under both shells.
function raiseNodeFloor(
  enginesNode: string | undefined,
  dryRun: boolean,
): string | undefined {
  const nodeVersion = process.versions.node;
  const change = nodeFloorChange(enginesNode, nodeVersion);

  if (change.kind === "keep") {
    return enginesNode;
  }
  if (change.kind === "newerMajor") {
    console.log(
      `engines.node: ${enginesNode} kept. Node ${nodeVersion} runs this update, a newer major, and raising engines.node to it is a hand edit in package.json.`,
    );
    return enginesNode;
  }
  if (dryRun) {
    console.log(
      `Dry run: would raise engines.node from ${enginesNode} to ${change.enginesNode}, the Node running this update`,
    );
    return change.enginesNode;
  }

  execNpm(`pkg set "engines.node=${change.enginesNode}"`, false);
  execNpm("install --package-lock-only", false);
  console.log(
    `package.json: engines.node is now ${change.enginesNode}, the Node running this update`,
  );
  return change.enginesNode;
}

function updatePackageJson(npmUpdaterCliArgs: NpmUpdaterCliArgs): void {
  const packageJsonObj = EnsureJsonParseUrl<PackageJsonType>(packageJsonUrl);

  // First raise package.json's Node floor, then write `@types/node` in
  // npm-version-exceptions.json from that floor. Actual update that follows
  // then reads that file and knows nothing specific about `@types/node`.
  let enginesNode = packageJsonObj.engines?.node;
  if (npmUpdaterCliArgs.enginesNode) {
    enginesNode = raiseNodeFloor(enginesNode, npmUpdaterCliArgs.dryRun);
  }

  if (npmUpdaterCliArgs.typesNode) {
    writeNodeTypesException(
      npmVersionExceptionsUrl,
      getAllDependencies(packageJsonObj),
      enginesNode,
      npmUpdaterCliArgs.dryRun,
    );
  }

  if (npmUpdaterCliArgs.dependencies) {
    updateNpmPackageVersions(npmUpdaterCliArgs);
  }

  // `npm ci` deletes node_modules and installs exactly what package-lock.json
  // names, so lint and tests run against what package.json names, after an
  // update or none. It is an error where package.json and package-lock.json
  // disagree.
  console.log();
  if (npmUpdaterCliArgs.dryRun) {
    console.log("Dry run: would run `npm ci`");
    return;
  }
  execNpm("ci", /*captureOutput*/ false);
  console.log();
  console.log("Next: run `npm run lint && npm test`");
}

function main(): void {
  // A command line that cannot be read ends its run after UsageMessage, with
  // its error thrown again for Node to report.
  let npmUpdaterCliArgs: NpmUpdaterCliArgs;
  try {
    npmUpdaterCliArgs = parseCliArgs(process.argv.slice(2));
  } catch (e) {
    console.error(UsageMessage);
    throw e;
  }

  if (npmUpdaterCliArgs.help) {
    console.log(UsageMessage);
    return;
  }

  updatePackageJson(npmUpdaterCliArgs);
}

// Run only when executed directly, so a test can import every function above
// without triggering a real npm run.
if (import.meta.main) {
  main();
}
