import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

// Update every npm dependency to its newest allowed release, rewriting both package.json and
// package-lock.json, then report what moved.
//
// * Uses `@latest` for most packages.
// * `@types/node` is held to the Node floor that package.json records in `engines.node`, so the
//   types never describe a newer Node than the one this code has to run on.
// * Any package listed in npm-version-exceptions.json is held to the range recorded there instead.
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

type PackageJsonType = {
  engines?: { node?: string };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function readJson<T>(url: URL): T {
  return JSON.parse(readFileSync(url, "utf8")) as T;
}

export function getAllDependencies(
  packageJsonObj: PackageJsonType,
): Record<string, string> {
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
type NpmViewVersions = string | string[];

// Parse output down to the newest version: the string itself, or the last array element. The last
// element is the newest only where publish order follows version order, which is why
// nodeTypesRangeFromEngines confines its range to one major. An empty output (nothing matched) or
// an empty array throws. Kept separate from the shell call so it can be tested directly.
export function newestVersionFromNpmView(
  npmViewOutputJson: string,
  packageName: string,
  requestedVersion: string,
): string {
  const noMatchError = () =>
    new Error(
      `no published version of ${packageName} satisfies ${requestedVersion}`,
    );

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

// Newest published version satisfying `requestedVersion` (a dist-tag like "latest" or a range like
// "^24").
//
// The spec is double-quoted because a range is made of characters a shell acts on: `^` is the
// cmd.exe escape, `*` globs under a POSIX shell, and `^24 <=24.19` adds a space and a redirect.
// npm forbids a quote inside a package name or a range, so the wrapping is unambiguous.
function queryNewestVersion(
  packageName: string,
  requestedVersion: string,
): string {
  const npmViewOutputJson: string = execNpm(
    `view "${packageName}@${requestedVersion}" version --json`,
    /*captureOutput*/ true,
  );

  return newestVersionFromNpmView(
    npmViewOutputJson,
    packageName,
    requestedVersion,
  );
}

const NodeTypesPackage = "@types/node";

// The range that keeps `@types/node` from describing a newer Node than the floor in package.json
// `engines.node`. Past the floor, `tsc` would accept an API that the floor cannot run.
//
// The MAJOR.MINOR of `@types/node` names the Node release it describes, while its PATCH only
// counts revisions of the types. So the hold is on MAJOR.MINOR: a floor of `>=24.19.0` becomes
// `^24 <=24.19`, the newest 24.x at or below 24.19, whatever its patch. A floor whose minor has no
// types release of its own lands on the nearest one beneath it.
//
// The `^24` half is not redundant. `npm view` lists matches in publish order, not version order,
// so `<=24.19` alone ends on whichever older major was patched last (22.20.5 when this was
// written), and newestVersionFromNpmView would take that for the newest.
//
// Only the form `>=MAJOR.MINOR.PATCH` is read. Anything else throws rather than guessing a floor.
export function nodeTypesRangeFromEngines(
  enginesNode: string | undefined,
): string {
  const floor = /^>=\s*(\d+)\.(\d+)\.\d+$/.exec(enginesNode?.trim() ?? "");
  if (floor === null) {
    const found = enginesNode === undefined ? "missing" : `"${enginesNode}"`;
    throw new Error(
      `cannot hold ${NodeTypesPackage} to the Node floor: engines.node in package.json is ${found}, expected the form >=MAJOR.MINOR.PATCH`,
    );
  }
  const [, major, minor] = floor;
  return `^${major} <=${major}.${minor}`;
}

// A dependency to update, and the range it is held to, if any.
type PackageToUpdate = {
  packageName: string;
  heldRange: string | undefined;
};

// Package dependencies to update, sorted by name: every one, or only those named in `packages` when it
// is not empty. A name in `packages` or in `exceptions` that is not a dependency selects nothing.
//
// A recorded exception wins over the Node floor, so overriding the floor stays possible, and is
// visible in the file when somebody does it. The floor is read only when `@types/node` is being
// updated and has no exception.
//
// Takes data and returns data, so it can be tested without the filesystem, the network, or npm.
export function getPackagesToUpdate(
  packageJsonObj: PackageJsonType,
  exceptions: Record<string, string>,
  packages: string[],
): PackageToUpdate[] {
  return Object.keys(getAllDependencies(packageJsonObj))
    .sort()
    .filter((name) => packages.length === 0 || packages.includes(name))
    .map((packageName) => ({
      packageName,
      heldRange:
        exceptions[packageName] ??
        (packageName === NodeTypesPackage
          ? nodeTypesRangeFromEngines(packageJsonObj.engines?.node)
          : undefined),
    }));
}

function updateNpmPackageVersions(npmUpdaterCliArgs: NpmUpdaterCliArgs): void {
  const packageJsonObj = readJson<PackageJsonType>(packageJsonUrl);
  const initAllDependencies = getAllDependencies(packageJsonObj);

  const packageExceptions =
    readJson<{ packages?: Record<string, string> }>(npmVersionExceptionsUrl)
      .packages ?? {};

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
    const version = queryNewestVersion(packageName, heldRange ?? "latest");
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
  execNpm(`install ${specs.join(" ")}`, /*captureOutput*/ false);

  // package.json is read a second time so the report can see what the install moved.
  const after = getAllDependencies(readJson<PackageJsonType>(packageJsonUrl));
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
  packages: string[]; // Empty means every dependency in package.json
};

const UsageMessage = `Usage: node package-json-npm-updater.ts [options] [package...]

Update dependencies to their newest allowed release, rewriting package.json and
package-lock.json. With no package names, every dependency is updated; otherwise only
the named ones. @types/node stays at or below the Node floor in package.json engines.
A package in npm-version-exceptions.json stays within its recorded range.

Options:
  -n, --dry-run   Resolve and report the newest versions without installing.
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

  updateNpmPackageVersions(npmUpdaterCliArgs);
}

// Run only when executed directly, so a test can import the functions above without triggering a
// real npm run.
if (import.meta.main) {
  main();
}
