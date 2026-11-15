import { TcError } from "./tc-error.ts";

// Raises package.json's Node floor, `engines.node`, to whichever Node runs an
// update, so that floor follows each Node release this code is updated on.
//
// A floor is only raised, never lowered, and only within its own major. A
// newer major changes which Node line this code supports, and a new major is
// no long-term support release when it first comes out, so moving to one is a
// hand edit.

// What an update does with `engines.node`, given whichever Node runs it.
export type NodeFloorChange =
  // A Node newer than that floor, within its major: raise it to `enginesNode`
  | { kind: "raise"; enginesNode: string }
  // A Node at or below that floor: keep it
  | { kind: "keep" }
  // A Node of a newer major: keep it, since moving there is a hand edit
  | { kind: "newerMajor" };

type VersionParts = [major: number, minor: number, patch: number];

function versionParts(match: RegExpExecArray): VersionParts {
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

// Negative where `a` is older than `b`, zero where both are one version, and
// positive where `a` is newer. Each part compares as a number, so 26.10.0 is
// newer than 26.9.0.
function compareVersions(a: VersionParts, b: VersionParts): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

// How `enginesNode`, a floor of form `>=MAJOR.MINOR.PATCH`, changes for a run
// on Node `nodeVersion`, as `process.versions.node` gives it, such as
// "26.13.1".
//
// Only that floor's form is read, as node-types-version-exception.ts reads it,
// and only a Node release, with no prerelease suffix. Anything else throws
// rather than guessing: a floor raised to a prerelease's version would leave
// out that prerelease itself.
//
// Takes data and returns data, so it can be tested without a filesystem.
export function nodeFloorChange(
  enginesNode: string | undefined,
  nodeVersion: string,
): NodeFloorChange {
  const floorMatch = /^>=\s*(\d+)\.(\d+)\.(\d+)$/.exec(
    enginesNode?.trim() ?? "",
  );
  if (floorMatch === null) {
    const found = enginesNode === undefined ? "missing" : `"${enginesNode}"`;
    throw new TcError(
      `cannot raise package.json's Node floor: engines.node is ${found}, expected the form >=MAJOR.MINOR.PATCH`,
    );
  }
  const nodeMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec(nodeVersion);
  if (nodeMatch === null) {
    throw new TcError(
      `cannot raise engines.node to Node ${nodeVersion}: only a release, MAJOR.MINOR.PATCH with no suffix, can be a floor. --no-engines-node leaves this step out.`,
    );
  }

  const floor = versionParts(floorMatch);
  const node = versionParts(nodeMatch);
  if (node[0] > floor[0]) {
    return { kind: "newerMajor" };
  }
  if (compareVersions(node, floor) <= 0) {
    return { kind: "keep" };
  }
  return { kind: "raise", enginesNode: `>=${nodeVersion}` };
}
