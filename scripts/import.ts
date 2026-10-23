import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  closeSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
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
  contentDigestOf,
  readConfigurationFile,
  readManifest,
  writeManifest,
  writeReceiptFile,
  type ManifestEntry,
} from "./meta-files.ts";
import {
  configurationFileOf,
  copyRootAtOrAbove,
  ensureNoLinkInPath,
  ensureNotInsideCopy,
} from "./paths.ts";
import {
  compileIgnorePatterns,
  readIgnorePatterns,
  type IsIgnored,
} from "./tcignore.ts";
import {
  LocalFolderImportSourceSpecVersion,
  MetaFileSpecVersion,
  SuppliedPathLayoutSpecVersion,
} from "./versions.ts";

// The import operation (import-spec.md), from the Local-folder Import Source,
// under the supplied-path layout.

// The identifier of the Local-folder Import Source
// (local-folder-import-source-spec.md R-LOCALFOLDER-1).
const LocalFolder = "local-folder";

// What an import records of the import source and the layout that placed a
// directory's content (meta-file-spec.md R-MFILE-9, R-MFILE-15).
const LocalFolderStamp = {
  specId: LocalFolder,
  version: LocalFolderImportSourceSpecVersion,
};
const SuppliedPathLayoutStamp = {
  specId: "supplied-path-layout",
  version: SuppliedPathLayoutSpecVersion,
};

// What the command line gives import.
export type ImportArgs = {
  // The Imported directory (local-folder-import-source-spec.md R-LOCALFOLDER-2)
  directory: string;
  // The Copy to import into: the current directory where the command line
  // names none (R-SRC-25)
  copy: string;
  // --dry-run: say what a real import would do, and change nothing (R-SRC-14)
  dryRun: boolean;
};

// What one import does, and the file it does it with.
type ImportContext = {
  copyRoot: string;
  copyName: string;
  runId: string;
  dryRun: boolean;
  // What the import has written so far, and how many files it left out
  files: number;
  bytes: number;
  leftOut: number;
  // The directories of the copy already checked for a link or a copy
  checkedDirectories: Set<string>;
};

// Imports the files of `directory` into the copy `copy` (R-SRC-25). `runId`
// names the receipt files the import writes (meta-file-spec.md R-MFILE-13).
//
// The paths given, the copy's configuration, the collection's lock and every
// entry of the Imported directory are checked before a file is written. Then
// each directory of the copy is filled in turn, and what stops a run in one,
// such as a manifest that does not parse, stops it there. A file left out is
// an error once the import has done all else, so the run exits with a
// non-zero status (R-SRC-23, R-SRC-24, R-SRC-26).
export async function importIntoCopy(
  { directory, copy, dryRun }: ImportArgs,
  runId: string,
): Promise<void> {
  const importedDirectory = path.resolve(directory);
  const copyRoot = path.resolve(copy);
  ensureNoLinkInPath(copyRoot);
  ensureNoLinkInPath(importedDirectory);
  ensureCopy(copyRoot);
  ensureImportable(importedDirectory);

  const configurationFile = configurationFileOf(copyRoot);
  const tcConfig = readConfigurationFile(copyRoot);
  logger.log({
    event: "configuration",
    verbose: true,
    path: configurationFile,
    configuration: tcConfig,
    toString: () => `Read ${configurationFile}: ${JSON.stringify(tcConfig)}`,
  });

  await using _collectionLock = await takeCollectionLock(tcConfig);

  // The copy's ignore file decides by a file's path in the copy
  // (R-LOCALFOLDER-3).
  const isIgnored = readIgnoreFileOf(copyRoot);
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

  const context: ImportContext = {
    copyRoot,
    copyName: tcConfig.copyName,
    runId,
    dryRun,
    files: 0,
    bytes: 0,
    leftOut: 0,
    checkedDirectories: new Set(),
  };
  for (const [suppliedDirectory, items] of byDirectory(listing.items)) {
    importIntoDirectory(context, suppliedDirectory, items);
  }

  logger.log({
    event: "import",
    importSource: LocalFolder,
    from: importedDirectory,
    to: copyRoot,
    files: context.files,
    bytes: context.bytes,
    leftOut: context.leftOut,
    toString: () =>
      `${dryRun ? "Would import" : "Imported"} ${countOfFiles(context.files)} (${context.bytes} bytes) from ${importedDirectory} into ${copyRoot}`,
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

// Throws where `copyRoot` is not a copy (turbo-collection-core-spec.md
// R-CLI-14), or lies inside one (R-CLI-18).
function ensureCopy(copyRoot: string): void {
  if (
    lstatSync(configurationFileOf(copyRoot), { throwIfNoEntry: false }) ===
    undefined
  ) {
    throw new TcError(
      `"${copyRoot}" is not a copy, so nothing is imported into it. Give a copy, or run import in one.`,
    );
  }
  ensureNotInsideCopy(copyRoot);
}

// Throws where `directory` cannot be an Imported directory: one that is not a
// directory, has no name of its own, is a copy or lies inside one
// (local-folder-import-source-spec.md R-LOCALFOLDER-2). One that holds a copy
// is found as it is looked through.
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
  const copyRoot = copyRootAtOrAbove(directory);
  if (copyRoot === directory) {
    throw new TcError(
      `"${directory}" is a copy, and a copy is not imported. A backup brings two copies into agreement.`,
    );
  }
  if (copyRoot !== undefined) {
    throw new TcError(
      `"${directory}" lies inside a copy at "${copyRoot}", and nothing inside a copy is imported.`,
    );
  }
}

// Throws where the Imported directory holds entries that are neither a
// regular file nor a directory, after logging each, so that the import adds
// nothing (import-spec.md R-SRC-22).
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
      `The import of "${importedDirectory}" imports nothing, since it holds entries that are neither a file nor a directory, each named above. A pattern in the copy's .tcignore passes over such an entry.`,
    );
  }
}

// The test of whether the ignore file of the copy at `copyRoot` ignores a
// path, which ignores nothing where the copy has no ignore file
// (meta-file-spec.md R-MFILE-20, R-MFILE-21).
function readIgnoreFileOf(copyRoot: string): IsIgnored {
  const file = path.join(copyRoot, ".tcignore");
  const text =
    lstatSync(file, { throwIfNoEntry: false }) === undefined
      ? ""
      : readFileSync(file, "utf8");
  return compileIgnorePatterns(readIgnorePatterns(text));
}

// The path in the copy of a file whose Supplied path is `suppliedPath`:
// `local-folder/<supplied path>` (supplied-path-layout-spec.md R-FOUND-3).
function collectionPathOf(suppliedPath: string): string {
  return `${LocalFolder}/${suppliedPath}`;
}

// Whether `suppliedPath` is one the supplied-path layout places: relative,
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

// `items` grouped by the Supplied path of the directory each is in, so that
// each directory of the copy is filled once.
function byDirectory(items: readonly Item[]): Map<string, Item[]> {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const suppliedDirectory = item.suppliedPath.slice(
      0,
      item.suppliedPath.lastIndexOf("/"),
    );
    const group = groups.get(suppliedDirectory) ?? [];
    group.push(item);
    groups.set(suppliedDirectory, group);
  }
  return groups;
}

// Looks at each directory of the copy on the way from its root to the
// directory `segments` name, as far as the way exists. Throws where one is a
// link or another entry that is neither a directory nor a file
// (turbo-collection-core-spec.md R-CLI-19), or is the root of another copy
// (R-CLI-18). Returns the path of a file that stands where a directory is to
// go, or undefined where none does.
function blockingFileOnTheWay(
  context: ImportContext,
  segments: readonly string[],
): string | undefined {
  let current = context.copyRoot;
  for (const segment of segments) {
    current = path.join(current, segment);
    if (context.checkedDirectories.has(current)) {
      continue;
    }
    const stats = lstatSync(current, { throwIfNoEntry: false });
    if (stats === undefined) {
      return undefined;
    }
    if (stats.isFile()) {
      return current;
    }
    if (!stats.isDirectory()) {
      throw new TcError(
        `"${current}" in the copy is neither a file nor a directory, such as a link, which Turbo-Collection does not follow.`,
      );
    }
    if (
      lstatSync(configurationFileOf(current), { throwIfNoEntry: false }) !==
      undefined
    ) {
      throw new TcError(
        `"${current}" is a copy inside the copy at "${context.copyRoot}", and a copy never lies inside another.`,
      );
    }
    context.checkedDirectories.add(current);
  }
  return undefined;
}

// Imports `items`, each in the directory whose Supplied path is
// `suppliedDirectory`, into that directory of the copy. A file is written
// where the directory's manifest does not list it, and listed once it is
// completely written (turbo-collection-spec.md R-TGT-13). Then the directory
// gets its arrival file (verify-spec.md R-REC-5), and an error file where a
// file was left out (meta-file-spec.md R-MFILE-13, R-MFILE-16).
function importIntoDirectory(
  context: ImportContext,
  suppliedDirectory: string,
  items: readonly Item[],
): void {
  const segments = collectionPathOf(suppliedDirectory).split("/");
  const directory = path.join(context.copyRoot, ...segments);
  const errors: string[] = [];

  // Logs a file as left out of the collection, and keeps its message for the
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

  // A file where the directory is to go leaves every file out, with no
  // error file, which would need that directory (R-SRC-26).
  const blockingFile = blockingFileOnTheWay(context, segments);
  if (blockingFile !== undefined) {
    for (const item of items) {
      leaveOut(
        item,
        `"${blockingFile}" in the copy is a file, where a directory is to go.`,
      );
    }
    return;
  }

  const manifest = readManifest(directory);

  // A directory has one provenance (R-SRC-24).
  if (
    manifest !== undefined &&
    (manifest.importSource.specId !== LocalFolderStamp.specId ||
      manifest.layout.specId !== SuppliedPathLayoutStamp.specId)
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

  // A directory filled under another MAJOR line of the import source's
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

  const entries = new Map<string, ManifestEntry>(
    (manifest?.files ?? []).map((entry) => [entry.file, entry]),
  );
  let wrote = false;
  for (const item of items) {
    const entry = importFile(context, directory, item, entries, leaveOut);
    if (entry !== undefined) {
      entries.set(entry.file, entry);
      wrote = true;
    }
  }

  if (!context.dryRun && wrote) {
    const files = [...entries.values()];
    writeManifest(directory, {
      ...manifest,
      version: MetaFileSpecVersion,
      layout: { ...manifest?.layout, ...SuppliedPathLayoutStamp },
      importSource: { ...manifest?.importSource, ...LocalFolderStamp },
      checksumAlgorithm: "SHA-256",
      files,
    });
    writeReceiptFile(directory, "arrival", context.runId, context.copyName, {
      date: dateToString(new Date()),
      fileCount: files.length,
      contentDigest: contentDigestOf(files.map((file) => file.checksum)),
      layout: SuppliedPathLayoutStamp,
      importSource: LocalFolderStamp,
    });
  }
  recordErrors(context, directory, errors);
}

// Writes the error file of `directory` where this import left a file out
// that was to go there, making the directory where needed (R-SRC-26). A dry
// run writes nothing.
function recordErrors(
  context: ImportContext,
  directory: string,
  errors: readonly string[],
): void {
  if (context.dryRun || errors.length === 0) {
    return;
  }
  writeReceiptFile(directory, "error", context.runId, context.copyName, {
    importErrors: errors.map((message) => ({ message })),
  });
}

// Imports one file into `directory`, whose manifest's entries are `entries`,
// and returns the entry it is to be listed with, or undefined where it wrote
// nothing. A file already listed with the same content is in the collection
// already (R-SRC-8); listed with other content, it is left out (R-SRC-23).
// A file that cannot be read or written is left out, and one that the copy
// cannot take at all, such as a full drive, ends the run (R-SRC-26).
function importFile(
  context: ImportContext,
  directory: string,
  item: Item,
  entries: ReadonlyMap<string, ManifestEntry>,
  leaveOut: (item: Item, reason: string) => void,
): ManifestEntry | undefined {
  if (!isPlaceable(item.suppliedPath)) {
    leaveOut(
      item,
      `its Supplied path "${item.suppliedPath}" is not a relative path the supplied-path layout places.`,
    );
    return undefined;
  }
  const name = item.suppliedPath.slice(item.suppliedPath.lastIndexOf("/") + 1);
  const target = path.join(directory, name);

  const targetStats = lstatSync(target, { throwIfNoEntry: false });
  if (
    targetStats !== undefined &&
    !targetStats.isFile() &&
    !targetStats.isDirectory()
  ) {
    throw new TcError(
      `"${target}" in the copy is neither a file nor a directory, such as a link, which Turbo-Collection does not follow.`,
    );
  }

  let size: number;
  try {
    size = statSync(item.readPath).size;
  } catch (e) {
    leaveOut(item, `it cannot be read (${(e as Error).message}).`);
    return undefined;
  }

  const listed = entries.get(name);
  if (listed !== undefined) {
    let checksum: string | undefined;
    try {
      checksum = listed.size === size ? checksumOf(item.readPath) : undefined;
    } catch (e) {
      leaveOut(item, `it cannot be read (${(e as Error).message}).`);
      return undefined;
    }
    if (checksum !== listed.checksum) {
      leaveOut(
        item,
        `"${target}" in the collection holds other content, and an import never writes over it.`,
      );
    }
    return undefined;
  }

  if (targetStats?.isDirectory()) {
    leaveOut(item, `"${target}" in the copy is a directory.`);
    return undefined;
  }

  if (context.dryRun) {
    logTransfer(context, item.readPath, target, size);
    return undefined;
  }

  let written: { size: number; checksum: string } | undefined;
  try {
    mkdirSync(directory, { recursive: true });
    written = copyAndChecksum(item.readPath, target);
  } catch (e) {
    if (isCopyUnwritable(e, context.copyRoot)) {
      throw new TcError(
        `The copy at "${context.copyRoot}" cannot be written: it is gone, read-only or full. Files written before this are in the collection.`,
        { cause: e },
      );
    }
    leaveOut(
      item,
      `it could not be copied to "${target}" (${(e as Error).message}).`,
    );
    return undefined;
  }
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

// Whether `error` says the copy itself cannot be written: its drive gone,
// read-only or full (R-SRC-26).
function isCopyUnwritable(error: unknown, copyRoot: string): boolean {
  const code = (error as NodeJS.ErrnoException).code;
  if (code === "ENOSPC" || code === "EROFS") {
    return true;
  }
  try {
    return statSync(copyRoot, { throwIfNoEntry: false }) === undefined;
  } catch {
    return true;
  }
}

// How much of a file is read and written at a time.
const ChunkSize = 1024 * 1024;

// The SHA-256 checksum of the file at `file`, in lower-case hexadecimal.
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

// Copies the file at `from` to `to`, writing over a file there, and returns
// the length and the checksum of what it wrote, once the system has put it on
// its drive. Returns undefined where the file at `from` changed in size or
// modification time while it was read (R-SRC-26); what was written stays, a
// file no manifest lists (turbo-collection-spec.md R-TGT-13).
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
