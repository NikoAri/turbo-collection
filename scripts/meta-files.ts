import { createHash } from "node:crypto";
import {
  closeSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeSync,
} from "node:fs";
import path from "node:path";

import { TcError } from "./helpers/tc-error.ts";
import { configurationFileOf } from "./paths.ts";
import { MetaFileSpecVersion, TurboCollectionSpecVersion } from "./versions.ts";

// Meta files (meta-file-spec.md): a copy's configuration file, a directory's
// manifest, and receipt files.

// A copy's configuration file (R-MFILE-18).
export type TcConfig = {
  version: string;
  collectionId: string;
  collectionName: string;
  copyName: string;
};

// A character a copy's name cannot hold: a control character, or one that an
// operating system refuses in a filename (R-MFILE-19).
export const CharacterNotInCopyName = /[\p{Cc}<>:"\/\\|?*]/u;

// A version 4 UUID in its text form, in lower case, as a collectionId is
// (R-MFILE-18).
const CollectionIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// A SHA-256 checksum in lower-case hexadecimal (R-MFILE-10).
const ChecksumPattern = /^[0-9a-f]{64}$/;

// `directory`'s `.turbo-collection/` directory, which holds its meta files
// (R-MFILE-2).
export function metaDirectoryOf(directory: string): string {
  return path.join(directory, ".turbo-collection");
}

// A JSON meta file's text: each field and each element on a line of its own
// (R-MFILE-27).
function jsonTextOf(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

// Writes `text` to `file`, opened with `flag`, and has it put on its drive
// before returning, so that what is written after it is written
// after a file that is complete (turbo-collection-spec.md R-TGT-13,
// verify-spec.md R-REC-5).
function writeFileToDrive(file: string, text: string, flag: string): void {
  const descriptor = openSync(file, flag);
  try {
    writeSync(descriptor, text);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

const isString = (value: unknown): value is string => typeof value === "string";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// An object read from JSON meta file `file`. A file that is not a JSON
// document holding an object, or that states a version this code does not
// recognize, is an error naming it (R-MFILE-7).
function readJsonMetaFile(file: string): Record<string, unknown> {
  const text = readFileSync(file, "utf8");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    throw new TcError(
      `"${file}" is not a JSON document, so Turbo-Collection does not read it. It may have been cut short as it was written.`,
      { cause: e },
    );
  }
  if (!isObject(value)) {
    throw new TcError(
      `"${file}" holds no JSON object, so Turbo-Collection does not read it.`,
    );
  }
  const version = fieldOf(file, value, "version", isString, "a string");
  if (version !== MetaFileSpecVersion) {
    throw new TcError(
      `"${file}" states version ${version}, which this Turbo-Collection does not recognize, so it does not read it.`,
    );
  }
  return value;
}

// `object`'s field `field`, read from `file`, where `isType` holds of it.
// Where it does not, `file` lacks a field its requirement lists, which
// is an error naming it (R-MFILE-7).
function fieldOf<T>(
  file: string,
  object: Record<string, unknown>,
  field: string,
  isType: (value: unknown) => value is T,
  typeName: string,
): T {
  const value = object[field];
  if (!isType(value)) {
    throw new TcError(
      `"${file}" lacks the field "${field}" as ${typeName}, which meta-file-spec.md requires of it, so Turbo-Collection does not read it.`,
    );
  }
  return value;
}

// Reads `copyRoot`'s configuration file, and checks each field (R-MFILE-18,
// R-MFILE-19). A field that is missing or not valid is an error.
export function readConfigurationFile(copyRoot: string): TcConfig {
  const file = configurationFileOf(copyRoot);
  const object = readJsonMetaFile(file);
  const collectionId = fieldOf(
    file,
    object,
    "collectionId",
    isString,
    "a string",
  );
  const collectionName = fieldOf(
    file,
    object,
    "collectionName",
    isString,
    "a string",
  );
  const copyName = fieldOf(file, object, "copyName", isString, "a string");

  if (!CollectionIdPattern.test(collectionId)) {
    throw new TcError(
      `"${file}" states the collectionId "${collectionId}", which is not a version 4 UUID in lower case.`,
    );
  }
  if (collectionName === "") {
    throw new TcError(`"${file}" states an empty collectionName.`);
  }
  if (
    copyName === "" ||
    CharacterNotInCopyName.test(copyName) ||
    copyName !== copyName.normalize("NFC")
  ) {
    throw new TcError(
      `"${file}" states the copyName "${copyName}", which is not a valid name for a copy.`,
    );
  }

  return {
    version: MetaFileSpecVersion,
    collectionId,
    collectionName,
    copyName,
  };
}

// What placed a directory's content: a layout or an import source, by
// identifier and version, as its specification declares them (R-MFILE-9).
export type SpecificationStamp = {
  specId: string;
  version: string;
  [field: string]: unknown;
};

// A manifest's entry for one file (R-MFILE-10).
export type ManifestEntry = {
  file: string;
  size: number;
  checksum: string;
  [field: string]: unknown;
};

// A directory's manifest (R-MFILE-8, R-MFILE-9). A field this code does not
// know is kept as it was read, so a rewrite keeps it too (R-MFILE-5).
export type Manifest = {
  version: string;
  layout: SpecificationStamp;
  importSource: SpecificationStamp;
  checksumAlgorithm: string;
  files: ManifestEntry[];
  [field: string]: unknown;
};

const isStamp = (value: unknown): value is SpecificationStamp =>
  isObject(value) && isString(value.specId) && isString(value.version);

const isEntry = (value: unknown): value is ManifestEntry =>
  isObject(value) &&
  isString(value.file) &&
  Number.isSafeInteger(value.size) &&
  (value.size as number) >= 0 &&
  isString(value.checksum) &&
  ChecksumPattern.test(value.checksum);

const isEntryList = (value: unknown): value is ManifestEntry[] =>
  Array.isArray(value) && value.every(isEntry);

// `directory`'s manifest.
function manifestFileOf(directory: string): string {
  return path.join(metaDirectoryOf(directory), "manifest.json");
}

// Reads and checks `directory`'s manifest, or returns undefined where
// that directory has none (R-MFILE-7, R-MFILE-9, R-MFILE-10).
export function readManifest(directory: string): Manifest | undefined {
  const file = manifestFileOf(directory);
  if (lstatSync(file, { throwIfNoEntry: false }) === undefined) {
    return undefined;
  }
  const object = readJsonMetaFile(file);
  const stamp = "an object holding specId and version";
  fieldOf(file, object, "layout", isStamp, stamp);
  fieldOf(file, object, "importSource", isStamp, stamp);
  const algorithm = fieldOf(
    file,
    object,
    "checksumAlgorithm",
    isString,
    "a string",
  );
  fieldOf(
    file,
    object,
    "files",
    isEntryList,
    "a list of entries, each holding file, size and a SHA-256 checksum",
  );
  if (algorithm !== "SHA-256") {
    throw new TcError(
      `"${file}" states the checksum algorithm ${algorithm}, which this Turbo-Collection does not recognize, so it does not read it.`,
    );
  }
  return object as Manifest;
}

// Writes `manifest` as `directory`'s manifest, its entries in R-MFILE-12's
// order, making a directory for its meta files where needed.
export function writeManifest(directory: string, manifest: Manifest): void {
  const files = [...manifest.files].sort((a, b) =>
    compareManifestNames(a.file, b.file),
  );
  mkdirSync(metaDirectoryOf(directory), { recursive: true });
  writeFileToDrive(
    manifestFileOf(directory),
    jsonTextOf({ ...manifest, files }),
    "w",
  );
}

// Orders two names in a manifest (R-MFILE-12): with letters A to Z folded
// to lower case, then, where they are equal so, as they are, each by Unicode
// code point and by no computer's language.
export function compareManifestNames(a: string, b: string): number {
  const fold = (name: string) =>
    name.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
  return compareByCodePoint(fold(a), fold(b)) || compareByCodePoint(a, b);
}

// Orders two strings by Unicode code point. Comparing them with `<` would
// order them by UTF-16 code unit, which differs above U+FFFF.
function compareByCodePoint(a: string, b: string): number {
  const aCodePoints = Array.from(a, (character) => character.codePointAt(0)!);
  const bCodePoints = Array.from(b, (character) => character.codePointAt(0)!);
  const length = Math.min(aCodePoints.length, bCodePoints.length);
  for (let index = 0; index < length; index++) {
    if (aCodePoints[index] !== bCodePoints[index]) {
      return aCodePoints[index]! - bCodePoints[index]!;
    }
  }
  return aCodePoints.length - bCodePoints.length;
}

// A content digest over files whose checksums are `checksums` (R-MFILE-15).
export function contentDigestOf(checksums: readonly string[]): string {
  return createHash("sha256")
    .update([...checksums].sort().join("\n"))
    .digest("hex");
}

// Writes a receipt file of `directory` for run `runId` and copy `copyName`:
// an arrival file or an error file holding `fields` after those every
// receipt file holds (R-MFILE-13, R-MFILE-14, R-MFILE-16). A
// receipt file is never written over, so one already at its path is an error.
export function writeReceiptFile(
  directory: string,
  kind: "arrival" | "error",
  runId: string,
  copyName: string,
  fields: Record<string, unknown>,
): void {
  mkdirSync(metaDirectoryOf(directory), { recursive: true });
  const file = path.join(
    metaDirectoryOf(directory),
    `receipt-${runId}-${copyName}.${kind}.json`,
  );
  const receipt = {
    version: MetaFileSpecVersion,
    tcSpecVersion: TurboCollectionSpecVersion,
    runId,
    copyName,
    ...fields,
  };
  writeFileToDrive(file, jsonTextOf(receipt), "wx");
}
