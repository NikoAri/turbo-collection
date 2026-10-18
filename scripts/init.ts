import { randomUUID } from "node:crypto";
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

// The init operation, which makes a directory a copy (init-spec.md R-INIT-1).

// The starter ignore file (meta-file-spec.md R-MFILE-20).
const StarterIgnoreFileUrl = new URL(
  "./templates/default.tcignore",
  import.meta.url,
);

// The version of meta-file-spec.md that a meta file written by this code states (R-MFILE-4).
const MetaFileSpecVersion = "0.1.0-draft";

// Creates `directory` where it does not exist, with every directory above it that does not exist
// (R-INIT-2). One that exists is left as it is.
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
// (R-INIT-3).
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

// The name of the collection a copy in `directory` begins (R-INIT-4): `givenName` as given where
// there is one, and otherwise the name of the directory, unchanged. A collection's name is not
// empty (meta-file-spec.md R-MFILE-18), and an empty one is an error.
export function collectionNameFor(
  directory: string,
  givenName: string | undefined,
): string {
  if (givenName !== undefined) {
    if (givenName === "") {
      throw new Error("A collection's name cannot be empty.");
    }
    return givenName;
  }

  // The root of a drive has no name.
  const directoryPath = path.resolve(directory);
  const directoryName = path.basename(directoryPath);
  if (directoryName === "") {
    throw new Error(
      `No name for the collection can be taken from "${directoryPath}". Give one with --name.`,
    );
  }

  return directoryName;
}

// The name a new copy takes where none is given (R-INIT-4).
const DefaultCopyName = "main";

// A character a copy's name cannot hold: a control character, or one that an operating system
// refuses in a filename (meta-file-spec.md R-MFILE-19).
const CharacterNotInCopyName = /[\p{Cc}<>:"\/\\|?*]/u;

// The name of a new copy (R-INIT-4): `givenName` in Unicode Normalization Form C where there is
// one, and otherwise `main`. A name that is empty or holds a character it cannot hold is an error
// (meta-file-spec.md R-MFILE-18, R-MFILE-19).
export function copyNameFor(givenName: string | undefined): string {
  if (givenName === undefined) {
    return DefaultCopyName;
  }

  const copyName = givenName.normalize("NFC");
  if (copyName === "" || CharacterNotInCopyName.test(copyName)) {
    throw new Error(
      `"${givenName}" cannot be a copy's name. A name is not empty, and holds no control character and none of < > : " / \\ | ? *.`,
    );
  }

  return copyName;
}

// A copy's configuration file (meta-file-spec.md R-MFILE-18).
export type TcConfig = {
  version: string;
  collectionId: string;
  collectionName: string;
  copyName: string;
};

// Makes `directory` the first copy of a new collection, and returns the configuration it writes
// there (R-INIT-1).
//
// Both names are checked before a directory is created, and the directory before a file is
// written. The ignore file is written first and the configuration file last, since the
// configuration file is what makes a directory a copy.
export function initializeTc(
  directory: string,
  givenCollectionName: string | undefined,
  givenCopyName: string | undefined,
): TcConfig {
  const collectionName = collectionNameFor(directory, givenCollectionName);
  const copyName = copyNameFor(givenCopyName);
  createDirectoryIfMissing(directory);
  ensureDirectoryHoldsNoFiles(directory);

  // The starter ignore file is copied byte for byte, so what a copy holds does not depend on the
  // operating system that made it (R-CLI-15).
  copyFileSync(StarterIgnoreFileUrl, path.join(directory, ".tcignore"));

  // The fields of R-MFILE-18, each on a line of its own (R-MFILE-27). Init generates the
  // collection's ID (R-INIT-4), which Node writes in lower case.
  const tcConfig: TcConfig = {
    version: MetaFileSpecVersion,
    collectionId: randomUUID(),
    collectionName,
    copyName,
  };
  const metaDirectory = path.join(directory, ".turbo-collection");
  mkdirSync(metaDirectory, { recursive: true });
  writeFileSync(
    path.join(metaDirectory, "turbo-collection-config.json"),
    `${JSON.stringify(tcConfig, null, 2)}\n`,
  );

  return tcConfig;
}
