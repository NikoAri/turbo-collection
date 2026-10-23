import { lstatSync, readdirSync } from "node:fs";
import path from "node:path";

import { TcError } from "./helpers/tc-error.ts";
import { configurationFileOf } from "./paths.ts";

// Local-folder Import Source's Importer
// (local-folder-import-source-spec.md): which files of an Imported directory
// it supplies, and each one's Supplied path.

// One file an Importer supplies, an Item of its own (R-LOCALFOLDER-4):
// `readPath`, where it is read from, and `suppliedPath`, its Supplied path,
// with `/` between its segments (import-spec.md R-SRC-21).
export type Item = {
  readPath: string;
  suppliedPath: string;
};

// What a look through an Imported directory finds.
export type LocalFolderListing = {
  // Files to import (R-LOCALFOLDER-3)
  items: Item[];
  // Each directory named `.turbo-collection` passed over (R-LOCALFOLDER-3)
  passedOver: string[];
  // Each entry that is neither a regular file nor a directory, such as a
  // link, any of which fails its import (import-spec.md R-SRC-22)
  notRegular: string[];
};

// Looks through `importedDirectory` at every depth, and lists what it finds.
// A Supplied path starts with `importedDirectory`'s name (R-LOCALFOLDER-6).
// `isIgnored` says whether a receiving copy's ignore file ignores a Supplied
// path, which ends in `/` for a directory; an ignored entry of any
// kind is passed over, and an ignored directory is not looked into
// (R-LOCALFOLDER-3, import-spec.md R-SRC-22).
//
// A directory below `importedDirectory` that is a copy is an error, since an
// Imported directory holds no copy (R-LOCALFOLDER-2).
export function listLocalFolder(
  importedDirectory: string,
  isIgnored: (suppliedPath: string) => boolean,
): LocalFolderListing {
  const listing: LocalFolderListing = {
    items: [],
    passedOver: [],
    notRegular: [],
  };
  lookThrough(
    importedDirectory,
    `${path.basename(importedDirectory)}/`,
    importedDirectory,
    isIgnored,
    listing,
  );
  return listing;
}

// Adds what `directory` holds to `listing`, and looks into each directory it
// holds in turn. `suppliedPrefix` is `directory`'s Supplied path, ending in
// `/`.
function lookThrough(
  directory: string,
  suppliedPrefix: string,
  importedDirectory: string,
  isIgnored: (suppliedPath: string) => boolean,
  listing: LocalFolderListing,
): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    const suppliedPath = `${suppliedPrefix}${entry.name}`;

    if (entry.name === ".turbo-collection" && entry.isDirectory()) {
      if (
        lstatSync(configurationFileOf(directory), { throwIfNoEntry: false }) !==
        undefined
      ) {
        throw new TcError(
          `"${importedDirectory}" holds a copy at "${directory}", and a directory that holds a copy is not imported. Give a directory that holds none.`,
        );
      }
      listing.passedOver.push(entryPath);
    } else if (entry.isDirectory()) {
      if (!isIgnored(`${suppliedPath}/`)) {
        lookThrough(
          entryPath,
          `${suppliedPath}/`,
          importedDirectory,
          isIgnored,
          listing,
        );
      }
    } else if (isIgnored(suppliedPath)) {
      continue;
    } else if (entry.isFile()) {
      listing.items.push({ readPath: entryPath, suppliedPath });
    } else {
      listing.notRegular.push(entryPath);
    }
  }
}
