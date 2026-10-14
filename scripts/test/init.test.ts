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
  createDirectoryIfMissing,
  ensureDirectoryHoldsNoFiles,
  init,
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

test("R-CLI-11: a name given on the command line is taken as typed", () => {
  assert.equal(collectionNameFor("My Photos", "offsite"), "offsite");
});

test("R-CLI-11: with no name given, the directory's name is taken in lower case, with hyphens", () => {
  for (const [directoryName, expected] of [
    ["Photos", "photos"],
    ["My Photos", "my-photos"],
    ["photos_2019", "photos-2019"],
    ["My_Family Photos", "my-family-photos"],
    ["Photos (2019)", "photos-2019"],
    ["photos.backup", "photos-backup"],
    ["photos - 2019", "photos-2019"],
    ["(2019)", "2019"],
  ] as const) {
    assert.equal(collectionNameFor(directoryName, undefined), expected);
  }
});

test("R-CLI-11: the last segment of the path is the directory's name", () => {
  assert.equal(
    collectionNameFor("Family Archive/2019 Trip", undefined),
    "2019-trip",
  );
});

test("R-CLI-11: the current directory gives its own name", () => {
  assert.equal(
    collectionNameFor(".", undefined),
    collectionNameFor(process.cwd(), undefined),
  );
});

test("R-CLI-11: a directory name that gives no valid name is an error asking for one", () => {
  // Nothing left once converted, "Photo" in Cyrillic letters, and a name with accented letters.
  for (const directoryName of [
    "...",
    String.fromCodePoint(0x424, 0x43e, 0x442, 0x43e),
    "Été 2019",
  ]) {
    assert.throws(
      () => collectionNameFor(directoryName, undefined),
      /Give one with -n/,
    );
  }
});

test("R-CLI-11: the root of a drive has no name to take, which is an error", () => {
  const root = path.parse(process.cwd()).root;

  assert.throws(() => collectionNameFor(root, undefined), /Give one with -n/);
});

test("R-MFILE-19: a given name holds lower case letters, digits and hyphens only", () => {
  assert.equal(collectionNameFor(".", "off-site-2"), "off-site-2");
  for (const name of ["MyPhotos", "my photos", "my_photos", "my.photos"]) {
    assert.throws(
      () => collectionNameFor(".", name),
      /cannot be a copy's name/,
    );
  }
});

test("R-MFILE-18: an empty name is an error", () => {
  assert.throws(() => collectionNameFor(".", ""), /cannot be a copy's name/);
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

test("R-CLI-11: init writes a configuration file and the starter ignore file, and nothing else", (t) => {
  const directory = path.join(temporaryDirectory(t), "Family Photos");

  assert.equal(init(directory, undefined, undefined), "family-photos");

  assert.deepEqual(listUnder(directory), [
    ".tcignore",
    ".turbo-collection",
    ".turbo-collection/turbo-collection-config.json",
  ]);
});

test("R-MFILE-18, R-MFILE-27: the configuration file states its version and the copy's name, a field to a line", (t) => {
  const directory = path.join(temporaryDirectory(t), "Family Photos");

  init(directory, undefined, undefined);

  assert.equal(
    readFileSync(configurationFileOf(directory), "utf8"),
    '{\n  "version": "0.1.0-draft",\n  "collectionName": "family-photos"\n}\n',
  );
});

test("R-CLI-11: a description given is written as the copy's collectionDescription", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");

  init(directory, "main", "The drive in the desk");

  assert.deepEqual(
    JSON.parse(readFileSync(configurationFileOf(directory), "utf8")),
    {
      version: "0.1.0-draft",
      collectionName: "main",
      collectionDescription: "The drive in the desk",
    },
  );
});

test("R-CLI-11: with no description given, or an empty one, none is written", (t) => {
  for (const [folder, description] of [
    ["none-given", undefined],
    ["empty", ""],
  ] as const) {
    const directory = path.join(temporaryDirectory(t), folder);

    init(directory, "main", description);

    assert.deepEqual(
      JSON.parse(readFileSync(configurationFileOf(directory), "utf8")),
      { version: "0.1.0-draft", collectionName: "main" },
    );
  }
});

test("R-CLI-15: the ignore file is the starter file byte for byte, with no carriage return", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");

  init(directory, undefined, undefined);

  const written = readFileSync(path.join(directory, ".tcignore"));
  assert.deepEqual(
    written,
    readFileSync(new URL("../templates/default.tcignore", import.meta.url)),
  );
  assert.equal(written.includes("\r"), false);
});

test("R-CLI-11: an init of a directory that is already a copy is an error and changes nothing", (t) => {
  const directory = path.join(temporaryDirectory(t), "photos");
  init(directory, "main", undefined);
  const holds = listUnder(directory);
  const configuration = readFileSync(configurationFileOf(directory), "utf8");

  assert.throws(() => init(directory, "other", undefined), /holds a file/);

  assert.deepEqual(listUnder(directory), holds);
  assert.equal(
    readFileSync(configurationFileOf(directory), "utf8"),
    configuration,
  );
});

test("R-CLI-11: an init of a folder of photographs is an error and writes nothing", (t) => {
  const directory = temporaryDirectory(t);
  writeFileUnder(directory, "2019/photo.jpg");

  assert.throws(() => init(directory, "main", undefined), /holds a file/);
  assert.deepEqual(listUnder(directory), ["2019", "2019/photo.jpg"]);
});
