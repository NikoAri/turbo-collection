import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";

import {
  compareManifestNames,
  contentDigestOf,
  readConfigurationFile,
  readManifest,
  writeManifest,
  type Manifest,
} from "../meta-files.ts";

// A new, empty directory under `tmpdir()`, removed when test `t` ends.
function temporaryDirectory(t: TestContext): string {
  const directory = realpathSync(
    mkdtempSync(path.join(tmpdir(), "turbo-collection-test-")),
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

// Writes `text` as `tcDirectory`'s configuration file.
function writeConfiguration(tcDirectory: string, text: string): void {
  mkdirSync(path.join(tcDirectory, ".turbo-collection"), { recursive: true });
  writeFileSync(
    path.join(tcDirectory, ".turbo-collection", "turbo-collection-config.json"),
    text,
  );
}

// Writes `text` as `directory`'s manifest.
function writeManifestText(directory: string, text: string): void {
  mkdirSync(path.join(directory, ".turbo-collection"), { recursive: true });
  writeFileSync(
    path.join(directory, ".turbo-collection", "manifest.json"),
    text,
  );
}

const ValidConfiguration = {
  version: "0.1.0-draft",
  collectionId: "3f2a9c1e-5b7d-4e8a-9c2f-1d6b8e4a7c30",
  collectionName: "Family Photos",
  tcCopyName: "main",
};

const Checksum = "a".repeat(64);

const ValidManifest: Manifest = {
  version: "0.1.0-draft",
  layout: { specId: "supplied-path-layout", version: "0.1.0-draft" },
  importSource: { specId: "local-folder", version: "0.1.0-draft" },
  checksumAlgorithm: "SHA-256",
  files: [{ file: "a.txt", size: 1, checksum: Checksum }],
};

test("R-MFILE-12: names are ordered with A to Z folded to lower case, then as they are", () => {
  const names = ["b.txt", "B.txt", "a.txt", "C.txt", "A.txt"];
  assert.deepEqual(names.sort(compareManifestNames), [
    "A.txt",
    "a.txt",
    "B.txt",
    "b.txt",
    "C.txt",
  ]);
});

test("R-MFILE-12: names are ordered by Unicode code point, not by UTF-16 code unit", () => {
  // U+FF61 comes before U+1F600 by code point, and after it by code unit.
  const names = ["\u{1F600}.jpg", "｡.jpg"];
  assert.deepEqual(names.sort(compareManifestNames), [
    "｡.jpg",
    "\u{1F600}.jpg",
  ]);
});

test("R-MFILE-15: the content digest is the SHA-256 of the checksums in order, joined by a newline", () => {
  const b = "b".repeat(64);
  const a = "a".repeat(64);
  const expected = createHash("sha256").update(`${a}\n${b}`).digest("hex");
  assert.equal(contentDigestOf([b, a]), expected);
});

test("R-MFILE-18: a valid configuration file is read", (t) => {
  const tcDirectory = temporaryDirectory(t);
  writeConfiguration(tcDirectory, JSON.stringify(ValidConfiguration));
  assert.deepEqual(readConfigurationFile(tcDirectory), ValidConfiguration);
});

test("R-MFILE-7: a configuration file that is not JSON is an error naming it", (t) => {
  const tcDirectory = temporaryDirectory(t);
  writeConfiguration(tcDirectory, '{"version": "0.1.0-draft", "collectionId');
  assert.throws(
    () => readConfigurationFile(tcDirectory),
    /turbo-collection-config\.json" is not a JSON document/,
  );
});

test("R-MFILE-7: a configuration file that lacks a field is an error naming the field", (t) => {
  const tcDirectory = temporaryDirectory(t);
  const { tcCopyName: _, ...withoutTcCopyName } = ValidConfiguration;
  writeConfiguration(tcDirectory, JSON.stringify(withoutTcCopyName));
  assert.throws(
    () => readConfigurationFile(tcDirectory),
    /lacks the field "tcCopyName"/,
  );
});

test("R-MFILE-7: a meta file stating a version this code does not recognize is an error", (t) => {
  const tcDirectory = temporaryDirectory(t);
  writeConfiguration(
    tcDirectory,
    JSON.stringify({ ...ValidConfiguration, version: "9.0.0" }),
  );
  assert.throws(
    () => readConfigurationFile(tcDirectory),
    /states version 9\.0\.0, which this Turbo-Collection does not recognize/,
  );
});

test("R-MFILE-18: a collectionId that is not a version 4 UUID in lower case is an error", (t) => {
  const tcDirectory = temporaryDirectory(t);
  writeConfiguration(
    tcDirectory,
    JSON.stringify({
      ...ValidConfiguration,
      collectionId: ValidConfiguration.collectionId.toUpperCase(),
    }),
  );
  assert.throws(
    () => readConfigurationFile(tcDirectory),
    /not a version 4 UUID/,
  );
});

test("R-MFILE-19: a tcCopyName holding a character a filename refuses is an error", (t) => {
  const tcDirectory = temporaryDirectory(t);
  writeConfiguration(
    tcDirectory,
    JSON.stringify({ ...ValidConfiguration, tcCopyName: "home/away" }),
  );
  assert.throws(
    () => readConfigurationFile(tcDirectory),
    /not a valid name for a TC Copy/,
  );
});

test("R-MFILE-8: a directory with no manifest has none to read", (t) => {
  assert.equal(readManifest(temporaryDirectory(t)), undefined);
});

test("R-MFILE-7: a manifest cut short is an error naming it", (t) => {
  const directory = temporaryDirectory(t);
  const text = JSON.stringify(ValidManifest, null, 2);
  writeManifestText(directory, text.slice(0, text.length / 2));
  assert.throws(
    () => readManifest(directory),
    /manifest\.json" is not a JSON document/,
  );
});

test("R-MFILE-7: a manifest entry that lacks a checksum is an error", (t) => {
  const directory = temporaryDirectory(t);
  writeManifestText(
    directory,
    JSON.stringify({ ...ValidManifest, files: [{ file: "a.txt", size: 1 }] }),
  );
  assert.throws(() => readManifest(directory), /lacks the field "files"/);
});

test("R-MFILE-5, R-MFILE-27: a rewritten manifest keeps a field this code does not know, one field to a line", (t) => {
  const directory = temporaryDirectory(t);
  writeManifestText(
    directory,
    JSON.stringify({ ...ValidManifest, curatedBy: "Ada" }),
  );
  const manifest = readManifest(directory)!;
  writeManifest(directory, manifest);

  const text = readFileSync(
    path.join(directory, ".turbo-collection", "manifest.json"),
    "utf8",
  );
  assert.match(text, /\n {2}"curatedBy": "Ada",?\n/);
  assert.deepEqual(readManifest(directory), {
    ...ValidManifest,
    curatedBy: "Ada",
  });
});
