import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { mock, test, type TestContext } from "node:test";
import { URL } from "node:url";

import {
  collectionNameFor,
  copyNameFor,
  createDirectoryIfMissing,
  ensureDirectoryHoldsNoFiles,
  ensureNotInsideCopy,
  initializeTc,
  writeConfigurationFile,
} from "../init.ts";
import { logEntryOf, logger, type LogEntry } from "../logger.ts";

// A new, empty directory under the system's temporary directory, removed when
// the test ends. Its path is resolved, since on a Mac the temporary directory
// lies behind a link, and a path through a link is an error
// (turbo-collection-core-spec.md R-CLI-20).
function temporaryDirectory(t: TestContext): string {
  const directory = realpathSync(
    mkdtempSync(path.join(tmpdir(), "turbo-collection-test-")),
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

// Writes a file at `relativePath` under `directory`, creating the directories
// it needs.
function writeFileUnder(directory: string, relativePath: string): void {
  const file = path.join(directory, relativePath);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, "content");
}

// What these tests make init log is shown nowhere, unless a test collects it.
mock.method(logger, "log", () => {});

// The entries `logger` is given during the test `t`, in order.
function collectEntries(t: TestContext): LogEntry[] {
  const entries: LogEntry[] = [];
  t.mock.method(logger, "log", (entry: LogEntry | string) =>
    entries.push(logEntryOf(entry)),
  );
  return entries;
}

// The files that `entries` say stop init, in order.
function filesNotIgnored(entries: LogEntry[]): unknown[] {
  return entries
    .filter((entry) => entry.event === "file-not-ignored")
    .map((entry) => entry.file);
}

test("R-INIT-3: a directory that holds nothing passes", (t) => {
  ensureDirectoryHoldsNoFiles(temporaryDirectory(t));
});

test("R-INIT-3: a directory that holds a file is an error, and the file is logged as a failure", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "photo.jpg");
  const entries = collectEntries(t);

  assert.throws(
    () => ensureDirectoryHoldsNoFiles(directory),
    /holds a file that the starter \.tcignore does not ignore/,
  );
  assert.deepEqual(filesNotIgnored(entries), ["photo.jpg"]);
  assert.equal(
    entries.find((entry) => entry.event === "file-not-ignored")?.outcome,
    "failure",
  );
});

test("R-INIT-3: a file at any depth is an error", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "2019/trip/photo.jpg");
  const entries = collectEntries(t);

  assert.throws(() => ensureDirectoryHoldsNoFiles(directory));
  assert.deepEqual(filesNotIgnored(entries), ["2019/trip/photo.jpg"]);
});

test("R-INIT-3: every file that stops init is reported, not only the first", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "a.jpg");
  writeFileUnder(directory, "2019/b.jpg");
  writeFileUnder(directory, "2019/trip/c.jpg");
  writeFileUnder(directory, "2019/.DS_Store");
  const entries = collectEntries(t);

  assert.throws(
    () => ensureDirectoryHoldsNoFiles(directory),
    /holds 3 files that the starter \.tcignore does not ignore/,
  );
  assert.deepEqual(filesNotIgnored(entries).sort(), [
    "2019/b.jpg",
    "2019/trip/c.jpg",
    "a.jpg",
  ]);
});

test("R-INIT-3: a file that a starter pattern matches does not stand in the way", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, ".DS_Store");
  writeFileUnder(directory, "2019/Thumbs.db");

  ensureDirectoryHoldsNoFiles(directory);
});

test("R-INIT-3: a directory that holds no file does not stand in the way", (t) => {
  const directory = temporaryDirectory(t);
  mkdirSync(path.join(directory, "2019", "trip"), { recursive: true });

  ensureDirectoryHoldsNoFiles(directory);
});

test("R-INIT-3: a directory that a starter pattern ignores is not looked into", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "__MACOSX/2019/photo.jpg");

  ensureDirectoryHoldsNoFiles(directory);
});

test("R-INIT-3: a .tcignore already in the directory is a file like any other", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, ".tcignore");
  const entries = collectEntries(t);

  assert.throws(() => ensureDirectoryHoldsNoFiles(directory));
  assert.deepEqual(filesNotIgnored(entries), [".tcignore"]);
});

test("R-INIT-2: a directory that does not exist is created, empty", (t) => {
  const directory = path.join(temporaryDirectory(t), "new-copy");

  createDirectoryIfMissing(directory);

  assert.equal(statSync(directory).isDirectory(), true);
  assert.deepEqual(readdirSync(directory), []);
});

test("R-INIT-2: the directories above it that do not exist are created too", (t) => {
  const directory = path.join(temporaryDirectory(t), "a", "b", "c");

  createDirectoryIfMissing(directory);

  assert.equal(statSync(directory).isDirectory(), true);
});

test("R-INIT-2: a directory that exists is left as it is", (t) => {
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

test("R-INIT-4: a collection's name given on the command line is taken as given", () => {
  assert.equal(
    collectionNameFor("My Photos", "Family Photos"),
    "Family Photos",
  );
});

test("R-INIT-4: with no name given, the collection takes its directory's name, unchanged", () => {
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

test("R-INIT-4: the last segment of the path is the directory's name", () => {
  assert.equal(
    collectionNameFor("Family Archive/2019 Trip", undefined),
    "2019 Trip",
  );
});

test("R-INIT-4: the current directory gives its own name", () => {
  assert.equal(
    collectionNameFor(".", undefined),
    collectionNameFor(process.cwd(), undefined),
  );
});

test("R-INIT-4: the root of a drive has no name to take, which is an error asking for one", () => {
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

test("R-INIT-4: with no copy name given, the copy is main", () => {
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
  assert.equal(copyNameFor("Café"), "Café");
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

// What `directory` holds at every depth, as sorted paths with `/` between
// their segments.
function listUnder(directory: string): string[] {
  return readdirSync(directory, { recursive: true, encoding: "utf8" })
    .map((entry) => entry.replaceAll("\\", "/"))
    .sort();
}

// The path of the configuration file of a copy in `directory`
// (meta-file-spec.md R-MFILE-17).
function configurationFileOf(directory: string): string {
  return path.join(
    directory,
    ".turbo-collection",
    "turbo-collection-config.json",
  );
}

// A version 4 UUID in its text form, in lower case (meta-file-spec.md
// R-MFILE-18).
const CollectionIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test("R-INIT-1: init writes a configuration file and the starter ignore file, and nothing else", (t) => {
  const directory = path.join(temporaryDirectory(t), "Family Photos");

  const tcConfig = initializeTc({ directory });

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

  const { collectionId } = initializeTc({ directory });

  assert.match(collectionId, CollectionIdPattern);
  assert.equal(
    readFileSync(configurationFileOf(directory), "utf8"),
    `{\n  "version": "0.1.0-draft",\n  "collectionId": "${collectionId}",\n  "collectionName": "Family Photos",\n  "copyName": "main"\n}\n`,
  );
});

test("R-INIT-4: each init generates a new collectionId", (t) => {
  const first = initializeTc({
    directory: path.join(temporaryDirectory(t), "photos"),
  });
  const second = initializeTc({
    directory: path.join(temporaryDirectory(t), "photos"),
  });

  assert.notEqual(first.collectionId, second.collectionId);
});

test("R-INIT-4: names given on the command line are written as the collection's and the copy's", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");

  initializeTc({
    directory,
    collectionName: "Family Photos",
    copyName: "desk",
  });

  const tcConfig = JSON.parse(
    readFileSync(configurationFileOf(directory), "utf8"),
  );
  assert.equal(tcConfig.collectionName, "Family Photos");
  assert.equal(tcConfig.copyName, "desk");
});

test("R-INIT-4: a name that is not valid is an error before anything is written", (t) => {
  const directory = path.join(temporaryDirectory(t), "new-copy");

  assert.throws(
    () => initializeTc({ directory, copyName: "a/b" }),
    /cannot be a copy's name/,
  );
  assert.throws(() => statSync(directory), /ENOENT/);
});

test("R-CLI-15: the ignore file is the starter file byte for byte, with no carriage return", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");

  initializeTc({ directory });

  const written = readFileSync(path.join(directory, ".tcignore"));
  assert.deepEqual(
    written,
    readFileSync(new URL("../templates/default.tcignore", import.meta.url)),
  );
  assert.equal(written.includes("\r"), false);
});

test("R-INIT-3: an init of a directory that is already a copy is an error and changes nothing", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");
  initializeTc({ directory, copyName: "main" });
  const holds = listUnder(directory);
  const configuration = readFileSync(configurationFileOf(directory), "utf8");

  assert.throws(
    () => initializeTc({ directory, copyName: "other" }),
    /holds 2 files/,
  );

  assert.deepEqual(listUnder(directory), holds);
  assert.equal(
    readFileSync(configurationFileOf(directory), "utf8"),
    configuration,
  );
});

test("R-INIT-3: an init of a folder of photographs is an error and writes nothing", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "2019/photo.jpg");

  assert.throws(() => initializeTc({ directory }), /holds a file/);
  assert.deepEqual(listUnder(directory), ["2019", "2019/photo.jpg"]);
});

test("R-PARALLEL-3: a configuration file that appears before init writes one is an error, and is left as it is", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, ".turbo-collection/turbo-collection-config.json");
  const tcConfig = {
    version: "0.1.0-draft",
    collectionId: "3f2a9c1e-5b7d-4e8a-9c2f-1d6b8e4a7c30",
    collectionName: "photos",
    copyName: "main",
  };

  assert.throws(
    () => writeConfigurationFile(directory, tcConfig),
    /Another run made .* a copy first/,
  );
  assert.equal(readFileSync(configurationFileOf(directory), "utf8"), "content");
});

test("R-LOG-13: init logs the configuration it wrote, and where, as a verbose entry", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");
  const entries = collectEntries(t);

  const tcConfig = initializeTc({ directory, collectionName: "Family Photos" });

  const entry = entries.find((entry) => entry.event === "configuration");
  assert.equal(entry?.verbose, true);
  assert.equal(entry?.path, configurationFileOf(directory));
  assert.deepEqual(entry?.configuration, tcConfig);
});

test("R-LOG-17: init says what it made in a message", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");
  const entries = collectEntries(t);

  initializeTc({ directory, collectionName: "Family Photos" });

  assert.deepEqual(
    entries.map((entry) => entry.event),
    ["configuration", "message"],
  );
  assert.equal(
    entries.at(-1)?.message,
    `Made ${directory} a copy named "main", of a new collection named "Family Photos"`,
  );
});

test("R-CLI-18: a directory inside a copy is an error, and nothing is made", (t) => {
  const copy = path.join(temporaryDirectory(t), "photos");
  initializeTc({ directory: copy });
  const holds = listUnder(copy);
  const directory = path.join(copy, "2024", "trip");

  assert.throws(() => initializeTc({ directory }), /lies inside a copy at/);
  assert.deepEqual(listUnder(copy), holds);
});

test("R-CLI-18: a directory beside a copy is not inside it", (t) => {
  const parent = temporaryDirectory(t);
  initializeTc({ directory: path.join(parent, "photos") });

  ensureNotInsideCopy(path.join(parent, "photos-2"));
});

test("R-CLI-20: a path through a link is an error that names where it leads, and nothing is made", (t) => {
  const parent = temporaryDirectory(t);
  const target = path.join(parent, "target");
  mkdirSync(target);
  const link = path.join(parent, "link");
  // A junction on Windows, which needs no administrator; a symbolic
  // link elsewhere.
  symlinkSync(target, link, "junction");

  assert.throws(
    () => initializeTc({ directory: path.join(link, "photos") }),
    (error: Error) =>
      error.message.includes(`a link at "${link}"`) &&
      error.message.includes(`"${path.join(target, "photos")}"`),
  );
  assert.deepEqual(readdirSync(target), []);
});
