import {
  closeSync,
  constants,
  copyFileSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  statSync,
  writeSync,
} from "node:fs";
import path from "node:path";

import { takeCollectionLock } from "./collection-lock.ts";
import { copyAndChecksum, isCopyUnwritable } from "./content-files.ts";
import { readCopy, type CopyContents } from "./copy-contents.ts";
import { dateToString } from "./helpers/date-helper.ts";
import { TcError } from "./helpers/tc-error.ts";
import {
  copyNameFor,
  filesNotIgnoredIn,
  writeConfigurationFile,
} from "./init.ts";
import { logger } from "./logger.ts";
import {
  contentDigestOf,
  metaDirectoryOf,
  readConfigurationFile,
  writeManifest,
  writeReceiptFile,
  type ManifestEntry,
  type TcConfig,
} from "./meta-files.ts";
import {
  planMirror,
  type CopyPlan,
  type DirectoryCopying,
  type FileCopying,
  type MirrorPlan,
} from "./mirror.ts";
import {
  configurationFileOf,
  ensureNoLinkInPath,
  ensureNotInsideCopy,
  isCopyRoot,
  pathKeyOf,
} from "./paths.ts";
import {
  compileIgnorePatterns,
  ignoreFileOf,
  readIgnoreFile,
} from "./tcignore.ts";
import { MetaFileSpecVersion } from "./versions.ts";

// Backup (backup-spec.md), which mirrors two copies of one collection, and
// first makes one of its two directories a copy where it is not one yet.
// Nothing here deletes a file (R-BACKUP-6) or needs a network (R-BACKUP-3):
// a backup reads and writes files on its two copies' drives, and nothing
// else.

// What a command line gives backup.
export type BackupArgs = {
  // Two directories to mirror, at least one of them a copy (R-BACKUP-1)
  directories: readonly [string, string];
  // --copy: a name for a copy this backup creates (R-BACKUP-1)
  copyName: string | undefined;
  // --dry-run: say what a real backup would copy, and change nothing
  // (R-BACKUP-10)
  dryRun: boolean;
};

// One of a backup's two copies: its root, its configuration, and what it
// held before this backup wrote anything, nothing for a copy this backup
// creates.
type BackupCopy = {
  root: string;
  tcConfig: TcConfig;
  contents: CopyContents;
};

// A receipt file this backup wrote into one copy, which it then writes into
// the other copy too, so that both hold every receipt file (verify-spec.md
// R-REC-6).
type NewReceiptFile = {
  // The copy it goes into, and its directory there
  into: BackupCopy;
  directory: string;
  kind: "arrival" | "error";
  copyName: string;
  fields: Record<string, unknown>;
};

// What one backup does as it goes.
type BackupContext = {
  runId: string;
  dryRun: boolean;
  // How many things this backup reported as wrong
  problems: number;
  newReceiptFiles: NewReceiptFile[];
};

// What a mirror copied into one copy (logging-spec.md R-LOG-16).
type Copied = {
  files: number;
  bytes: number;
};

// Backs up `directories` (R-BACKUP-1). `runId` names the receipt files the
// backup writes (meta-file-spec.md R-MFILE-13).
//
// Every check is made before a directory is made or a file written: the
// paths given, each copy's configuration, then, holding the collection's
// lock, the ignore files and what both copies hold. Then a directory that is
// not a copy is made one, and each copy is given what the other holds and it
// lacks. What is wrong is reported as it is found, and once all else is
// done, it ends the run with an error, so the run exits with a non-zero
// status (turbo-collection-core-spec.md R-CLI-1).
export async function backUp(
  { directories, copyName: givenCopyName, dryRun }: BackupArgs,
  runId: string,
): Promise<void> {
  const [rootA, rootB] = [
    path.resolve(directories[0]),
    path.resolve(directories[1]),
  ];
  for (const root of [rootA, rootB]) {
    ensureNoLinkInPath(root);
  }
  if (rootA === rootB) {
    throw new TcError(
      `A backup mirrors two directories, and was given "${rootA}" twice.`,
    );
  }
  const isCopyA = isCopyRoot(rootA);
  const isCopyB = isCopyRoot(rootB);
  if (!isCopyA && !isCopyB) {
    throw new TcError(
      `Neither "${rootA}" nor "${rootB}" is a copy, and a backup is given at least one copy.`,
    );
  }
  for (const root of [rootA, rootB]) {
    ensureNotInsideCopy(root);
  }

  // A copy's configuration is read before the lock is taken, to learn which
  // collection that copy belongs to (parallel-safety-spec.md R-PARALLEL-4).
  const tcConfigA = isCopyA ? readConfiguration(rootA) : undefined;
  const tcConfigB = isCopyB ? readConfiguration(rootB) : undefined;
  if (tcConfigA !== undefined && tcConfigB !== undefined) {
    ensureOneCollection(rootA, tcConfigA, rootB, tcConfigB, givenCopyName);
  }
  const existingTcConfig = (tcConfigA ?? tcConfigB)!;
  const newCopyName =
    tcConfigA === undefined || tcConfigB === undefined
      ? nameForNewCopy(isCopyA ? rootB : rootA, existingTcConfig, givenCopyName)
      : undefined;

  await using _collectionLock = await takeCollectionLock(existingTcConfig);

  const context: BackupContext = {
    runId,
    dryRun,
    problems: 0,
    newReceiptFiles: [],
  };
  let copyA: BackupCopy;
  let copyB: BackupCopy;
  if (tcConfigA !== undefined && tcConfigB !== undefined) {
    ensureSameIgnorePatterns(rootA, rootB);
    copyA = readBackupCopy(rootA, tcConfigA);
    copyB = readBackupCopy(rootB, tcConfigB);
    ensureRegularEntriesOnly(context, copyA, copyB);
  } else {
    const existingRoot = isCopyA ? rootA : rootB;
    const newRoot = isCopyA ? rootB : rootA;
    ensureEmptyForNewCopy(newRoot, existingRoot);
    const existing = readBackupCopy(existingRoot, existingTcConfig);
    ensureRegularEntriesOnly(context, existing);
    const created = createCopy(context, newRoot, existing, newCopyName!);
    [copyA, copyB] = isCopyA ? [existing, created] : [created, existing];
  }

  const plan = planMirror(copyA.contents, copyB.contents);
  reportPlan(context, plan, copyA, copyB);

  // Each copy is written to in turn, and a failure against one is reported
  // and does not stop an attempt against the other (R-BACKUP-8).
  for (const [into, from, copyPlan] of [
    [copyB, copyA, plan.b],
    [copyA, copyB, plan.a],
  ] as const) {
    const copied: Copied = { files: 0, bytes: 0 };
    try {
      mirrorInto(context, into, from, copyPlan, copied);
    } catch (e) {
      logger.error(e);
      context.problems++;
    }
    logger.log({
      event: "mirror",
      path: into.root,
      copyName: into.tcConfig.copyName,
      files: copied.files,
      bytes: copied.bytes,
      toString: () =>
        `${dryRun ? "Would copy" : "Copied"} ${countOfFiles(copied.files)} (${copied.bytes} bytes) into "${into.tcConfig.copyName}" at ${into.root}`,
    });
  }
  writeNewReceiptFilesIntoOtherCopies(context);

  if (context.problems > 0) {
    throw new TcError(
      `The backup of "${rootA}" and "${rootB}" found ${countOf(context.problems, "problem")}, each named above. Everything else ${dryRun ? "would be" : "was"} backed up.`,
    );
  }
}

// "1 file", or "2 files".
function countOfFiles(count: number): string {
  return countOf(count, "file");
}

// "1 thing", or "2 things".
function countOf(count: number, thing: string): string {
  return count === 1 ? `1 ${thing}` : `${count} ${thing}s`;
}

// Reads the configuration of a copy at `copyRoot` (logging-spec.md R-LOG-13).
function readConfiguration(copyRoot: string): TcConfig {
  const configurationFile = configurationFileOf(copyRoot);
  const tcConfig = readConfigurationFile(copyRoot);
  logger.log({
    event: "configuration",
    verbose: true,
    path: configurationFile,
    configuration: tcConfig,
    toString: () => `Read ${configurationFile}: ${JSON.stringify(tcConfig)}`,
  });
  return tcConfig;
}

// Throws where copies at `rootA` and `rootB` belong to two collections
// (R-BACKUP-1), or are named alike without regard to letter case
// (meta-file-spec.md R-MFILE-19), or where `givenCopyName` names a copy this
// backup would create, since it creates none (R-BACKUP-1).
function ensureOneCollection(
  rootA: string,
  tcConfigA: TcConfig,
  rootB: string,
  tcConfigB: TcConfig,
  givenCopyName: string | undefined,
): void {
  if (tcConfigA.collectionId !== tcConfigB.collectionId) {
    throw new TcError(
      `"${rootA}" is a copy of the collection "${tcConfigA.collectionName}" (${tcConfigA.collectionId}), and "${rootB}" is a copy of the collection "${tcConfigB.collectionName}" (${tcConfigB.collectionId}). A backup mirrors two copies of one collection.`,
    );
  }
  if (pathKeyOf(tcConfigA.copyName) === pathKeyOf(tcConfigB.copyName)) {
    throw new TcError(
      `"${rootA}" and "${rootB}" are copies named "${tcConfigA.copyName}" and "${tcConfigB.copyName}", which are one name without regard to letter case. Two copies a run connects have two names.`,
    );
  }
  if (givenCopyName !== undefined) {
    throw new TcError(
      `--copy names a copy for a backup to make, and "${rootA}" and "${rootB}" are both copies, so this backup makes none.`,
    );
  }
}

// The name of a new copy that a backup makes at `newRoot` (R-BACKUP-1):
// `givenCopyName` in NFC. No name, one that is not valid, and the name of
// the copy whose configuration is `existing`, without regard to letter case,
// are each an error (meta-file-spec.md R-MFILE-19).
function nameForNewCopy(
  newRoot: string,
  existing: TcConfig,
  givenCopyName: string | undefined,
): string {
  if (givenCopyName === undefined) {
    throw new TcError(
      `"${newRoot}" is not a copy, and a backup makes it one only when given a name for it with --copy.`,
    );
  }
  const copyName = copyNameFor(givenCopyName);
  if (pathKeyOf(copyName) === pathKeyOf(existing.copyName)) {
    throw new TcError(
      `"${givenCopyName}" is the name of the copy this backup mirrors, without regard to letter case. Give the new copy another name.`,
    );
  }
  return copyName;
}

// Throws where copies at `rootA` and `rootB` hold different ignore patterns,
// or the same in another order, naming both ignore files (R-BACKUP-15).
function ensureSameIgnorePatterns(rootA: string, rootB: string): void {
  const patternsA = readIgnoreFile(rootA).map((pattern) => pattern.text);
  const patternsB = readIgnoreFile(rootB).map((pattern) => pattern.text);
  if (
    patternsA.length !== patternsB.length ||
    patternsA.some((pattern, index) => pattern !== patternsB[index])
  ) {
    throw new TcError(
      `The ignore files "${ignoreFileOf(rootA)}" and "${ignoreFileOf(rootB)}" hold different patterns, so nothing is backed up. A backup mirrors two copies once their ignore files hold the same patterns, in the same order; a copy with no ignore file holds none.`,
    );
  }
}

// Throws where `newRoot`, which is not a copy, cannot become one: where it is
// something other than a directory, or holds a file at any depth that no
// pattern of the ignore file at `existingRoot` ignores, after logging every
// such file (R-BACKUP-1).
function ensureEmptyForNewCopy(newRoot: string, existingRoot: string): void {
  const stats = statSync(newRoot, { throwIfNoEntry: false });
  if (stats === undefined) {
    return;
  }
  if (!stats.isDirectory()) {
    throw new TcError(
      `"${newRoot}" is not a directory, so a backup cannot make it a copy.`,
    );
  }
  const filesNotIgnored = filesNotIgnoredIn(
    newRoot,
    compileIgnorePatterns(readIgnoreFile(existingRoot)),
  );
  for (const file of filesNotIgnored) {
    logger.log({
      event: "file-not-ignored",
      outcome: "failure",
      path: newRoot,
      file,
      toString: () => path.join(newRoot, file),
    });
  }
  if (filesNotIgnored.length > 0) {
    throw new TcError(
      `"${newRoot}" holds ${countOfFiles(filesNotIgnored.length)} that the ignore file of "${existingRoot}" does not ignore, each named above. A backup makes a copy only in a directory that holds no such file.`,
    );
  }
}

// A copy at `root` whose configuration is `tcConfig`, with what it holds,
// read through its own ignore file.
function readBackupCopy(root: string, tcConfig: TcConfig): BackupCopy {
  return {
    root,
    tcConfig,
    contents: readCopy(root, compileIgnorePatterns(readIgnoreFile(root))),
  };
}

// Throws where any of `copies` holds an entry that is neither a file nor a
// directory, such as a link, after logging each, so that nothing is written
// (turbo-collection-core-spec.md R-CLI-19).
function ensureRegularEntriesOnly(
  context: BackupContext,
  ...copies: BackupCopy[]
): void {
  const notRegular = copies.flatMap((copy) => copy.contents.notRegular);
  for (const entry of notRegular) {
    reportError(
      context,
      `"${entry}" is neither a file nor a directory, such as a link, which Turbo-Collection does not follow.`,
      entry,
    );
  }
  if (notRegular.length > 0) {
    throw new TcError(
      "The backup copies nothing, since a copy holds entries that are neither a file nor a directory, each named above. A pattern in .tcignore passes over such an entry.",
    );
  }
}

// Makes `newRoot` a new copy named `copyName` of the collection `existing`
// belongs to, with a duplicate of `existing`'s ignore file, where it has one
// (R-BACKUP-1, R-BACKUP-2). Its configuration file is written first, and only
// where nothing is at its path (parallel-safety-spec.md R-PARALLEL-2,
// R-PARALLEL-3). A dry run makes nothing, and says what it would make.
function createCopy(
  context: BackupContext,
  newRoot: string,
  existing: BackupCopy,
  copyName: string,
): BackupCopy {
  const tcConfig: TcConfig = {
    version: MetaFileSpecVersion,
    collectionId: existing.tcConfig.collectionId,
    collectionName: existing.tcConfig.collectionName,
    copyName,
  };
  const contents: CopyContents = {
    directories: new Map([
      ["", { files: new Set(), manifest: undefined, receiptFiles: [] }],
    ]),
    notRegular: [],
    unrecognized: [],
  };
  if (!context.dryRun) {
    mkdirSync(newRoot, { recursive: true });
    const configurationFile = writeConfigurationFile(newRoot, tcConfig);
    logger.log({
      event: "configuration",
      verbose: true,
      path: configurationFile,
      configuration: tcConfig,
      toString: () => `Wrote ${configurationFile}: ${JSON.stringify(tcConfig)}`,
    });
    // Copied byte for byte, and never over a file already there
    if (
      lstatSync(ignoreFileOf(existing.root), { throwIfNoEntry: false }) !==
      undefined
    ) {
      copyFileSync(
        ignoreFileOf(existing.root),
        ignoreFileOf(newRoot),
        constants.COPYFILE_EXCL,
      );
    }
  }
  logger.log(
    `${context.dryRun ? "Would make" : "Made"} ${newRoot} a copy named "${copyName}", of the collection "${tcConfig.collectionName}"`,
  );
  return { root: newRoot, tcConfig, contents };
}

// Logs `message` as an error, naming `file`, and counts it as a problem.
function reportError(
  context: BackupContext,
  message: string,
  file: string,
): void {
  logger.log({
    event: "error",
    outcome: "failure",
    message,
    path: file,
    toString: () => message,
  });
  context.problems++;
}

// Reports what `plan` found wrong in copies `a` and `b`, which a mirror
// copies nowhere: a file no manifest lists (R-BACKUP-12), a file whose
// manifests state two checksums (R-BACKUP-4, verify-spec.md R-INT-7), a
// directory of two provenances (R-BACKUP-14), a path held in two spellings
// (turbo-collection-spec.md R-TGT-14), and an entry of a `.turbo-collection`
// directory that is no meta file (meta-file-spec.md R-MFILE-1).
function reportPlan(
  context: BackupContext,
  plan: MirrorPlan,
  a: BackupCopy,
  b: BackupCopy,
): void {
  for (const [copy, copyPlan] of [
    [a, plan.a],
    [b, plan.b],
  ] as const) {
    const copyName = copy.tcConfig.copyName;
    for (const unlisted of copyPlan.unlisted) {
      const file = path.join(copy.root, unlisted);
      reportError(
        context,
        `"${file}" is listed in no manifest of copy "${copyName}", so it is not in the collection, and no backup copies it.`,
        file,
      );
    }
    for (const paths of copyPlan.heldTwice) {
      const files = paths.map((one) => `"${path.join(copy.root, one)}"`);
      reportError(
        context,
        `Copy "${copyName}" holds ${files.join(" and ")}, which are one path, since they differ only in letter case or normalization, so nothing is copied at it.`,
        path.join(copy.root, paths[0]!),
      );
    }
    for (const file of copy.contents.unrecognized) {
      reportError(
        context,
        `"${file}" is no meta file Turbo-Collection knows, so it is not read.`,
        file,
      );
    }
  }
  const nameA = a.tcConfig.copyName;
  const nameB = b.tcConfig.copyName;
  for (const difference of plan.differing) {
    reportError(
      context,
      `"${difference.path}" differs between copy "${nameA}" (checksum ${difference.a.checksum}) and copy "${nameB}" (checksum ${difference.b.checksum}), so neither is copied over the other. Which to keep is for a person to decide.`,
      path.join(a.root, difference.path),
    );
  }
  for (const mismatch of plan.mismatched) {
    const { a: inA, b: inB } = mismatch;
    reportError(
      context,
      `"${mismatch.path}" holds content that ${inA.importSource.specId} placed under ${inA.layout.specId} in copy "${nameA}", and that ${inB.importSource.specId} placed under ${inB.layout.specId} in copy "${nameB}", so no file is copied into it either way.`,
      path.join(a.root, mismatch.path),
    );
  }
}

// Copies into copy `into` from copy `from` what `copyPlan` names, adding
// what it copies to `copied`. A copy that cannot be written at all ends this
// at once, with an error (R-BACKUP-8).
function mirrorInto(
  context: BackupContext,
  into: BackupCopy,
  from: BackupCopy,
  copyPlan: CopyPlan,
  copied: Copied,
): void {
  for (const copying of copyPlan.directories) {
    mirrorDirectory(context, into, from, copying, copied);
  }
}

// Copies into one directory of copy `into` what `copying` names. Each
// content file is written straight to its path, and checked against its
// entry as it is copied; once that directory's files are written, its
// manifest lists those that match (R-BACKUP-9, R-BACKUP-12, R-BACKUP-13,
// turbo-collection-spec.md R-TGT-13). Then it gets its arrival file
// (verify-spec.md R-REC-5), and the receipt files the other copy holds there
// (R-REC-6). A file that cannot be copied is recorded in an error file of
// the copy it was to be copied from (meta-file-spec.md R-MFILE-13).
function mirrorDirectory(
  context: BackupContext,
  into: BackupCopy,
  from: BackupCopy,
  copying: DirectoryCopying,
  copied: Copied,
): void {
  const intoDirectory = path.join(into.root, copying.to);
  const fromDirectory = path.join(from.root, copying.from);
  const errors: string[] = [];
  const entries: ManifestEntry[] = [];

  // A file this directory's manifest lists, and which is not here, is taken
  // out of that manifest before it is written again, so that what a stopped
  // backup leaves at its path is in no manifest, and the next backup writes
  // over it (R-BACKUP-9, turbo-collection-spec.md R-TGT-13).
  const manifest = into.contents.directories.get(copying.to)?.manifest;
  const copyingKeys = new Set(
    copying.files.map((file) => pathKeyOf(file.entry.file)),
  );
  const kept = (manifest?.files ?? []).filter(
    (entry) => !copyingKeys.has(pathKeyOf(entry.file)),
  );
  if (
    !context.dryRun &&
    manifest !== undefined &&
    kept.length < manifest.files.length
  ) {
    writeManifest(intoDirectory, { ...manifest, files: kept });
  }

  for (const file of copying.files) {
    const entry = copyFile(context, into, from, copying, file, errors);
    if (entry !== undefined) {
      entries.push(entry);
      copied.files++;
      copied.bytes += entry.size;
    }
  }
  if (context.dryRun) {
    return;
  }

  if (entries.length > 0) {
    listAndRecordArrival(context, into, from, copying, kept, entries);
  }
  for (const name of copying.receiptFiles) {
    copyReceiptFile(context, into, fromDirectory, intoDirectory, name);
  }
  if (errors.length > 0) {
    recordMirrorErrors(context, fromDirectory, into, intoDirectory, {
      mirrorErrors: errors.map((message) => ({ message })),
    });
  }
}

// Whether `name` names a file in one directory on this system: not empty,
// not `.` or `..`, and holding no separator.
function isOneName(name: string): boolean {
  return (
    name !== "" && name !== "." && name !== ".." && path.basename(name) === name
  );
}

// Copies one content file into a directory of copy `into`, and returns the
// entry it is to be listed with there, or undefined where it copied nothing
// it may list, after logging why and keeping that in `errors`. A dry run
// copies nothing, and returns what a real run would list.
function copyFile(
  context: BackupContext,
  into: BackupCopy,
  from: BackupCopy,
  copying: DirectoryCopying,
  file: FileCopying,
  errors: string[],
): ManifestEntry | undefined {
  const source = path.join(from.root, copying.from, file.from);
  const target = path.join(into.root, copying.to, file.entry.file);
  const fail = (reason: string): undefined => {
    const message = `"${source}" is not copied to copy "${into.tcConfig.copyName}": ${reason}`;
    reportError(context, message, source);
    errors.push(message);
    return undefined;
  };

  if (!isOneName(file.entry.file)) {
    return fail(`"${file.entry.file}" is no name a file can have here.`);
  }
  // Only a file no manifest lists is written over (R-BACKUP-5,
  // turbo-collection-spec.md R-TGT-13), and the plan names each one;
  // anything else at that path stays as it is.
  const writesOver =
    into.contents.directories.get(copying.to)?.files.has(file.entry.file) ===
    true;
  const targetStats = lstatSync(target, { throwIfNoEntry: false });
  if (targetStats !== undefined && (!writesOver || !targetStats.isFile())) {
    return fail(`something else is at "${target}".`);
  }

  // A file whose length is not its entry's is copied nowhere, which a dry
  // run learns without reading its content, as a real run does (R-BACKUP-10)
  let sourceSize: number;
  try {
    sourceSize = statSync(source).size;
  } catch (e) {
    return fail(`it cannot be read (${(e as Error).message}).`);
  }
  if (sourceSize !== file.entry.size) {
    return fail(
      `it is ${sourceSize} bytes long, and its manifest says ${file.entry.size}.`,
    );
  }

  if (context.dryRun) {
    logTransfer(context, source, target, file.entry.size);
    return file.entry;
  }

  let written: { size: number; checksum: string } | undefined;
  try {
    mkdirSync(path.dirname(target), { recursive: true });
    written = copyAndChecksum(source, target);
  } catch (e) {
    if (isCopyUnwritable(e, into.root)) {
      throw new TcError(
        `Copy "${into.tcConfig.copyName}" at "${into.root}" cannot be written: it is gone, read-only or full. Files copied before this are in the collection there.`,
        { cause: e },
      );
    }
    return fail(`it could not be written (${(e as Error).message}).`);
  }
  if (written === undefined) {
    return fail("it changed while it was read.");
  }
  if (written.checksum !== file.entry.checksum) {
    return fail(
      `its checksum is ${written.checksum}, and its manifest says ${file.entry.checksum}, so it is not listed where it was written.`,
    );
  }

  logTransfer(context, source, target, written.size);
  return file.entry;
}

// Logs a file a backup copies, or a dry run would copy (R-LOG-15).
function logTransfer(
  context: BackupContext,
  from: string,
  to: string,
  size: number,
): void {
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

// Lists `entries`, each of a file just written, in the manifest of a
// directory of copy `into`, beside `kept`, the entries it keeps for other
// files. A directory with no manifest gets one holding every field of copy
// `from`'s manifest (R-BACKUP-13). Then writes that directory's arrival file
// over the content files it now holds (meta-file-spec.md R-MFILE-14,
// R-MFILE-15).
function listAndRecordArrival(
  context: BackupContext,
  into: BackupCopy,
  from: BackupCopy,
  copying: DirectoryCopying,
  kept: readonly ManifestEntry[],
  entries: readonly ManifestEntry[],
): void {
  const intoDirectory = path.join(into.root, copying.to);
  const held = into.contents.directories.get(copying.to);
  const manifest =
    held?.manifest ?? from.contents.directories.get(copying.from)!.manifest!;
  const files = [...kept, ...entries];
  writeManifest(intoDirectory, { ...manifest, files });

  const present = new Set(
    [...(held?.files ?? []), ...entries.map((entry) => entry.file)].map(
      pathKeyOf,
    ),
  );
  const presentFiles = files.filter((entry) =>
    present.has(pathKeyOf(entry.file)),
  );
  const fields = {
    date: dateToString(new Date()),
    fileCount: presentFiles.length,
    contentDigest: contentDigestOf(presentFiles.map((entry) => entry.checksum)),
  };
  const copyName = into.tcConfig.copyName;
  writeReceiptFile(intoDirectory, "arrival", context.runId, copyName, fields);
  context.newReceiptFiles.push({
    into: from,
    directory: path.join(from.root, copying.from),
    kind: "arrival",
    copyName,
    fields,
  });
}

// Copies a receipt file named `name` from `fromDirectory`'s
// `.turbo-collection` into `intoDirectory`'s, a directory of copy `into`,
// only where nothing is at its path there (verify-spec.md R-REC-6), and has
// it put on its drive. A copy that cannot be written at all is an error.
function copyReceiptFile(
  context: BackupContext,
  into: BackupCopy,
  fromDirectory: string,
  intoDirectory: string,
  name: string,
): void {
  const source = path.join(metaDirectoryOf(fromDirectory), name);
  const target = path.join(metaDirectoryOf(intoDirectory), name);
  try {
    mkdirSync(metaDirectoryOf(intoDirectory), { recursive: true });
    const bytes = readFileSync(source);
    const descriptor = openSync(target, "wx");
    try {
      let offset = 0;
      while (offset < bytes.length) {
        offset += writeSync(descriptor, bytes, offset);
      }
      fsyncSync(descriptor);
    } finally {
      closeSync(descriptor);
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST") {
      // Held there already, under a spelling that differs only in letter
      // case (turbo-collection-spec.md R-TGT-14)
      return;
    }
    if (isCopyUnwritable(e, into.root)) {
      throw new TcError(
        `Copy "${into.tcConfig.copyName}" at "${into.root}" cannot be written: it is gone, read-only or full.`,
        { cause: e },
      );
    }
    reportError(
      context,
      `The receipt file "${source}" could not be copied to "${target}" (${(e as Error).message}).`,
      source,
    );
  }
}

// Writes an error file holding `fields` in `fromDirectory`, a directory of
// the copy files were copied from, for this run and copy `into`, which the
// errors are of (meta-file-spec.md R-MFILE-13, R-MFILE-16), then has it
// written into `intoDirectory` once both copies are mirrored. Where it
// cannot be written, that is reported too.
function recordMirrorErrors(
  context: BackupContext,
  fromDirectory: string,
  into: BackupCopy,
  intoDirectory: string,
  fields: Record<string, unknown>,
): void {
  const copyName = into.tcConfig.copyName;
  try {
    writeReceiptFile(fromDirectory, "error", context.runId, copyName, fields);
  } catch (e) {
    reportError(
      context,
      `The errors above could not be recorded in "${fromDirectory}" (${(e as Error).message}).`,
      fromDirectory,
    );
    return;
  }
  context.newReceiptFiles.push({
    into,
    directory: intoDirectory,
    kind: "error",
    copyName,
    fields,
  });
}

// Writes each receipt file this backup wrote into one copy into the other
// copy too, so that both copies end holding every receipt file
// (verify-spec.md R-REC-6). One that cannot be written there is reported,
// and the next backup copies it.
function writeNewReceiptFilesIntoOtherCopies(context: BackupContext): void {
  if (context.dryRun) {
    return;
  }
  for (const receipt of context.newReceiptFiles) {
    try {
      writeReceiptFile(
        receipt.directory,
        receipt.kind,
        context.runId,
        receipt.copyName,
        receipt.fields,
      );
    } catch (e) {
      reportError(
        context,
        `A receipt file of copy "${receipt.copyName}" could not be written into "${receipt.directory}" of copy "${receipt.into.tcConfig.copyName}" (${(e as Error).message}). The next backup copies it there.`,
        receipt.directory,
      );
    }
  }
}
