import { randomUUID } from "node:crypto";
import {
  constants,
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { URL } from "node:url";

import { TcError } from "./helpers/tc-error.ts";
import type { Logger } from "./logger.ts";
import {
  configurationFileOf,
  copyRootAtOrAbove,
  ensureNoLinkInPath,
} from "./paths.ts";
import {
  compileIgnorePatterns,
  readIgnorePatterns,
  type IgnorePattern,
  type IgnoringPattern,
} from "./tcignore.ts";
import { MetaFileSpecVersion } from "./versions.ts";

// The init operation, which makes a directory a copy (init-spec.md R-INIT-1).

// The starter ignore file (meta-file-spec.md R-MFILE-20).
const StarterIgnoreFileUrl = new URL(
  "./templates/default.tcignore",
  import.meta.url,
);

// Creates `directory` where it does not exist, with every directory above it
// that does not exist (R-INIT-2). One that exists is left as it is.
export function createDirectoryIfMissing(directory: string): void {
  mkdirSync(directory, { recursive: true });
}

// Looks through `directory` at every depth, adding each file that
// `ignoringPattern` does not ignore to `filesNotIgnored`, and counting in
// `counts` what each pattern ignores. A file is given as a path relative to the
// directory looked through, with `/` between its segments.
//
// Anything that is not a directory counts as a file. A directory that a pattern
// ignores counts once for that pattern and is not looked into, and `pathPrefix`
// is the path so far, for the directories below the first.
function lookThrough(
  directory: string,
  ignoringPattern: IgnoringPattern,
  counts: Map<IgnorePattern, number>,
  filesNotIgnored: string[],
  pathPrefix = "",
): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = pathPrefix + entry.name;
    const isDirectory = entry.isDirectory();
    const pattern = ignoringPattern(isDirectory ? `${entryPath}/` : entryPath);
    if (pattern !== undefined) {
      counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
    } else if (!isDirectory) {
      filesNotIgnored.push(entryPath);
    } else {
      lookThrough(
        path.join(directory, entry.name),
        ignoringPattern,
        counts,
        filesNotIgnored,
        `${entryPath}/`,
      );
    }
  }
}

// Logs how many entries of `directory` each of `patterns` ignored
// (logging-spec.md R-LOG-14, meta-file-spec.md R-MFILE-21). The line of text
// leaves out a pattern that matched nothing.
function logIgnoreCounts(
  logger: Logger,
  directory: string,
  patterns: readonly IgnorePattern[],
  counts: ReadonlyMap<IgnorePattern, number>,
): void {
  const patternCounts = patterns.map((pattern) => ({
    pattern: pattern.text,
    count: counts.get(pattern) ?? 0,
  }));
  const matched = patternCounts
    .filter(({ count }) => count > 0)
    .map(({ pattern, count }) => `${pattern} ${count}`);
  logger.log({
    event: "ignore",
    verbose: true,
    path: directory,
    patterns: patternCounts,
    toString: () =>
      `ignore ${directory}: ${matched.length > 0 ? matched.join(", ") : "no pattern matched"}`,
  });
}

// Throws an error where `directory` holds a file, at any depth, that no starter
// pattern ignores, after logging every such file (R-INIT-3). Before either,
// logs how many entries each starter pattern ignored (logging-spec.md
// R-LOG-14).
export function ensureDirectoryHoldsNoFiles(
  directory: string,
  logger: Logger,
): void {
  const directoryPath = path.resolve(directory);
  const patterns = readIgnorePatterns(
    readFileSync(StarterIgnoreFileUrl, "utf8"),
  );
  const counts = new Map<IgnorePattern, number>();
  const filesNotIgnored: string[] = [];
  lookThrough(
    directoryPath,
    compileIgnorePatterns(patterns),
    counts,
    filesNotIgnored,
  );

  logIgnoreCounts(logger, directoryPath, patterns, counts);

  for (const file of filesNotIgnored) {
    logger.log({
      event: "file-not-ignored",
      outcome: "failure",
      path: directoryPath,
      file,
      toString: () => `file-not-ignored ${directoryPath}: ${file}`,
    });
  }
  if (filesNotIgnored.length > 0) {
    const files =
      filesNotIgnored.length === 1
        ? "a file"
        : `${filesNotIgnored.length} files`;
    throw new TcError(
      `"${directoryPath}" holds ${files} that the starter .tcignore does not ignore, each named in the log. Init makes a copy only in a directory that holds no such file.`,
    );
  }
}

// Throws an error where `directory` lies inside a copy
// (turbo-collection-core-spec.md R-CLI-18). Where `directory` is a copy itself,
// its configuration file stops init (R-INIT-3).
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

// The name of the collection a copy in `directory` begins (R-INIT-4):
// `givenName` as given where there is one, and otherwise the name of the
// directory, unchanged. A collection's name is not empty (meta-file-spec.md
// R-MFILE-18), and an empty one is an error.
export function collectionNameFor(
  directory: string,
  givenName: string | undefined,
): string {
  if (givenName !== undefined) {
    if (givenName === "") {
      throw new TcError("A collection's name cannot be empty.");
    }
    return givenName;
  }

  // The root of a drive has no name.
  const directoryPath = path.resolve(directory);
  const directoryName = path.basename(directoryPath);
  if (directoryName === "") {
    throw new TcError(
      `No name for the collection can be taken from "${directoryPath}". Give one with --name.`,
    );
  }

  return directoryName;
}

// The name a new copy takes where none is given (R-INIT-4).
const DefaultCopyName = "main";

// A character a copy's name cannot hold: a control character, or one that an
// operating system refuses in a filename (meta-file-spec.md R-MFILE-19).
const CharacterNotInCopyName = /[\p{Cc}<>:"\/\\|?*]/u;

// The name of a new copy (R-INIT-4): `givenName` in Unicode Normalization Form
// C where there is one, and otherwise `main`. A name that is empty or holds a
// character it cannot hold is an error (meta-file-spec.md R-MFILE-18,
// R-MFILE-19).
export function copyNameFor(givenName: string | undefined): string {
  if (givenName === undefined) {
    return DefaultCopyName;
  }

  const copyName = givenName.normalize("NFC");
  if (copyName === "" || CharacterNotInCopyName.test(copyName)) {
    throw new TcError(
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

// Writes `tcConfig` as the configuration file of a new copy in `directory`, and
// returns the file's path. The file is written with `wx`, so only where nothing
// is at its path (parallel-safety-spec.md R-PARALLEL-2). Where something is,
// another run made the directory a copy after init found it empty, and this is
// an error (R-PARALLEL-3).
export function writeConfigurationFile(
  directory: string,
  tcConfig: TcConfig,
): string {
  const configurationFile = configurationFileOf(directory);
  mkdirSync(path.dirname(configurationFile), { recursive: true });

  // The fields of R-MFILE-18, each on a line of its own (R-MFILE-27).
  try {
    writeFileSync(configurationFile, `${JSON.stringify(tcConfig, null, 2)}\n`, {
      flag: "wx",
    });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST") {
      throw new TcError(
        `"${configurationFile}" appeared after init found "${directory}" empty, so another run made it a copy first. Init wrote nothing more.`,
        { cause: e },
      );
    }
    throw e;
  }

  return configurationFile;
}

// Makes `directory` the first copy of a new collection, and returns the
// configuration it writes there (R-INIT-1).
//
// Both names are checked before a directory is created, and the path before a
// directory is created (turbo-collection-core-spec.md R-CLI-18, R-CLI-20); the
// directory is checked before a file is written. The configuration file is
// written first, since it is what makes a directory a copy, and the ignore file
// after it (parallel-safety-spec.md R-PARALLEL-2).
export function initializeTc(
  directory: string,
  givenCollectionName: string | undefined,
  givenCopyName: string | undefined,
  logger: Logger,
): TcConfig {
  const collectionName = collectionNameFor(directory, givenCollectionName);
  const copyName = copyNameFor(givenCopyName);
  const directoryPath = path.resolve(directory);
  ensureNoLinkInPath(directoryPath);
  ensureNotInsideCopy(directoryPath);
  createDirectoryIfMissing(directoryPath);
  ensureDirectoryHoldsNoFiles(directoryPath, logger);

  // Init generates the collection's ID (R-INIT-4), which Node writes in
  // lower case.
  const tcConfig: TcConfig = {
    version: MetaFileSpecVersion,
    collectionId: randomUUID(),
    collectionName,
    copyName,
  };
  const configurationFile = writeConfigurationFile(directoryPath, tcConfig);
  logger.log({
    event: "configuration",
    verbose: true,
    path: configurationFile,
    configuration: tcConfig,
    toString: () =>
      `configuration ${configurationFile}: ${JSON.stringify(tcConfig)}`,
  });

  // The starter ignore file is copied byte for byte, so what a copy holds does
  // not depend on the operating system that made it (R-CLI-15). It is never
  // copied over a file already there.
  copyFileSync(
    StarterIgnoreFileUrl,
    path.join(directoryPath, ".tcignore"),
    constants.COPYFILE_EXCL,
  );

  // What init made, in an entry that is not verbose, so that a plain init says
  // what it did (logging-spec.md R-LOG-9).
  logger.log({
    event: "init",
    path: directoryPath,
    collectionName,
    copyName,
    toString: () =>
      `init ${directoryPath}: made a copy named "${copyName}", of a new collection named "${collectionName}"`,
  });
  return tcConfig;
}
