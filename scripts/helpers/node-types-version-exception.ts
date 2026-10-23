import console from "node:console";
import { readFileSync, writeFileSync } from "node:fs";
import type { URL } from "node:url";

import type { PackageName, VersionRange } from "./package-json-npm-updater.ts";
import { TcError } from "./tc-error.ts";

// A hold keeping `@types/node` at or below package.json's Node floor,
// `engines.node`, so those types never describe a newer Node than this code
// has to run on.
//
// package-json-npm-updater.ts holds a package only where
// npm-version-exceptions.json says so. So this hold is written into that file
// before each update, and that updater then reads it like any other entry.
// Writing it every time keeps this floor recorded once: raising `engines.node`
// is a single edit that moves both. It also means `@types/node`'s entry
// belongs to this script, and a range put there by hand lasts only until this
// script's next run.

const NodeTypesPackage: PackageName = "@types/node";

// A range keeping `@types/node` from describing a newer Node than
// package.json's floor, `engines.node`. Past that floor, `tsc` would accept an
// API that a Node at that floor cannot run.
//
// Its rule: no version those types carry is higher than this code's lowest
// supported Node. A floor of `>=24.19.0` becomes `>=24.0.0 <=24.19.0`, which
// selects whichever 24.x is newest at or below that floor's own version. A
// floor with no types release of that version lands on whichever release is
// nearest beneath it.
//
// That is stricter than `@types/node`'s numbering requires, and deliberately
// so. Its MAJOR.MINOR names which Node release it describes, while its PATCH
// only counts revisions of those types, so `24.19.1` still describes Node
// 24.19. A cap that followed that numbering would need this paragraph to be
// understood. This one is a plain comparison of two versions, and staying a
// few revisions behind is its accepted price. A floor with a patch above zero
// lets in only as many revisions as that patch happens to count.
//
// This range is two comparators over whole versions, as npm's documentation
// writes a bounded range (`>=1.0.2 <2.1.2`).
//
// Its lower bound is not redundant. `npm view` lists matches in publish order,
// not version order, so `<=24.19.0` alone ends on whichever older major was
// patched last (22.20.5 when this was written), and getRequestedVersion would
// take that as newest.
//
// Only a floor of form `>=MAJOR.MINOR.PATCH` is read. Anything else throws
// rather than guessing a floor.
export function nodeTypesRangeFromEngines(
  enginesNode: string | undefined,
): VersionRange {
  const floor = /^>=\s*((\d+)\.\d+\.\d+)$/.exec(enginesNode?.trim() ?? "");
  if (floor === null) {
    const found = enginesNode === undefined ? "missing" : `"${enginesNode}"`;
    throw new TcError(
      `cannot hold ${NodeTypesPackage} to the Node floor: engines.node in package.json is ${found}, expected the form >=MAJOR.MINOR.PATCH`,
    );
  }
  const [, floorVersion, major] = floor;
  return `>=${major}.0.0 <=${floorVersion}`;
}

// `exceptions` with `@types/node` held to `enginesNode`'s Node floor,
// replacing any range already recorded for it.
//
// Returns `exceptions` itself when there is nothing to change: its entry is
// already right, or `@types/node` is not among `dependencies`, in which
// case that floor is not read and no entry is added for
// package-json-npm-updater.ts to report as stale.
//
// Takes data and returns data, so it can be tested without a filesystem.
export function withNodeTypesException(
  exceptions: Record<PackageName, VersionRange>,
  dependencies: Record<PackageName, VersionRange>,
  enginesNode: string | undefined,
): Record<PackageName, VersionRange> {
  if (!(NodeTypesPackage in dependencies)) {
    return exceptions;
  }
  const range = nodeTypesRangeFromEngines(enginesNode);
  if (exceptions[NodeTypesPackage] === range) {
    return exceptions;
  }
  return { ...exceptions, [NodeTypesPackage]: range };
}

type ExceptionsFile = { packages?: Record<PackageName, VersionRange> };

// npm-version-exceptions.json as it stands. A file that is missing or incorrect
// is read as one with no entry, and this script says so.
function readExceptionsFile(npmVersionExceptionsUrl: URL): ExceptionsFile {
  try {
    return JSON.parse(
      readFileSync(npmVersionExceptionsUrl, "utf8"),
    ) as ExceptionsFile;
  } catch {
    console.warn(
      "npm-version-exceptions.json is missing or incorrect. Reading it as empty.",
    );
    return {};
  }
}

// Bring `@types/node`'s entry in npm-version-exceptions.json up to date, and
// say so when it moved. A run that finds that entry right leaves this file
// alone. A dry run leaves it alone too, and says what it would have written.
// Where this file is missing or incorrect, writing that entry writes
// npm-version-exceptions.json afresh, holding that entry alone.
export function writeNodeTypesException(
  npmVersionExceptionsUrl: URL,
  dependencies: Record<PackageName, VersionRange>,
  enginesNode: string | undefined,
  dryRun: boolean,
): void {
  const exceptionsFile = readExceptionsFile(npmVersionExceptionsUrl);
  const recorded = exceptionsFile.packages ?? {};

  const packages = withNodeTypesException(recorded, dependencies, enginesNode);
  if (packages === recorded) {
    return;
  }

  if (dryRun) {
    console.log(
      `Dry run: would hold ${NodeTypesPackage} to ${packages[NodeTypesPackage]} in npm-version-exceptions.json`,
    );
    return;
  }

  // Two-space indentation and a final newline, which is how Prettier leaves
  // this file.
  writeFileSync(
    npmVersionExceptionsUrl,
    `${JSON.stringify({ ...exceptionsFile, packages }, null, 2)}\n`,
  );
  console.log(
    `npm-version-exceptions.json: ${NodeTypesPackage} is now held to ${packages[NodeTypesPackage]}`,
  );
}
