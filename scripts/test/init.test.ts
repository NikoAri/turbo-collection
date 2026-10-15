import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { test, type TestContext } from "node:test";
import { URL } from "node:url";

import {
  collectionNameFor,
  copyNameFor,
  createDirectoryIfMissing,
  ensureDirectoryHoldsNoFiles,
  initializeTc,
} from "../init.ts";

// A new, empty directory under the system's temporary directory, removed when the test ends.
function temporaryDirectory(t: TestContext): string {
  const directory = mkdtempSync(path.join(tmpdir(), "turbo-collection-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

// Writes a file at `relativePath` under `directory`, creating the directories it needs.
function writeFileUnder(directory: string, relativePath: string): void {
  const file = path.join(directory, relativePath);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, "content");
}

test("R-CLI-11: a directory that holds nothing passes", (t) => {
  ensureDirectoryHoldsNoFiles(temporaryDirectory(t));
});

test("R-CLI-11: a directory that holds a file is an error that names the file", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "photo.jpg");

  assert.throws(() => ensureDirectoryHoldsNoFiles(directory), /"photo\.jpg"/);
});

test("R-CLI-11: a file at any depth is an error", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "2019/trip/photo.jpg");

  assert.throws(
    () => ensureDirectoryHoldsNoFiles(directory),
    /"2019\/trip\/photo\.jpg"/,
  );
});

test("R-CLI-11: a file that a starter pattern matches does not stand in the way", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, ".DS_Store");
  writeFileUnder(directory, "2019/Thumbs.db");

  ensureDirectoryHoldsNoFiles(directory);
});

test("R-CLI-11: a directory that holds no file does not stand in the way", (t) => {
  const directory = temporaryDirectory(t);
  mkdirSync(path.join(directory, "2019", "trip"), { recursive: true });

  ensureDirectoryHoldsNoFiles(directory);
});

test("R-CLI-11: a directory that a starter pattern ignores is not looked into", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "__MACOSX/2019/photo.jpg");

  ensureDirectoryHoldsNoFiles(directory);
});

test("R-CLI-11: a .tcignore already in the directory is a file like any other", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, ".tcignore");

  assert.throws(() => ensureDirectoryHoldsNoFiles(directory), /"\.tcignore"/);
});

test("R-CLI-11: a directory that does not exist is created, empty", (t) => {
  const directory = path.join(temporaryDirectory(t), "new-copy");

  createDirectoryIfMissing(directory);

  assert.equal(statSync(directory).isDirectory(), true);
  assert.deepEqual(readdirSync(directory), []);
});

test("R-CLI-11: the directories above it that do not exist are created too", (t) => {
  const directory = path.join(temporaryDirectory(t), "a", "b", "c");

  createDirectoryIfMissing(directory);

  assert.equal(statSync(directory).isDirectory(), true);
});

test("R-CLI-11: a directory that exists is left as it is", (t) => {
  const directory = path.join(temporaryDirectory(t), "existing");
  mkdirSync(directory);
  writeFileSync(path.join(directory, "photo.jpg"), "a photograph");

  createDirectoryIfMissing(directory);

  assert.deepEqual(readdirSync(directory), ["photo.jpg"]);
  assert.equal(
    readFileSync(path.join(directory, "photo.jpg"), "utf8"),
    "a photograph",
  );
});

// "Photo" in Cyrillic letters, and "photograph" in Japanese.
const PhotoInCyrillic = String.fromCodePoint(0x424, 0x43e, 0x442, 0x43e);
const PhotographInJapanese = String.fromCodePoint(0x5199, 0x771f);

test("R-CLI-11: a collection's name given on the command line is taken as given", () => {
  assert.equal(
    collectionNameFor("My Photos", "Family Photos"),
    "Family Photos",
  );
});

test("R-CLI-11: with no name given, the collection takes its directory's name, unchanged", () => {
  for (const directoryName of [
    "Photos",
    "My Photos",
    "photos_2019",
    "Photos (2019)",
    "Été 2019",
    PhotoInCyrillic,
    PhotographInJapanese,
  ]) {
    assert.equal(collectionNameFor(directoryName, undefined), directoryName);
  }
});

test("R-CLI-11: the last segment of the path is the directory's name", () => {
  assert.equal(
    collectionNameFor("Family Archive/2019 Trip", undefined),
    "2019 Trip",
  );
});

test("R-CLI-11: the current directory gives its own name", () => {
  assert.equal(
    collectionNameFor(".", undefined),
    collectionNameFor(process.cwd(), undefined),
  );
});

test("R-CLI-11: the root of a drive has no name to take, which is an error asking for one", () => {
  const root = path.parse(process.cwd()).root;

  assert.throws(
    () => collectionNameFor(root, undefined),
    /Give one with --name/,
  );
});

test("R-MFILE-18: an empty collection name is an error", () => {
  assert.throws(
    () => collectionNameFor(".", ""),
    /A collection's name cannot be empty/,
  );
});

test("R-CLI-11: with no copy name given, the copy is main", () => {
  assert.equal(copyNameFor(undefined), "main");
});

test("R-MFILE-19: a copy's name may be in any script, and keeps its case", () => {
  for (const name of [
    "off-site",
    "Off-site at Mom's",
    PhotoInCyrillic,
    PhotographInJapanese,
  ]) {
    assert.equal(copyNameFor(name), name);
  }
});

test("R-MFILE-19: a copy's name is converted to Unicode Normalization Form C", () => {
  // "Café" with its accent as a combining character, and as one letter.
  assert.equal(copyNameFor("Café"), "Café");
});

test("R-MFILE-19: a copy's name holding a control character or a character a filename refuses is an error", () => {
  for (const name of [
    "a<b",
    "a>b",
    "a:b",
    'a"b',
    "a/b",
    "a\\b",
    "a|b",
    "a?b",
    "a*b",
    "a\tb",
    "a\nb",
    "a\u007fb",
  ]) {
    assert.throws(() => copyNameFor(name), /cannot be a copy's name/);
  }
});

test("R-MFILE-18: an empty copy name is an error", () => {
  assert.throws(() => copyNameFor(""), /cannot be a copy's name/);
});

// What `directory` holds at every depth, as sorted paths with `/` between their segments.
function listUnder(directory: string): string[] {
  return readdirSync(directory, { recursive: true, encoding: "utf8" })
    .map((entry) => entry.replaceAll("\\", "/"))
    .sort();
}

// The path of the configuration file of a copy in `directory` (meta-file-spec.md R-MFILE-17).
function configurationFileOf(directory: string): string {
  return path.join(
    directory,
    ".turbo-collection",
    "turbo-collection-config.json",
  );
}

// A version 4 UUID in its text form, in lower case (meta-file-spec.md R-MFILE-18).
const CollectionIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test("R-CLI-11: init writes a configuration file and the starter ignore file, and nothing else", (t) => {
  const directory = path.join(temporaryDirectory(t), "Family Photos");

  const tcConfig = initializeTc(directory, undefined, undefined);

  assert.equal(tcConfig.collectionName, "Family Photos");
  assert.equal(tcConfig.copyName, "main");
  assert.deepEqual(listUnder(directory), [
    ".tcignore",
    ".turbo-collection",
    ".turbo-collection/turbo-collection-config.json",
  ]);
});

test("R-MFILE-18, R-MFILE-27: the configuration file states its version, the collection's ID and name, and the copy's name, a field to a line", (t) => {
  const directory = path.join(temporaryDirectory(t), "Family Photos");

  const { collectionId } = initializeTc(directory, undefined, undefined);

  assert.match(collectionId, CollectionIdPattern);
  assert.equal(
    readFileSync(configurationFileOf(directory), "utf8"),
    `{\n  "version": "0.1.0-draft",\n  "collectionId": "${collectionId}",\n  "collectionName": "Family Photos",\n  "copyName": "main"\n}\n`,
  );
});

test("R-MFILE-19: each init generates a new collectionId", (t) => {
  const first = initializeTc(
    path.join(temporaryDirectory(t), "photos"),
    undefined,
    undefined,
  );
  const second = initializeTc(
    path.join(temporaryDirectory(t), "photos"),
    undefined,
    undefined,
  );

  assert.notEqual(first.collectionId, second.collectionId);
});

test("R-CLI-11: names given on the command line are written as the collection's and the copy's", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");

  initializeTc(directory, "Family Photos", "desk");

  const tcConfig = JSON.parse(
    readFileSync(configurationFileOf(directory), "utf8"),
  );
  assert.equal(tcConfig.collectionName, "Family Photos");
  assert.equal(tcConfig.copyName, "desk");
});

test("R-CLI-11: a name that is not valid is an error before anything is written", (t) => {
  const directory = path.join(temporaryDirectory(t), "new-copy");

  assert.throws(
    () => initializeTc(directory, undefined, "a/b"),
    /cannot be a copy's name/,
  );
  assert.throws(() => statSync(directory), /ENOENT/);
});

test("R-CLI-15: the ignore file is the starter file byte for byte, with no carriage return", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");

  initializeTc(directory, undefined, undefined);

  const written = readFileSync(path.join(directory, ".tcignore"));
  assert.deepEqual(
    written,
    readFileSync(new URL("../templates/default.tcignore", import.meta.url)),
  );
  assert.equal(written.includes("\r"), false);
});

test("R-CLI-11: an init of a directory that is already a copy is an error and changes nothing", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");
  initializeTc(directory, undefined, "main");
  const holds = listUnder(directory);
  const configuration = readFileSync(configurationFileOf(directory), "utf8");

  assert.throws(
    () => initializeTc(directory, undefined, "other"),
    /holds a file/,
  );

  assert.deepEqual(listUnder(directory), holds);
  assert.equal(
    readFileSync(configurationFileOf(directory), "utf8"),
    configuration,
  );
});

test("R-CLI-11: an init of a folder of photographs is an error and writes nothing", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "2019/photo.jpg");

  assert.throws(
    () => initializeTc(directory, undefined, undefined),
    /holds a file/,
  );
  assert.deepEqual(listUnder(directory), ["2019", "2019/photo.jpg"]);
});
