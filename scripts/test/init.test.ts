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
import { test, type TestContext } from "node:test";
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
import type { LogEntry, Logger } from "../run.ts";

// A new, empty directory under the system's temporary directory, removed when the test ends. Its
// path is resolved, since on a Mac the temporary directory lies behind a link, and a path through
// a link is an error (turbo-collection-core-spec.md R-CLI-20).
function temporaryDirectory(t: TestContext): string {
  const directory = realpathSync(
    mkdtempSync(path.join(tmpdir(), "turbo-collection-test-")),
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

// Writes a file at `relativePath` under `directory`, creating the directories it needs.
function writeFileUnder(directory: string, relativePath: string): void {
  const file = path.join(directory, relativePath);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, "content");
}

// A logger that keeps each entry it is given, in order.
function collectingLogger(): Logger & { entries: LogEntry[] } {
  const entries: LogEntry[] = [];
  return { entries, log: (entry) => entries.push(entry) };
}

// A logger that keeps nothing.
const silentLogger: Logger = { log: () => {} };

// The files that `logger` was told stop init, in order.
function filesNotIgnored(logger: { entries: LogEntry[] }): unknown[] {
  return logger.entries
    .filter((entry) => entry.event === "file-not-ignored")
    .map((entry) => entry.file);
}

test("R-INIT-3: a directory that holds nothing passes", (t) => {
  ensureDirectoryHoldsNoFiles(temporaryDirectory(t), silentLogger);
});

test("R-INIT-3: a directory that holds a file is an error, and the file is logged as a failure", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "photo.jpg");
  const logger = collectingLogger();

  assert.throws(
    () => ensureDirectoryHoldsNoFiles(directory, logger),
    /holds a file that the starter \.tcignore does not ignore/,
  );
  assert.deepEqual(filesNotIgnored(logger), ["photo.jpg"]);
  assert.equal(
    logger.entries.find((entry) => entry.event === "file-not-ignored")?.outcome,
    "failure",
  );
});

test("R-INIT-3: a file at any depth is an error", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "2019/trip/photo.jpg");
  const logger = collectingLogger();

  assert.throws(() => ensureDirectoryHoldsNoFiles(directory, logger));
  assert.deepEqual(filesNotIgnored(logger), ["2019/trip/photo.jpg"]);
});

test("R-INIT-3: every file that stops init is reported, not only the first", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "a.jpg");
  writeFileUnder(directory, "2019/b.jpg");
  writeFileUnder(directory, "2019/trip/c.jpg");
  writeFileUnder(directory, "2019/.DS_Store");
  const logger = collectingLogger();

  assert.throws(
    () => ensureDirectoryHoldsNoFiles(directory, logger),
    /holds 3 files that the starter \.tcignore does not ignore/,
  );
  assert.deepEqual(filesNotIgnored(logger).sort(), [
    "2019/b.jpg",
    "2019/trip/c.jpg",
    "a.jpg",
  ]);
});

test("R-INIT-3: a file that a starter pattern matches does not stand in the way", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, ".DS_Store");
  writeFileUnder(directory, "2019/Thumbs.db");

  ensureDirectoryHoldsNoFiles(directory, silentLogger);
});

test("R-INIT-3: a directory that holds no file does not stand in the way", (t) => {
  const directory = temporaryDirectory(t);
  mkdirSync(path.join(directory, "2019", "trip"), { recursive: true });

  ensureDirectoryHoldsNoFiles(directory, silentLogger);
});

test("R-INIT-3: a directory that a starter pattern ignores is not looked into", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "__MACOSX/2019/photo.jpg");

  ensureDirectoryHoldsNoFiles(directory, silentLogger);
});

test("R-INIT-3: a .tcignore already in the directory is a file like any other", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, ".tcignore");
  const logger = collectingLogger();

  assert.throws(() => ensureDirectoryHoldsNoFiles(directory, logger));
  assert.deepEqual(filesNotIgnored(logger), [".tcignore"]);
});

test("R-LOG-14: a verbose ignore entry counts, for every starter pattern, the entries it ignored", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, ".DS_Store");
  writeFileUnder(directory, "2019/.DS_Store");
  writeFileUnder(directory, "2019/Thumbs.db");
  writeFileUnder(directory, "__MACOSX/2019/a.jpg");
  writeFileUnder(directory, "__MACOSX/2019/b.jpg");
  const logger = collectingLogger();

  ensureDirectoryHoldsNoFiles(directory, logger);

  const [entry] = logger.entries;
  assert.equal(entry?.event, "ignore");
  assert.equal(entry?.verbose, true);
  assert.equal(entry?.path, directory);
  const counts = new Map(
    (entry?.patterns as { pattern: string; count: number }[]).map(
      ({ pattern, count }) => [pattern, count],
    ),
  );
  assert.equal(counts.get(".DS_Store"), 2);
  assert.equal(counts.get("Thumbs.db"), 1);
  // An ignored directory counts once, and what it holds is not looked at.
  assert.equal(counts.get("__MACOSX/"), 1);
  // A pattern that matched nothing is listed with a count of 0.
  assert.equal(counts.get("$RECYCLE.BIN/"), 0);
});

test("R-LOG-14: the ignore entry comes before the files that stop init", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "photo.jpg");
  const logger = collectingLogger();

  assert.throws(() => ensureDirectoryHoldsNoFiles(directory, logger));
  assert.deepEqual(
    logger.entries.map((entry) => entry.event),
    ["ignore", "file-not-ignored"],
  );
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

test("R-INIT-1: init writes a configuration file and the starter ignore file, and nothing else", (t) => {
  const directory = path.join(temporaryDirectory(t), "Family Photos");

  const tcConfig = initializeTc(directory, undefined, undefined, silentLogger);

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

  const { collectionId } = initializeTc(
    directory,
    undefined,
    undefined,
    silentLogger,
  );

  assert.match(collectionId, CollectionIdPattern);
  assert.equal(
    readFileSync(configurationFileOf(directory), "utf8"),
    `{\n  "version": "0.1.0-draft",\n  "collectionId": "${collectionId}",\n  "collectionName": "Family Photos",\n  "copyName": "main"\n}\n`,
  );
});

test("R-INIT-4: each init generates a new collectionId", (t) => {
  const first = initializeTc(
    path.join(temporaryDirectory(t), "photos"),
    undefined,
    undefined,
    silentLogger,
  );
  const second = initializeTc(
    path.join(temporaryDirectory(t), "photos"),
    undefined,
    undefined,
    silentLogger,
  );

  assert.notEqual(first.collectionId, second.collectionId);
});

test("R-INIT-4: names given on the command line are written as the collection's and the copy's", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");

  initializeTc(directory, "Family Photos", "desk", silentLogger);

  const tcConfig = JSON.parse(
    readFileSync(configurationFileOf(directory), "utf8"),
  );
  assert.equal(tcConfig.collectionName, "Family Photos");
  assert.equal(tcConfig.copyName, "desk");
});

test("R-INIT-4: a name that is not valid is an error before anything is written", (t) => {
  const directory = path.join(temporaryDirectory(t), "new-copy");

  assert.throws(
    () => initializeTc(directory, undefined, "a/b", silentLogger),
    /cannot be a copy's name/,
  );
  assert.throws(() => statSync(directory), /ENOENT/);
});

test("R-CLI-15: the ignore file is the starter file byte for byte, with no carriage return", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");

  initializeTc(directory, undefined, undefined, silentLogger);

  const written = readFileSync(path.join(directory, ".tcignore"));
  assert.deepEqual(
    written,
    readFileSync(new URL("../templates/default.tcignore", import.meta.url)),
  );
  assert.equal(written.includes("\r"), false);
});

test("R-INIT-3: an init of a directory that is already a copy is an error and changes nothing", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");
  initializeTc(directory, undefined, "main", silentLogger);
  const holds = listUnder(directory);
  const configuration = readFileSync(configurationFileOf(directory), "utf8");

  assert.throws(
    () => initializeTc(directory, undefined, "other", silentLogger),
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

  assert.throws(
    () => initializeTc(directory, undefined, undefined, silentLogger),
    /holds a file/,
  );
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
    /another run made it a copy first/,
  );
  assert.equal(readFileSync(configurationFileOf(directory), "utf8"), "content");
});

test("R-LOG-13: init logs the configuration it wrote, and where, as a verbose entry", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");
  const logger = collectingLogger();

  const tcConfig = initializeTc(directory, "Family Photos", undefined, logger);

  const entry = logger.entries.find((entry) => entry.event === "configuration");
  assert.equal(entry?.verbose, true);
  assert.equal(entry?.path, configurationFileOf(directory));
  assert.deepEqual(entry?.configuration, tcConfig);
});

test("R-LOG-9: init logs the copy it made in an entry that is not verbose", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");
  const logger = collectingLogger();

  initializeTc(directory, "Family Photos", undefined, logger);

  assert.deepEqual(
    logger.entries.map((entry) => entry.event),
    ["ignore", "configuration", "init"],
  );
  const entry = logger.entries.at(-1);
  assert.equal(entry?.verbose, undefined);
  assert.equal(entry?.copyName, "main");
  assert.equal(entry?.collectionName, "Family Photos");
});

test("R-CLI-18: a directory inside a copy is an error, and nothing is made", (t) => {
  const copy = path.join(temporaryDirectory(t), "photos");
  initializeTc(copy, undefined, undefined, silentLogger);
  const holds = listUnder(copy);
  const directory = path.join(copy, "2024", "trip");

  assert.throws(
    () => initializeTc(directory, undefined, undefined, silentLogger),
    /lies inside a copy at/,
  );
  assert.deepEqual(listUnder(copy), holds);
});

test("R-CLI-18: a directory beside a copy is not inside it", (t) => {
  const parent = temporaryDirectory(t);
  initializeTc(path.join(parent, "photos"), undefined, undefined, silentLogger);

  ensureNotInsideCopy(path.join(parent, "photos-2"));
});

test("R-CLI-20: a path through a link is an error that names where it leads, and nothing is made", (t) => {
  const parent = temporaryDirectory(t);
  const target = path.join(parent, "target");
  mkdirSync(target);
  const link = path.join(parent, "link");
  // A junction on Windows, which needs no administrator; a symbolic link elsewhere.
  symlinkSync(target, link, "junction");

  assert.throws(
    () =>
      initializeTc(
        path.join(link, "photos"),
        undefined,
        undefined,
        silentLogger,
      ),
    (error: Error) =>
      error.message.includes(`a link at "${link}"`) &&
      error.message.includes(`"${path.join(target, "photos")}"`),
  );
  assert.deepEqual(readdirSync(target), []);
});
