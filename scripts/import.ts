import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  closeSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  statSync,
  writeSync,
} from "node:fs";
import path from "node:path";

import { takeCollectionLock } from "./collection-lock.ts";
import { dateToString } from "./helpers/date-helper.ts";
import { TcError } from "./helpers/tc-error.ts";
import { listLocalFolder, type Item } from "./local-folder-importer.ts";
import { logger } from "./logger.ts";
import {
  compareManifestNames,
  contentDigestOf,
  metaDirectoryOf,
  readConfigurationFile,
  readManifest,
  writeManifest,
  writeReceiptFile,
  type ManifestEntry,
} from "./meta-files.ts";
import {
  configurationFileOf,
  tcDirectoryAtOrAbove,
  ensureNoLinkInPath,
  ensureNotInsideTcCopy,
  isTcDirectory,
  pathKeyOf,
} from "./paths.ts";
import {
  isUncertain,
  photoPlaceOf,
  type PhotoPlace,
} from "./photo-path-layout.ts";
import {
  compileIgnorePatterns,
  readIgnorePatterns,
  type IsIgnored,
} from "./tcignore.ts";
import {
  LocalFolderImportSourceSpecVersion,
  MetaFileSpecVersion,
  PhotoPathLayoutSpecVersion,
  SuppliedPathLayoutSpecVersion,
} from "./versions.ts";

// Import (import-spec.md) from Local-folder Import Source, under photo-path
// layout or supplied-path layout.

// Local-folder Import Source's identifier
// (local-folder-import-source-spec.md R-LOCALFOLDER-1).
const LocalFolder = "local-folder";

// What an import records of whichever import source and layout placed a
// directory's content (meta-file-spec.md R-MFILE-9, R-MFILE-15), each
// layout by its identifier (photo-path-layout-spec.md R-PHOTO-10,
// supplied-path-layout-spec.md R-FOUND-6).
const LocalFolderStamp = {
  specId: LocalFolder,
  version: LocalFolderImportSourceSpecVersion,
};
const PhotoPathLayoutStamp = {
  specId: "photo-path-layout",
  version: PhotoPathLayoutSpecVersion,
};
const SuppliedPathLayoutStamp = {
  specId: "supplied-path-layout",
  version: SuppliedPathLayoutSpecVersion,
};
type LayoutStamp = typeof SuppliedPathLayoutStamp;

// What a command line gives import.
export type ImportArgs = {
  // Imported directory (local-folder-import-source-spec.md R-LOCALFOLDER-2)
  importDirectory: string;
  // TC Directory of whichever TC Copy to import into (R-SRC-25)
  tcDirectory: string;
  // --dry-run: say what a real import would do, and change nothing (R-SRC-14)
  dryRun: boolean;
};

// What one import does, and which file it does it with.
type ImportContext = {
  tcDirectory: string;
  tcCopyName: string;
  runId: string;
  dryRun: boolean;
  // What this import has written so far, and how many files it left out
  files: number;
  bytes: number;
  leftOut: number;
  // Where each directory of this TC Copy that this import has placed goes,
  // under its path's key (turbo-collection-spec.md R-TGT-14)
  placed: Map<string, string>;
  // Names each directory of this TC Copy holds, under each one's key, as read
  // once and added to as this import writes
  held: Map<string, Map<string, string[]>>;
};

// Imports `importDirectory`'s files into whichever TC Copy is in
// `tcDirectory` (R-SRC-25). `runId` names every receipt file this import
// writes (meta-file-spec.md R-MFILE-13).
//
// Both paths given, that TC Copy's configuration, its collection's lock and
// every entry of `importDirectory` are checked before a file is written. Then
// each directory of that TC Copy is filled in turn, and what stops a run in
// one, such as a manifest that does not parse, stops it there. A file left
// out is an error once this import has done all else, so its run exits with
// a non-zero status (R-SRC-23, R-SRC-24, R-SRC-26).
export async function importIntoTcCopy(
  { importDirectory, tcDirectory: givenTcDirectory, dryRun }: ImportArgs,
  runId: string,
): Promise<void> {
  const importedDirectory = path.resolve(importDirectory);
  const tcDirectory = path.resolve(givenTcDirectory);
  ensureNoLinkInPath(tcDirectory);
  ensureNoLinkInPath(importedDirectory);
  ensureTcDirectory(tcDirectory);
  ensureImportable(importedDirectory);

  const configurationFile = configurationFileOf(tcDirectory);
  const tcConfig = readConfigurationFile(tcDirectory);
  logger.log({
    event: "configuration",
    verbose: true,
    path: configurationFile,
    configuration: tcConfig,
    toString: () => `Read ${configurationFile}: ${JSON.stringify(tcConfig)}`,
  });

  await using _collectionLock = await takeCollectionLock(tcConfig);

  // A TC Copy's ignore file decides by a file's path in that TC Copy
  // (R-LOCALFOLDER-3).
  const isIgnored = readIgnoreFileOf(tcDirectory);
  const listing = listLocalFolder(importedDirectory, (suppliedPath) =>
    isIgnored(collectionPathOf(suppliedPath)),
  );
  for (const passedOver of listing.passedOver) {
    logger.log({
      event: "passed-over",
      verbose: true,
      path: passedOver,
      toString: () => `Passed over ${passedOver}`,
    });
  }
  ensureRegularFilesOnly(importedDirectory, listing.notRegular);
  const { layout, placed } = placeItems(listing.items, isIgnored);

  const context: ImportContext = {
    tcDirectory,
    tcCopyName: tcConfig.tcCopyName,
    runId,
    dryRun,
    files: 0,
    bytes: 0,
    leftOut: 0,
    placed: new Map(),
    held: new Map(),
  };
  for (const [directory, group] of byDirectory(placed)) {
    importIntoDirectory(context, directory, group.layout, group.items);
  }

  logger.log({
    event: "import",
    importSource: LocalFolder,
    layout: layout.specId,
    from: importedDirectory,
    to: tcDirectory,
    files: context.files,
    bytes: context.bytes,
    leftOut: context.leftOut,
    toString: () =>
      `${dryRun ? "Would import" : "Imported"} ${countOfFiles(context.files)} (${context.bytes} bytes) from ${importedDirectory} into ${tcDirectory}, under ${layout.specId.replace(/-layout$/, " layout")}`,
  });
  if (context.leftOut > 0) {
    throw new TcError(
      `${countOfFiles(context.leftOut)} left out of the collection, named above. Every other file ${dryRun ? "would be" : "was"} imported.`,
    );
  }
}

// "1 file", or "2 files".
function countOfFiles(count: number): string {
  return count === 1 ? "1 file" : `${count} files`;
}

// Throws where `tcDirectory` is not a TC Directory
// (turbo-collection-core-spec.md R-CLI-14), or lies inside one (R-CLI-18).
function ensureTcDirectory(tcDirectory: string): void {
  if (!isTcDirectory(tcDirectory)) {
    throw new TcError(
      `"${tcDirectory}" is not a TC Directory, so nothing is imported into it. Give a TC Directory to import into.`,
    );
  }
  ensureNotInsideTcCopy(tcDirectory);
}

// Throws where `directory` cannot be an Imported directory: one that is not a
// directory, has no name of its own, is a TC Directory or lies inside a TC Copy
// (local-folder-import-source-spec.md R-LOCALFOLDER-2). One that holds a TC
// Copy is found as it is looked through.
function ensureImportable(directory: string): void {
  const stats = statSync(directory, { throwIfNoEntry: false });
  if (stats === undefined || !stats.isDirectory()) {
    throw new TcError(
      `"${directory}" is not a directory, so nothing is imported from it.`,
    );
  }
  if (path.basename(directory) === "") {
    throw new TcError(
      `"${directory}" has no name of its own, such as the root of a drive, and an import keeps every file under the name of its directory. Give a directory inside it.`,
    );
  }
  const tcDirectory = tcDirectoryAtOrAbove(directory);
  if (tcDirectory === directory) {
    throw new TcError(
      `"${directory}" is a TC Directory, and a TC Copy is not imported. A backup brings two TC Copies into agreement.`,
    );
  }
  if (tcDirectory !== undefined) {
    throw new TcError(
      `"${directory}" lies inside a TC Copy at "${tcDirectory}", and nothing inside a TC Copy is imported.`,
    );
  }
}

// Throws where `importedDirectory` holds entries that are neither a regular
// file nor a directory, after logging each, so that its import adds nothing
// (import-spec.md R-SRC-22).
function ensureRegularFilesOnly(
  importedDirectory: string,
  notRegular: readonly string[],
): void {
  for (const entry of notRegular) {
    const message = `"${entry}" is neither a file nor a directory, such as a link, which Turbo-Collection does not follow.`;
    logger.log({
      event: "error",
      outcome: "failure",
      message,
      path: entry,
      toString: () => message,
    });
  }
  if (notRegular.length > 0) {
    throw new TcError(
      `The import of "${importedDirectory}" imports nothing, since it holds entries that are neither a file nor a directory, each named above. A pattern in the TC Copy's .tcignore passes over such an entry.`,
    );
  }
}

// A test of whether `tcDirectory`'s ignore file ignores a path, which ignores
// nothing where that TC Copy has no ignore file
// (meta-file-spec.md R-MFILE-20, R-MFILE-21).
function readIgnoreFileOf(tcDirectory: string): IsIgnored {
  const file = path.join(tcDirectory, ".tcignore");
  const text =
    lstatSync(file, { throwIfNoEntry: false }) === undefined
      ? ""
      : readFileSync(file, "utf8");
  return compileIgnorePatterns(readIgnorePatterns(text));
}

// Where in a TC Copy a file whose Supplied path is `suppliedPath` goes:
// `local-folder/<supplied path>` (supplied-path-layout-spec.md R-FOUND-3).
function collectionPathOf(suppliedPath: string): string {
  return `${LocalFolder}/${suppliedPath}`;
}

// Whether `suppliedPath` is one supplied-path layout places: relative,
// not empty, and with no segment that is `.` or `..` (R-FOUND-4).
function isPlaceable(suppliedPath: string): boolean {
  return (
    suppliedPath !== "" &&
    !path.isAbsolute(suppliedPath) &&
    suppliedPath
      .split("/")
      .every((segment) => segment !== "" && segment !== "." && segment !== "..")
  );
}

// Last segment of `suppliedPath`, its Supplied filename.
function nameOf(suppliedPath: string): string {
  return suppliedPath.slice(suppliedPath.lastIndexOf("/") + 1);
}

// An Item, and where it goes: a directory of a TC Copy, relative to its TC
// Directory with `/` between segments, and whichever layout places it there.
type PlacedItem = { item: Item; directory: string; layout: LayoutStamp };

// Where each of `items` goes: under photo-path layout where it places at least
// one of them, and under supplied-path layout otherwise
// (local-folder-import-source-spec.md R-LOCALFOLDER-5). An Item is one file,
// its own primary file (photo-path-layout-spec.md R-PHOTO-2).
//
// Under photo-path layout, each file it does not place keeps its Supplied path
// and is logged (import-spec.md R-SRC-20), each photo whose date is uncertain
// is logged (R-PHOTO-8), and a photo whose place by date `isIgnored` ignores
// is passed over (R-LOCALFOLDER-3).
function placeItems(
  items: readonly Item[],
  isIgnored: IsIgnored,
): { layout: LayoutStamp; placed: PlacedItem[] } {
  const atItsPath = (item: Item): PlacedItem => ({
    item,
    directory: collectionPathOf(
      item.suppliedPath.slice(0, item.suppliedPath.lastIndexOf("/")),
    ),
    layout: SuppliedPathLayoutStamp,
  });
  const places = new Map<Item, PhotoPlace | undefined>(
    items.map((item) => [
      item,
      photoPlaceOf(item.readPath, nameOf(item.suppliedPath), LocalFolder),
    ]),
  );
  const isPassedOver = (item: Item, place: PhotoPlace): boolean =>
    isIgnored(`${place.directory}/${nameOf(item.suppliedPath)}`);
  if (
    !items.some((item) => {
      const place = places.get(item);
      return place !== undefined && !isPassedOver(item, place);
    })
  ) {
    return { layout: SuppliedPathLayoutStamp, placed: items.map(atItsPath) };
  }

  const placed: PlacedItem[] = [];
  for (const item of items) {
    const place = places.get(item);
    if (place === undefined) {
      logger.log({
        event: "floored",
        verbose: true,
        path: item.readPath,
        toString: () =>
          `Kept ${item.readPath} at its Supplied path, since photo-path layout does not place it`,
      });
      placed.push(atItsPath(item));
    } else if (!isPassedOver(item, place)) {
      if (isUncertain(place)) {
        logger.log({
          event: "uncertain-date",
          verbose: true,
          path: item.readPath,
          governingTimestamp: place.governingTimestamp,
          readFrom: place.readFrom,
          toString: () =>
            `Dated ${item.readPath} ${place.governingTimestamp} from its ${place.readFrom}, which is uncertain`,
        });
      }
      placed.push({
        item,
        directory: place.directory,
        layout: PhotoPathLayoutStamp,
      });
    }
  }
  return { layout: PhotoPathLayoutStamp, placed };
}

// `placed` grouped by directory, so that each directory of a TC Copy is filled
// once, whichever spelling of its path an item gives (turbo-collection-spec.md
// R-TGT-14). Each group is under its first item's spelling, with its
// directory's layout. Items are taken in manifest order of their Supplied
// paths (meta-file-spec.md R-MFILE-12), which no operating system decides, so
// that of two spellings of one path, or of two files given one name, one and
// the same arrives first on every computer.
function byDirectory(
  placed: readonly PlacedItem[],
): Map<string, { layout: LayoutStamp; items: Item[] }> {
  const groups = new Map<string, { layout: LayoutStamp; items: Item[] }>();
  const spellings = new Map<string, string>();
  const sorted = [...placed].sort((a, b) =>
    compareManifestNames(a.item.suppliedPath, b.item.suppliedPath),
  );
  for (const { item, directory, layout } of sorted) {
    const key = pathKeyOf(directory);
    const spelling = spellings.get(key) ?? directory;
    spellings.set(key, spelling);
    const group = groups.get(spelling) ?? { layout, items: [] };
    group.items.push(item);
    groups.set(spelling, group);
  }
  return groups;
}

// Where a directory goes in a TC Copy, as `placeDirectory` finds it: at
// `directory`, which exists or is to be made; nowhere, since a file stands at
// `blockedBy`, where it or a directory above it is to go; or nowhere, since
// that TC Copy holds its path in each spelling `heldAs` names (R-TGT-14).
type Placement =
  { directory: string } | { blockedBy: string } | { heldAs: string[] };

// Places a directory whose path in this TC Copy is `relativePath`, its segments
// joined by `/`: each segment at whichever spelling of it this TC Copy already
// holds, and at its own where this TC Copy holds that one or none
// (turbo-collection-spec.md R-TGT-14). Each place given is kept, so that two
// spellings of one path go to one place, made yet or not.
//
// Throws where a directory on its way is a link or another entry that is
// neither a directory nor a file (turbo-collection-core-spec.md R-CLI-19), or
// is another TC Directory (R-CLI-18).
function placeDirectory(
  context: ImportContext,
  relativePath: string,
): Placement {
  const key = pathKeyOf(relativePath);
  const placed = context.placed.get(key);
  if (placed !== undefined) {
    return { directory: placed };
  }
  const slash = relativePath.lastIndexOf("/");
  const parent =
    slash === -1
      ? { directory: context.tcDirectory }
      : placeDirectory(context, relativePath.slice(0, slash));
  if (!("directory" in parent)) {
    return parent;
  }
  const spelling = spellingIn(
    context,
    parent.directory,
    relativePath.slice(slash + 1),
  );
  if (typeof spelling !== "string") {
    return {
      heldAs: spelling.map((name) => path.join(parent.directory, name)),
    };
  }
  const directory = path.join(parent.directory, spelling);
  const stats = lstatSync(directory, { throwIfNoEntry: false });
  if (stats?.isFile()) {
    return { blockedBy: directory };
  }
  if (stats !== undefined && !stats.isDirectory()) {
    throw new TcError(
      `"${directory}" in the TC Copy is neither a file nor a directory, such as a link, which Turbo-Collection does not follow.`,
    );
  }
  if (stats !== undefined && isTcDirectory(directory)) {
    throw new TcError(
      `"${directory}" is a TC Directory inside the TC Copy at "${context.tcDirectory}", and a TC Copy never lies inside another.`,
    );
  }
  context.placed.set(key, directory);
  return { directory };
}

// Names `directory` holds, under each one's key (R-TGT-14), read when this
// import first looks into it. A directory that does not exist holds none.
function heldIn(
  context: ImportContext,
  directory: string,
): Map<string, string[]> {
  let held = context.held.get(directory);
  if (held === undefined) {
    held = new Map();
    const names = lstatSync(directory, { throwIfNoEntry: false })?.isDirectory()
      ? readdirSync(directory)
      : [];
    for (const name of names) {
      const key = pathKeyOf(name);
      held.set(key, [...(held.get(key) ?? []), name]);
    }
    context.held.set(directory, held);
  }
  return held;
}

// Records that `directory` holds `name`, which this import has written there.
function holdName(
  context: ImportContext,
  directory: string,
  name: string,
): void {
  const held = heldIn(context, directory);
  const key = pathKeyOf(name);
  const spellings = held.get(key) ?? [];
  if (!spellings.includes(name)) {
    held.set(key, [...spellings, name]);
  }
}

// `name`'s spelling in `directory` (R-TGT-14): `name` itself where
// `directory` holds that spelling or none, whichever one it holds where it
// holds one, and every one where it holds several and none is `name`.
function spellingIn(
  context: ImportContext,
  directory: string,
  name: string,
): string | string[] {
  const held = heldIn(context, directory).get(pathKeyOf(name)) ?? [];
  if (held.length === 0 || held.includes(name)) {
    return name;
  }
  return held.length === 1 ? held[0]! : held;
}

// `names`, each in quotes, joined by "and".
function quoted(names: readonly string[]): string {
  return names.map((name) => `"${name}"`).join(" and ");
}

// Imports `items` under `layout` into a directory of a TC Copy whose path is
// `relativeDirectory`, relative to its TC Directory. A file is written where
// that directory's manifest does not list it, and listed once it is
// completely written (turbo-collection-spec.md R-TGT-13). Then that directory
// gets its arrival file (verify-spec.md R-REC-5), and an error file where a
// file was left out (meta-file-spec.md R-MFILE-13, R-MFILE-16).
function importIntoDirectory(
  context: ImportContext,
  relativeDirectory: string,
  layout: LayoutStamp,
  items: readonly Item[],
): void {
  const errors: string[] = [];

  // Logs a file as left out of its collection, and keeps its message for that
  // directory's error file.
  const leaveOut = (item: Item, reason: string): void => {
    const message = `"${item.readPath}" is left out: ${reason}`;
    logger.log({
      event: "error",
      outcome: "failure",
      message,
      path: item.readPath,
      toString: () => message,
    });
    errors.push(message);
    context.leftOut++;
  };

  // A directory with no place leaves every file for it out, with no error
  // file, which would need that directory (R-SRC-26, R-TGT-14).
  const placement = placeDirectory(context, relativeDirectory);
  if (!("directory" in placement)) {
    const reason =
      "blockedBy" in placement
        ? `"${placement.blockedBy}" in the TC Copy is a file, where a directory is to go.`
        : `the TC Copy holds its directory as ${quoted(placement.heldAs)}, which are one path.`;
    for (const item of items) {
      leaveOut(item, reason);
    }
    return;
  }
  const { directory } = placement;

  const manifest = readManifest(directory);

  // A directory has one provenance (R-SRC-24).
  if (
    manifest !== undefined &&
    (manifest.importSource.specId !== LocalFolderStamp.specId ||
      manifest.layout.specId !== layout.specId)
  ) {
    for (const item of items) {
      leaveOut(
        item,
        `"${directory}" holds content that ${manifest.importSource.specId} placed under ${manifest.layout.specId}, and a directory holds content of one import source and one layout.`,
      );
    }
    recordErrors(context, directory, errors);
    return;
  }

  // A directory filled under another MAJOR line of its import source's
  // specification is not reused (R-SRC-16).
  const majorOf = (version: string) => version.split(".")[0];
  if (
    manifest !== undefined &&
    majorOf(manifest.importSource.version) !== majorOf(LocalFolderStamp.version)
  ) {
    throw new TcError(
      `"${directory}" was filled under local-folder-import-source-spec ${manifest.importSource.version}, which this Turbo-Collection does not import into.`,
    );
  }

  // Every entry under its name, and under its name's key (R-TGT-14).
  const entries = new Map<string, ManifestEntry>();
  const listed = new Map<string, ManifestEntry[]>();
  const list = (entry: ManifestEntry): void => {
    entries.set(entry.file, entry);
    const key = pathKeyOf(entry.file);
    listed.set(key, [...(listed.get(key) ?? []), entry]);
  };
  for (const entry of manifest?.files ?? []) {
    list(entry);
  }
  const wouldWrite = new Map<string, Arrival>();
  let wrote = false;
  for (const item of items) {
    const entry = importFile(
      context,
      directory,
      item,
      listed,
      wouldWrite,
      leaveOut,
    );
    if (entry !== undefined) {
      list(entry);
      wrote = true;
    }
  }

  if (!context.dryRun && wrote) {
    const files = [...entries.values()];
    writeManifest(directory, {
      ...manifest,
      version: MetaFileSpecVersion,
      layout: { ...manifest?.layout, ...layout },
      importSource: { ...manifest?.importSource, ...LocalFolderStamp },
      checksumAlgorithm: "SHA-256",
      files,
    });
    writeReceiptFile(directory, "arrival", context.runId, context.tcCopyName, {
      date: dateToString(new Date()),
      fileCount: files.length,
      contentDigest: contentDigestOf(files.map((file) => file.checksum)),
      layout,
      importSource: LocalFolderStamp,
    });
  }
  recordErrors(context, directory, errors);
}

// Writes `directory`'s error file where this import left out a file that was
// to go there, making `directory` where needed (R-SRC-26). A dry run writes
// nothing.
function recordErrors(
  context: ImportContext,
  directory: string,
  errors: readonly string[],
): void {
  if (context.dryRun || errors.length === 0) {
    return;
  }
  writeReceiptFile(directory, "error", context.runId, context.tcCopyName, {
    importErrors: errors.map((message) => ({ message })),
  });
}

// A file a dry run would write: where it is read from, and where it would go.
type Arrival = { readPath: string; target: string };

// Imports `item` into `directory`, whose manifest's entries are `listed`,
// each under its name's key, and returns an entry to list it with, or
// undefined where it wrote nothing. A file listed under any spelling of its
// name is that file (turbo-collection-spec.md R-TGT-14): with identical
// content it is in its collection already (R-SRC-8), and with other content
// it is left out (R-SRC-23). A dry run lists nothing, so it keeps each file
// it would write in `wouldWrite`, and compares a later spelling of that name
// with it, as a real import would. A file that cannot be read or written is
// left out, and one that a TC Copy cannot take at all, such as on a full drive,
// ends its run (R-SRC-26).
function importFile(
  context: ImportContext,
  directory: string,
  item: Item,
  listed: ReadonlyMap<string, readonly ManifestEntry[]>,
  wouldWrite: Map<string, Arrival>,
  leaveOut: (item: Item, reason: string) => void,
): ManifestEntry | undefined {
  if (!isPlaceable(item.suppliedPath)) {
    leaveOut(
      item,
      `its Supplied path "${item.suppliedPath}" is not a relative path the supplied-path layout places.`,
    );
    return undefined;
  }
  const suppliedName = nameOf(item.suppliedPath);
  const key = pathKeyOf(suppliedName);

  // A directory's meta files are where a file of this name would go
  // (meta-file-spec.md R-MFILE-2), so it cannot be written (R-SRC-26).
  const metaDirectory = metaDirectoryOf(directory);
  if (key === pathKeyOf(path.basename(metaDirectory))) {
    leaveOut(
      item,
      `"${metaDirectory}" holds that directory's meta files, so no file is written there.`,
    );
    return undefined;
  }

  const listedAs = listed.get(key) ?? [];
  const entry =
    listedAs.find((listedEntry) => listedEntry.file === suppliedName) ??
    (listedAs.length === 1 ? listedAs[0] : undefined);
  if (entry === undefined && listedAs.length > 1) {
    leaveOut(
      item,
      `"${directory}" lists it as ${quoted(listedAs.map((listedEntry) => listedEntry.file))}, which are one name.`,
    );
    return undefined;
  }
  const name = entry?.file ?? spellingIn(context, directory, suppliedName);
  if (typeof name !== "string") {
    leaveOut(
      item,
      `"${directory}" holds it as ${quoted(name)}, which are one name.`,
    );
    return undefined;
  }
  const target = path.join(directory, name);

  const targetStats = lstatSync(target, { throwIfNoEntry: false });
  if (
    targetStats !== undefined &&
    !targetStats.isFile() &&
    !targetStats.isDirectory()
  ) {
    throw new TcError(
      `"${target}" in the TC Copy is neither a file nor a directory, such as a link, which Turbo-Collection does not follow.`,
    );
  }

  let size: number;
  try {
    size = statSync(item.readPath).size;
  } catch (e) {
    leaveOut(item, `it cannot be read (${(e as Error).message}).`);
    return undefined;
  }

  if (entry !== undefined) {
    let checksum: string | undefined;
    try {
      checksum = entry.size === size ? checksumOf(item.readPath) : undefined;
    } catch (e) {
      leaveOut(item, `it cannot be read (${(e as Error).message}).`);
      return undefined;
    }
    if (checksum !== entry.checksum) {
      leaveOut(
        item,
        `"${target}" in the collection holds other content, and an import never writes over it.`,
      );
    }
    return undefined;
  }

  const earlier = wouldWrite.get(key);
  if (earlier !== undefined) {
    let same: boolean;
    try {
      same = checksumOf(earlier.readPath) === checksumOf(item.readPath);
    } catch (e) {
      leaveOut(item, `it cannot be read (${(e as Error).message}).`);
      return undefined;
    }
    if (!same) {
      leaveOut(
        item,
        `"${earlier.target}" in the collection holds other content, and an import never writes over it.`,
      );
    }
    return undefined;
  }

  if (targetStats?.isDirectory()) {
    leaveOut(item, `"${target}" in the TC Copy is a directory.`);
    return undefined;
  }

  if (context.dryRun) {
    logTransfer(context, item.readPath, target, size);
    wouldWrite.set(key, { readPath: item.readPath, target });
    return undefined;
  }

  let written: { size: number; checksum: string } | undefined;
  try {
    mkdirSync(directory, { recursive: true });
    written = copyAndChecksum(item.readPath, target);
  } catch (e) {
    if (isTcCopyUnwritable(e, context.tcDirectory)) {
      throw new TcError(
        `The TC Copy at "${context.tcDirectory}" cannot be written: it is gone, read-only or full. Files written before this are in the collection.`,
        { cause: e },
      );
    }
    leaveOut(
      item,
      `it could not be copied to "${target}" (${(e as Error).message}).`,
    );
    return undefined;
  }
  holdName(context, directory, name);
  if (written === undefined) {
    leaveOut(item, "it changed while it was read.");
    return undefined;
  }

  logTransfer(context, item.readPath, target, written.size);
  return { file: name, size: written.size, checksum: written.checksum };
}

// Logs a file an import writes, or a dry run would write (R-LOG-15).
function logTransfer(
  context: ImportContext,
  from: string,
  to: string,
  size: number,
): void {
  context.files++;
  context.bytes += size;
  logger.log({
    event: "transfer",
    verbose: true,
    from,
    to,
    size,
    toString: () =>
      `${context.dryRun ? "Would copy" : "Copied"} ${from} to ${to}`,
  });
}

// Whether `error` says that the TC Copy in `tcDirectory` cannot be written:
// its drive gone, read-only or full (R-SRC-26).
function isTcCopyUnwritable(error: unknown, tcDirectory: string): boolean {
  const code = (error as NodeJS.ErrnoException).code;
  if (code === "ENOSPC" || code === "EROFS") {
    return true;
  }
  try {
    return statSync(tcDirectory, { throwIfNoEntry: false }) === undefined;
  } catch {
    return true;
  }
}

// How much of a file is read and written at a time.
const ChunkSize = 1024 * 1024;

// `file`'s SHA-256 checksum, in lower-case hexadecimal.
function checksumOf(file: string): string {
  const hash = createHash("sha256");
  const descriptor = openSync(file, "r");
  try {
    const buffer = Buffer.alloc(ChunkSize);
    let bytesRead: number;
    while ((bytesRead = readSync(descriptor, buffer)) > 0) {
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    closeSync(descriptor);
  }
  return hash.digest("hex");
}

// Copies a file at `from` to `to`, writing over a file there, and returns a
// length and a checksum of what it wrote, once that is on its drive. Returns
// undefined where `from` changed in size or modification time while it was
// read (R-SRC-26); what was written stays, a file no manifest lists
// (turbo-collection-spec.md R-TGT-13).
function copyAndChecksum(
  from: string,
  to: string,
): { size: number; checksum: string } | undefined {
  const before = statSync(from);
  const hash = createHash("sha256");
  let size = 0;
  const input = openSync(from, "r");
  try {
    const output = openSync(to, "w");
    try {
      const buffer = Buffer.alloc(ChunkSize);
      let bytesRead: number;
      while ((bytesRead = readSync(input, buffer)) > 0) {
        hash.update(buffer.subarray(0, bytesRead));
        // A write may take fewer bytes than it is given.
        let offset = 0;
        while (offset < bytesRead) {
          offset += writeSync(output, buffer, offset, bytesRead - offset);
        }
        size += bytesRead;
      }
      fsyncSync(output);
    } finally {
      closeSync(output);
    }
  } finally {
    closeSync(input);
  }
  const after = statSync(from);
  if (
    after.size !== before.size ||
    after.mtimeMs !== before.mtimeMs ||
    size !== before.size
  ) {
    return undefined;
  }
  return { size, checksum: hash.digest("hex") };
}
