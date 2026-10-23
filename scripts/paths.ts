import { lstatSync, realpathSync } from "node:fs";
import path from "node:path";

import { TcError } from "./helpers/tc-error.ts";

// Checks on a directory a run is given, and where a copy keeps
// its configuration.

// Where a copy whose root is `copyRoot` keeps its configuration file
// (meta-file-spec.md R-MFILE-17). Something at this path is what makes a
// directory a copy.
export function configurationFileOf(copyRoot: string): string {
  return path.join(
    copyRoot,
    ".turbo-collection",
    "turbo-collection-config.json",
  );
}

// Root of whichever copy `directory` is or lies inside, or undefined where
// there is none (turbo-collection-core-spec.md R-CLI-18). `directory` is looked
// at first, then each directory above it.
export function copyRootAtOrAbove(directory: string): string | undefined {
  let current = path.resolve(directory);
  for (;;) {
    if (
      lstatSync(configurationFileOf(current), { throwIfNoEntry: false }) !==
      undefined
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

// Throws an error where `directory` lies inside a copy
// (turbo-collection-core-spec.md R-CLI-18). A copy at `directory` itself does
// not lie inside one.
export function ensureNotInsideCopy(directory: string): void {
  const directoryPath = path.resolve(directory);
  const parent = path.dirname(directoryPath);
  if (parent === directoryPath) {
    return;
  }
  const copyRoot = copyRootAtOrAbove(parent);
  if (copyRoot !== undefined) {
    throw new TcError(
      `"${directoryPath}" lies inside a copy at "${copyRoot}", and a copy never lies inside another. Give a directory outside every copy.`,
    );
  }
}

// Throws an error where `directory`'s path passes through a symbolic link or a
// junction, naming which directory that path leads to
// (turbo-collection-core-spec.md R-CLI-20). Node reports a junction as a
// symbolic link.
//
// Only what exists of that path is looked at, a directory at a time from its
// root. A directory that does not exist yet is one a run makes, and so is not
// a link.
export function ensureNoLinkInPath(directory: string): void {
  const absolute = path.resolve(directory);
  const { root } = path.parse(absolute);
  const segments = absolute
    .slice(root.length)
    .split(path.sep)
    .filter((segment) => segment !== "");

  let current = root;
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    const stats = lstatSync(current, { throwIfNoEntry: false });
    if (stats === undefined) {
      return;
    }
    if (stats.isSymbolicLink()) {
      const leadsTo = path.join(
        realpathSync.native(current),
        ...segments.slice(index + 1),
      );
      throw new TcError(
        `"${absolute}" passes through a link at "${current}", and Turbo-Collection does not follow links. Give the directory it leads to instead: "${leadsTo}".`,
      );
    }
  }
}
