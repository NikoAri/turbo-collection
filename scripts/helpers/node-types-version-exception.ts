import { readFileSync, writeFileSync } from "node:fs";
import type { URL } from "node:url";

import type { PackageName, VersionRange } from "./package-json-npm-updater.ts";

// The hold that keeps `@types/node` at or below the Node floor in package.json `engines.node`, so
// the types never describe a newer Node than the one this code has to run on.
//
// package-json-npm-updater.ts holds a package only where npm-version-exceptions.json says so. So
// this hold is written into that file before each update, and the updater then reads it like any
// other entry. Writing it every time keeps the floor recorded once: raising `engines.node` is the
// single edit that moves both. It also means the entry for `@types/node` belongs to this script,
// and a range put there by hand lasts only until the next run.

const NodeTypesPackage: PackageName = "@types/node";

// The range that keeps `@types/node` from describing a newer Node than the floor in package.json
// `engines.node`. Past the floor, `tsc` would accept an API that the floor cannot run.
//
// The rule: the lowest Node this code supports is the highest version the types may carry. A
// floor of `>=24.19.0` becomes `>=24.0.0 <=24.19.0`, the newest 24.x at or below the floor's own
// version. A floor with no types release of that version lands on the nearest one beneath it.
//
// That is stricter than the numbering of the types requires, and deliberately so. The MAJOR.MINOR
// of `@types/node` names the Node release it describes, while its PATCH only counts revisions of
// the types, so `24.19.1` still describes Node 24.19. A cap that followed that numbering would
// need this paragraph to be understood. This one is a plain comparison of two versions, and
// staying a few revisions of the types behind is the accepted price. A floor with a patch above
// zero lets in only as many revisions as that patch happens to count.
//
// The range is two comparators over whole versions, the form npm's documentation uses for a
// bounded range (`>=1.0.2 <2.1.2`).
//
// The lower bound is not redundant. `npm view` lists matches in publish order, not version order,
// so `<=24.19.0` alone ends on whichever older major was patched last (22.20.5 when this was
// written), and getRequestedVersion would take that for the newest.
//
// Only the form `>=MAJOR.MINOR.PATCH` is read. Anything else throws rather than guessing a floor.
export function nodeTypesRangeFromEngines(
  enginesNode: string | undefined,
): VersionRange {
  const floor = /^>=\s*((\d+)\.\d+\.\d+)$/.exec(enginesNode?.trim() ?? "");
  if (floor === null) {
    const found = enginesNode === undefined ? "missing" : `"${enginesNode}"`;
    throw new Error(
      `cannot hold ${NodeTypesPackage} to the Node floor: engines.node in package.json is ${found}, expected the form >=MAJOR.MINOR.PATCH`,
    );
  }
  const [, floorVersion, major] = floor;
  return `>=${major}.0.0 <=${floorVersion}`;
}

// `exceptions` with `@types/node` held to the Node floor in `enginesNode`, replacing any range
// already recorded for it.
//
// Returns `exceptions` itself when there is nothing to change: its entry is already right, or
// `@types/node` is not among `dependencies`, in which case the floor is not read and no entry is
// added for the updater to report as stale.
//
// Takes data and returns data, so it can be tested without the filesystem.
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

// Bring the entry for `@types/node` in npm-version-exceptions.json up to date, and say so when
// it moved. A run that finds the entry right leaves the file alone.
export function writeNodeTypesException(
  npmVersionExceptionsUrl: URL,
  dependencies: Record<PackageName, VersionRange>,
  enginesNode: string | undefined,
): void {
  const exceptionsFile = JSON.parse(
    readFileSync(npmVersionExceptionsUrl, "utf8"),
  ) as { packages?: Record<PackageName, VersionRange> };
  const recorded = exceptionsFile.packages ?? {};

  const packages = withNodeTypesException(recorded, dependencies, enginesNode);
  if (packages === recorded) {
    return;
  }

  // Two-space indentation and a final newline, which is how Prettier leaves this file.
  writeFileSync(
    npmVersionExceptionsUrl,
    `${JSON.stringify({ ...exceptionsFile, packages }, null, 2)}\n`,
  );
  console.log(
    `npm-version-exceptions.json: ${NodeTypesPackage} is now held to ${packages[NodeTypesPackage]}`,
  );
}
