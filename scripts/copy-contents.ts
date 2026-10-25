import { readdirSync, type Dirent } from "node:fs";
import path from "node:path";

import { TcError } from "./helpers/tc-error.ts";
import { readManifest, type Manifest } from "./meta-files.ts";
import { pathKeyOf } from "./paths.ts";
import type { IsIgnored } from "./tcignore.ts";

// What a copy holds, read from its directories and their meta files, as a
// backup reads each of its two copies before it writes to either.

// What one directory of a copy holds.
export type DirectoryContents = {
  // Each content file at its path here, by name: a regular file that is not
  // ignored (meta-file-spec.md R-MFILE-21), whether or not a manifest
  // lists it
  files: Set<string>;
  // This directory's manifest, where it has one (R-MFILE-8)
  manifest: Manifest | undefined;
  // Each receipt file in this directory's `.turbo-collection`, by name
  // (R-MFILE-13, R-MFILE-26)
  receiptFiles: string[];
};

// What a copy holds.
export type CopyContents = {
  // Each directory that is not ignored, by its path from its copy's root,
  // with `/` between segments: "" is that root
  directories: Map<string, DirectoryContents>;
  // Each entry that is neither a regular file nor a directory, such as a
  // link (turbo-collection-core-spec.md R-CLI-19)
  notRegular: string[];
  // Each entry of a `.turbo-collection` directory that is no meta file
  // there, and so is not read (meta-file-spec.md R-MFILE-1)
  unrecognized: string[];
};

// A receipt file's name, `receipt-<runId>-<copyName>.<kind>.json`, a run ID
// being a UTC instant to the second, `-` and four hexadecimal digits
// (meta-file-spec.md R-MFILE-13, R-MFILE-26).
const ReceiptFileName =
  /^receipt-\d{8}T\d{6}Z-[0-9a-f]{4}-.+\.(arrival|error|location)\.json$/;

// What a read of one copy needs as it goes, and what it has found so far.
type Reading = {
  copyRoot: string;
  isIgnored: IsIgnored;
  contents: CopyContents;
};

// Reads what a copy at `copyRoot` holds, at every depth. `isIgnored` is its
// ignore file's test (meta-file-spec.md R-MFILE-20): a directory it ignores
// is not looked into, and an entry it ignores is passed over, whatever its
// kind (turbo-collection-core-spec.md R-CLI-19). A meta file is read
// whatever that test says of its name.
//
// A configuration file below `copyRoot` is an error, since a copy never lies
// inside another (R-CLI-18), and so is a manifest that cannot be read
// (meta-file-spec.md R-MFILE-7).
export function readCopy(copyRoot: string, isIgnored: IsIgnored): CopyContents {
  const reading: Reading = {
    copyRoot,
    isIgnored,
    contents: { directories: new Map(), notRegular: [], unrecognized: [] },
  };
  readDirectory(reading, "");
  return reading.contents;
}

// Throws where `name`, of an entry at `file`, is `spelling`, a name
// Turbo-Collection gives a meta file or their directory, in another letter
// case or normalization, or is not `isDirectory` as that name's entry is.
// Such a name is that one (turbo-collection-spec.md R-TGT-14), and a run
// writing at its spelling would make a second entry beside it on a drive
// that tells case apart.
function ensureSpelledAs(
  file: string,
  name: string,
  spelling: string,
  isDirectory: boolean,
  entry: Dirent,
): void {
  if (
    pathKeyOf(name) === pathKeyOf(spelling) &&
    (name !== spelling || entry.isDirectory() !== isDirectory)
  ) {
    throw new TcError(
      `"${file}" stands where Turbo-Collection keeps ${isDirectory ? "a directory" : "a file"} named "${spelling}". Rename it, so that it is not taken for one.`,
    );
  }
}

// Whether `isIgnored` ignores `entry`, at `entryPath` in its copy. For that
// test, a directory's path ends in `/` (tcignore.ts).
function ignores(
  isIgnored: IsIgnored,
  entryPath: string,
  entry: Dirent,
): boolean {
  return isIgnored(entry.isDirectory() ? `${entryPath}/` : entryPath);
}

// Adds what a directory at `relativePath` holds, then each directory it
// holds, in turn.
function readDirectory(reading: Reading, relativePath: string): void {
  const directory = path.join(reading.copyRoot, relativePath);
  const here: DirectoryContents = {
    files: new Set(),
    manifest: undefined,
    receiptFiles: [],
  };
  reading.contents.directories.set(relativePath, here);
  const prefix = relativePath === "" ? "" : `${relativePath}/`;

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = `${prefix}${entry.name}`;
    ensureSpelledAs(
      path.join(directory, entry.name),
      entry.name,
      ".turbo-collection",
      true,
      entry,
    );
    if (entry.name === ".turbo-collection") {
      readMetaDirectory(reading, relativePath, here);
    } else if (ignores(reading.isIgnored, entryPath, entry)) {
      continue;
    } else if (entry.isDirectory()) {
      readDirectory(reading, entryPath);
    } else if (!entry.isFile()) {
      reading.contents.notRegular.push(path.join(directory, entry.name));
    } else if (entryPath !== ".tcignore") {
      // At a copy's root, `.tcignore` is its ignore file, a meta file
      // (R-MFILE-2), and anywhere else it is a content file
      here.files.add(entry.name);
    }
  }
}

// Adds what `.turbo-collection` holds in a directory at `relativePath` to
// `here`: its manifest, and its receipt files' names. Only a copy's root
// holds a configuration file and location receipt files (meta-file-spec.md
// R-MFILE-2).
function readMetaDirectory(
  reading: Reading,
  relativePath: string,
  here: DirectoryContents,
): void {
  const directory = path.join(reading.copyRoot, relativePath);
  const metaDirectory = path.join(directory, ".turbo-collection");
  const isRoot = relativePath === "";
  const prefix = isRoot ? "" : `${relativePath}/`;

  for (const entry of readdirSync(metaDirectory, { withFileTypes: true })) {
    const entryPath = `${prefix}.turbo-collection/${entry.name}`;
    const file = path.join(metaDirectory, entry.name);
    for (const spelling of ["manifest.json", "turbo-collection-config.json"]) {
      ensureSpelledAs(file, entry.name, spelling, false, entry);
    }
    if (entry.name === "turbo-collection-config.json") {
      // A copy's own configuration file is read before its copy is
      if (!isRoot) {
        throw new TcError(
          `"${directory}" is a copy inside the copy at "${reading.copyRoot}", and a copy never lies inside another.`,
        );
      }
    } else if (entry.isFile() && entry.name === "manifest.json") {
      here.manifest = readManifest(directory);
    } else if (entry.isFile() && isReceiptFileName(entry.name, isRoot)) {
      here.receiptFiles.push(entry.name);
    } else if (!ignores(reading.isIgnored, entryPath, entry)) {
      if (entry.isFile() || entry.isDirectory()) {
        reading.contents.unrecognized.push(file);
      } else {
        reading.contents.notRegular.push(file);
      }
    }
  }
}

// Whether `name` is a receipt file's name in a `.turbo-collection`: an
// arrival file's or an error file's anywhere, and a location receipt file's
// at a copy's root alone, which `isRoot` says it is (R-MFILE-2).
function isReceiptFileName(name: string, isRoot: boolean): boolean {
  const kind = ReceiptFileName.exec(name)?.[1];
  return (
    kind === "arrival" || kind === "error" || (kind === "location" && isRoot)
  );
}
