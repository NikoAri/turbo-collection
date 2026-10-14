import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { URL } from "node:url";

import {
  compileIgnorePatterns,
  readIgnorePatterns,
  type IsIgnored,
} from "./tcignore.ts";

// The init operation, which makes a directory a copy (turbo-collection-core-spec.md R-CLI-11).

// The starter ignore file (meta-file-spec.md R-MFILE-20).
const StarterIgnoreFileUrl = new URL(
  "./templates/default.tcignore",
  import.meta.url,
);

// The version of meta-file-spec.md that a meta file written by this code states (R-MFILE-4).
const MetaFileSpecVersion = "0.1.0-draft";

// Creates `directory` where it does not exist, with every directory above it that does not exist
// (R-CLI-11). One that exists is left as it is.
export function createDirectoryIfMissing(directory: string): void {
  mkdirSync(directory, { recursive: true });
}

// The first file under `directory` that `isIgnored` does not ignore, or undefined where there is
// none. The file is given as a path relative to `directory`, with `/` between its segments.
//
// Anything that is not a directory counts as a file. A directory that is ignored is not looked
// into, and `pathPrefix` is the path so far, for the directories below the first.
function findFileNotIgnored(
  directory: string,
  isIgnored: IsIgnored,
  pathPrefix = "",
): string | undefined {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = pathPrefix + entry.name;
    if (!entry.isDirectory()) {
      if (!isIgnored(entryPath)) {
        return entryPath;
      }
    } else if (!isIgnored(`${entryPath}/`)) {
      const found = findFileNotIgnored(
        path.join(directory, entry.name),
        isIgnored,
        `${entryPath}/`,
      );
      if (found !== undefined) {
        return found;
      }
    }
  }
  return undefined;
}

// Throws an error where `directory` holds a file, at any depth, that no starter pattern ignores
// (R-CLI-11).
export function ensureDirectoryHoldsNoFiles(directory: string): void {
  const isIgnored = compileIgnorePatterns(
    readIgnorePatterns(readFileSync(StarterIgnoreFileUrl, "utf8")),
  );
  const found = findFileNotIgnored(directory, isIgnored);
  if (found !== undefined) {
    throw new Error(
      `"${path.resolve(directory)}" holds a file that the starter .tcignore does not ignore: "${found}". Init makes a copy only in a directory that holds no such file.`,
    );
  }
}

// A copy's name is not empty (meta-file-spec.md R-MFILE-18), and holds only the letters `a`
// through `z`, digits and hyphen (R-MFILE-19).
const CollectionNamePattern = /^[a-z0-9-]+$/;

// The name a copy takes from the name of its directory (R-CLI-11): the letters `A` through `Z` in
// lower case, one hyphen for each run of ASCII characters that are neither a letter nor a digit,
// and no hyphen at either end. A character outside ASCII is left as it is.
function nameFromDirectoryName(directoryName: string): string {
  return directoryName
    .replace(/[A-Z]/g, (letter) => letter.toLowerCase())
    .replace(/[^a-z0-9\u0080-￿]+/g, "-")
    .replace(/^-|-$/g, "");
}

// The name of a new copy in `directory` (R-CLI-11): `givenName` as typed where there is one, and
// otherwise a name taken from that of the directory. A name that is not valid is an error.
export function collectionNameFor(
  directory: string,
  givenName: string | undefined,
): string {
  if (givenName !== undefined) {
    if (!CollectionNamePattern.test(givenName)) {
      throw new Error(
        `"${givenName}" cannot be a copy's name. A name holds lower case letters, digits and hyphens.`,
      );
    }
    return givenName;
  }

  const directoryPath = path.resolve(directory);
  const name = nameFromDirectoryName(path.basename(directoryPath));
  if (!CollectionNamePattern.test(name)) {
    throw new Error(
      `No name for the copy can be taken from "${directoryPath}". Give one with -n, in lower case letters, digits and hyphens.`,
    );
  }
  return name;
}

// Makes `directory` a copy, and returns the name that copy takes (R-CLI-11).
//
// The name is checked before a directory is created, and the directory before a file is written.
// The ignore file is written first and the configuration file last, since the configuration file
// is what makes a directory a copy. A description is optional, and an empty one is none.
export function init(
  directory: string,
  givenName: string | undefined,
  description: string | undefined,
): string {
  const name = collectionNameFor(directory, givenName);
  createDirectoryIfMissing(directory);
  ensureDirectoryHoldsNoFiles(directory);

  // The starter ignore file is copied byte for byte, so what a copy holds does not depend on the
  // operating system that made it (R-CLI-15).
  copyFileSync(StarterIgnoreFileUrl, path.join(directory, ".tcignore"));

  // The fields of R-MFILE-18, each on a line of its own (R-MFILE-27).
  const configuration = {
    version: MetaFileSpecVersion,
    collectionName: name,
    ...(description ? { collectionDescription: description } : {}),
  };
  const metaDirectory = path.join(directory, ".turbo-collection");
  mkdirSync(metaDirectory, { recursive: true });
  writeFileSync(
    path.join(metaDirectory, "turbo-collection-config.json"),
    `${JSON.stringify(configuration, null, 2)}\n`,
  );
  return name;
}
