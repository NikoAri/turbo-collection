import { lstatSync, realpathSync } from "node:fs";
import path from "node:path";

import { TcError } from "./helpers/tc-error.ts";

// Checks on a directory a run is given, where a TC Copy keeps
// its configuration, and when two paths in a TC Copy are one.

// A key under which two paths in a TC Copy that differ only in letter case, or
// only in Unicode normalization, are one path (turbo-collection-spec.md
// R-TGT-14): `relativePath` in NFC, then in upper case, by no computer's
// language.
export function pathKeyOf(relativePath: string): string {
  return relativePath.normalize("NFC").toUpperCase();
}

// Where a TC Copy whose root is `tcDirectory` keeps its configuration file
// (meta-file-spec.md R-MFILE-17). Something at this path is what makes a
// directory a TC Directory.
export function configurationFileOf(tcDirectory: string): string {
  return path.join(
    tcDirectory,
    ".turbo-collection",
    "turbo-collection-config.json",
  );
}

// Whether `directory` is a TC Directory: whether something is at its
// configuration file's path. A file standing where a directory on that path
// would be, such as a file named `.turbo-collection`, means nothing is there,
// which Linux and macOS report as ENOTDIR, not as ENOENT.
export function isTcDirectory(directory: string): boolean {
  try {
    return (
      lstatSync(configurationFileOf(directory), { throwIfNoEntry: false }) !==
      undefined
    );
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOTDIR") {
      return false;
    }
    throw e;
  }
}

// Whichever TC Directory `directory` is or lies inside, or undefined where
// there is none (turbo-collection-core-spec.md R-CLI-18). `directory` is looked
// at first, then each directory above it.
export function tcDirectoryAtOrAbove(directory: string): string | undefined {
  let current = path.resolve(directory);
  for (;;) {
    if (isTcDirectory(current)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

// Throws an error where `directory` lies inside a TC Copy
// (turbo-collection-core-spec.md R-CLI-18). A TC Copy at `directory` itself
// does not lie inside one.
export function ensureNotInsideTcCopy(directory: string): void {
  const directoryPath = path.resolve(directory);
  const parent = path.dirname(directoryPath);
  if (parent === directoryPath) {
    return;
  }
  const tcDirectory = tcDirectoryAtOrAbove(parent);
  if (tcDirectory !== undefined) {
    throw new TcError(
      `"${directoryPath}" lies inside a TC Copy at "${tcDirectory}", and a TC Copy never lies inside another. Give a directory outside every TC Copy.`,
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
