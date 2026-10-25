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
import { logger } from "./logger.ts";
import { CharacterNotInCopyName, type TcConfig } from "./meta-files.ts";
import {
  configurationFileOf,
  ensureNoLinkInPath,
  ensureNotInsideCopy,
} from "./paths.ts";
import {
  compileIgnorePatterns,
  readIgnorePatterns,
  type IsIgnored,
} from "./tcignore.ts";
import { MetaFileSpecVersion } from "./versions.ts";

// Init, an operation that makes a directory a copy (init-spec.md R-INIT-1).

// Init's starter ignore file (meta-file-spec.md R-MFILE-20).
const StarterIgnoreFileUrl = new URL(
  "./templates/default.tcignore",
  import.meta.url,
);

// Creates `directory` where it does not exist, with every directory above it
// that does not exist (R-INIT-2). One that exists is left as it is.
export function createDirectoryIfMissing(directory: string): void {
  mkdirSync(directory, { recursive: true });
}

// Looks through `directory` at every depth, adding each file that `isIgnored`
// does not ignore to `filesNotIgnored`. A file is given as a path relative to
// a first call's `directory`, with `/` between its segments.
//
// Anything that is not a directory counts as a file. A directory that is
// ignored is not looked into, and `pathPrefix` is `directory`'s path so far,
// for each call below that first one.
function lookThrough(
  directory: string,
  isIgnored: IsIgnored,
  filesNotIgnored: string[],
  pathPrefix = "",
): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = pathPrefix + entry.name;
    const isDirectory = entry.isDirectory();
    if (isIgnored(isDirectory ? `${entryPath}/` : entryPath)) {
      continue;
    }
    if (!isDirectory) {
      filesNotIgnored.push(entryPath);
    } else {
      lookThrough(
        path.join(directory, entry.name),
        isIgnored,
        filesNotIgnored,
        `${entryPath}/`,
      );
    }
  }
}

// Path of each file at any depth in `directory` that `isIgnored` does not
// ignore, relative to `directory`, with `/` between its segments. Anything
// that is not a directory counts as a file.
export function filesNotIgnoredIn(
  directory: string,
  isIgnored: IsIgnored,
): string[] {
  const filesNotIgnored: string[] = [];
  lookThrough(directory, isIgnored, filesNotIgnored);
  return filesNotIgnored;
}

// Throws an error where `directory` holds a file, at any depth, that no starter
// pattern ignores, after logging every such file (R-INIT-3).
export function ensureDirectoryHoldsNoFiles(directory: string): void {
  const directoryPath = path.resolve(directory);
  const isIgnored = compileIgnorePatterns(
    readIgnorePatterns(readFileSync(StarterIgnoreFileUrl, "utf8")),
  );
  const filesNotIgnored = filesNotIgnoredIn(directoryPath, isIgnored);

  for (const file of filesNotIgnored) {
    logger.log({
      event: "file-not-ignored",
      outcome: "failure",
      path: directoryPath,
      file,
      toString: () => path.join(directoryPath, file),
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

// A name for a collection begun by a copy in `directory` (R-INIT-4):
// `givenName` as given where there is one, and otherwise `directory`'s name,
// unchanged. A collection's name is not empty (meta-file-spec.md
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

  // A drive's root has no name.
  const directoryPath = path.resolve(directory);
  const directoryName = path.basename(directoryPath);
  if (directoryName === "") {
    throw new TcError(
      `No name for the collection can be taken from "${directoryPath}". Give one with --name.`,
    );
  }

  return directoryName;
}

// What a new copy is called where no name is given (R-INIT-4).
const DefaultCopyName = "main";

// A new copy's name (R-INIT-4): `givenName` in Unicode Normalization Form
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

// Writes `tcConfig` as a new copy's configuration file in `directory`, and
// returns that file's path. It is written with `wx`, so only where nothing is
// at its path (parallel-safety-spec.md R-PARALLEL-2). Where something is,
// another run made `directory` a copy after this run found it empty, and this
// is an error (R-PARALLEL-3). Init and backup both make a copy this way.
export function writeConfigurationFile(
  directory: string,
  tcConfig: TcConfig,
): string {
  const configurationFile = configurationFileOf(directory);
  mkdirSync(path.dirname(configurationFile), { recursive: true });

  // R-MFILE-18's fields, each on a line of its own (R-MFILE-27).
  try {
    writeFileSync(configurationFile, `${JSON.stringify(tcConfig, null, 2)}\n`, {
      flag: "wx",
    });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST") {
      throw new TcError(
        `Another run made "${directory}" a copy first. This run wrote no file there.`,
        { cause: e },
      );
    }
    throw e;
  }

  return configurationFile;
}

// What a command line gives init.
export type InitArgs = {
  // Where to make a first copy: init's working directory where a command line
  // names none (R-INIT-2)
  directory: string;
  // -n, --name: what a new collection is called (R-INIT-4)
  collectionName?: string | undefined;
  // --copy: what a new copy is called (R-INIT-4)
  copyName?: string | undefined;
};

// Makes `directory` a new collection's first copy, and returns that copy's
// configuration (R-INIT-1).
//
// Both names are checked before a directory is created, and so is
// `directory`'s path (turbo-collection-core-spec.md R-CLI-18, R-CLI-20);
// `directory` itself is checked before a file is written. Its configuration
// file is written first, since that is what makes a directory a copy, and its
// ignore file after (parallel-safety-spec.md R-PARALLEL-2).
export function initializeTc({
  directory,
  collectionName: givenCollectionName,
  copyName: givenCopyName,
}: InitArgs): TcConfig {
  const collectionName = collectionNameFor(directory, givenCollectionName);
  const copyName = copyNameFor(givenCopyName);
  const directoryPath = path.resolve(directory);
  ensureNoLinkInPath(directoryPath);
  ensureNotInsideCopy(directoryPath);
  createDirectoryIfMissing(directoryPath);
  ensureDirectoryHoldsNoFiles(directoryPath);

  // Init generates its new collection's ID (R-INIT-4), which Node writes in
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
    toString: () => `Wrote ${configurationFile}: ${JSON.stringify(tcConfig)}`,
  });

  // Init's starter ignore file is copied byte for byte, so what a copy holds
  // does not depend on which operating system made it (R-CLI-15). It is never
  // copied over a file already there.
  copyFileSync(
    StarterIgnoreFileUrl,
    path.join(directoryPath, ".tcignore"),
    constants.COPYFILE_EXCL,
  );

  // What init made, so that a plain init says what it did (logging-spec.md
  // R-LOG-17). That `configuration` entry above holds this too, as fields.
  logger.log(
    `Made ${directoryPath} a copy named "${copyName}", of a new collection named "${collectionName}"`,
  );
  return tcConfig;
}
