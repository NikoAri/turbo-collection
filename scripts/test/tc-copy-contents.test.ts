import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { mock, test, type TestContext } from "node:test";

import { readTcCopy } from "../tc-copy-contents.ts";
import { importIntoTcCopy } from "../import.ts";
import { initializeTc } from "../init.ts";
import { logger } from "../logger.ts";
import {
  compileIgnorePatterns,
  readIgnorePatterns,
  type IsIgnored,
} from "../tcignore.ts";

// What init and import log in these tests is shown nowhere.
mock.method(logger, "log", () => {});

// A new, empty directory under `tmpdir()`, removed when test `t` ends. Its
// path is resolved, since on a Mac `tmpdir()` lies behind a link, and a path
// through a link is an error (turbo-collection-core-spec.md R-CLI-20).
function temporaryDirectory(t: TestContext): string {
  const directory = realpathSync(
    mkdtempSync(path.join(tmpdir(), "turbo-collection-test-")),
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

// Writes `content` at `relativePath` under `directory`, creating any directory
// it needs.
function writeFileUnder(
  directory: string,
  relativePath: string,
  content = "content",
): void {
  const file = path.join(directory, relativePath);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}

// A test of whether an ignore file holding `text` ignores a path.
function ignoring(text: string): IsIgnored {
  return compileIgnorePatterns(readIgnorePatterns(text));
}

// Run ID of each import these tests make.
const RunId = "20261022T150000Z-0001";

// Makes a TC Copy at `photos` in `parent`, and imports into it a directory
// named `moon-laptop` holding `files`, each a path relative to it with its
// content. Returns that TC Directory, and where it stores what `moon-laptop`
// holds.
async function makeTcCopyHolding(
  parent: string,
  files: Record<string, string>,
): Promise<{ tcDirectory: string; stored: string }> {
  const tcDirectory = path.join(parent, "photos");
  initializeTc({ directory: tcDirectory });
  const folder = path.join(parent, "moon-laptop");
  for (const [relativePath, content] of Object.entries(files)) {
    writeFileUnder(folder, relativePath, content);
  }
  await importIntoTcCopy(
    { importDirectory: folder, tcDirectory, dryRun: false },
    RunId,
  );
  return {
    tcDirectory,
    stored: path.join(tcDirectory, "local-folder", "moon-laptop"),
  };
}

test("R-MFILE-2, R-MFILE-8: readTcCopy reads each directory of a TC Copy, with its content files, its manifest and its receipt files, and the root's .tcignore is not a content file", async (t) => {
  const { tcDirectory } = await makeTcCopyHolding(temporaryDirectory(t), {
    "a.txt": "a",
    "sub/b.txt": "b",
  });

  const contents = readTcCopy(tcDirectory, ignoring(""));

  assert.deepEqual([...contents.directories.keys()].sort(), [
    "",
    "local-folder",
    "local-folder/moon-laptop",
    "local-folder/moon-laptop/sub",
  ]);
  const root = contents.directories.get("")!;
  assert.deepEqual(root.files, new Set());
  assert.equal(root.manifest, undefined);
  assert.deepEqual(root.receiptFiles, []);
  const stored = contents.directories.get("local-folder/moon-laptop")!;
  assert.deepEqual(stored.files, new Set(["a.txt"]));
  assert.deepEqual(
    stored.manifest?.files.map((entry) => entry.file),
    ["a.txt"],
  );
  assert.deepEqual(stored.receiptFiles, [`receipt-${RunId}-main.arrival.json`]);
  assert.deepEqual(contents.notRegular, []);
  assert.deepEqual(contents.unrecognized, []);
});

test("R-INT-8: readTcCopy lists a content file that no manifest lists", async (t) => {
  const { tcDirectory, stored } = await makeTcCopyHolding(
    temporaryDirectory(t),
    {
      "a.txt": "a",
    },
  );
  writeFileUnder(stored, "extra.txt");
  writeFileUnder(tcDirectory, "notes/n.txt");

  const contents = readTcCopy(tcDirectory, ignoring(""));

  assert.deepEqual(
    contents.directories.get("local-folder/moon-laptop")!.files,
    new Set(["a.txt", "extra.txt"]),
  );
  const notes = contents.directories.get("notes")!;
  assert.deepEqual(notes.files, new Set(["n.txt"]));
  assert.equal(notes.manifest, undefined);
});

test("R-MFILE-21, R-CLI-19: readTcCopy passes over what an ignore file ignores, and reads every meta file whatever it ignores", async (t) => {
  const { tcDirectory, stored } = await makeTcCopyHolding(
    temporaryDirectory(t),
    {
      "a.json": "{}",
      "b.txt": "b",
    },
  );
  writeFileUnder(stored, ".DS_Store");
  writeFileUnder(stored, ".turbo-collection/.DS_Store");
  writeFileUnder(stored, "__MACOSX/c.txt");

  const contents = readTcCopy(
    tcDirectory,
    ignoring(".DS_Store\n__MACOSX/\n*.json\n"),
  );

  const storedContents = contents.directories.get("local-folder/moon-laptop")!;
  assert.deepEqual(storedContents.files, new Set(["b.txt"]));
  assert.deepEqual(
    storedContents.manifest?.files.map((entry) => entry.file),
    ["a.json", "b.txt"],
  );
  assert.deepEqual(storedContents.receiptFiles, [
    `receipt-${RunId}-main.arrival.json`,
  ]);
  assert.equal(
    contents.directories.has("local-folder/moon-laptop/__MACOSX"),
    false,
  );
  assert.deepEqual(contents.unrecognized, []);
});

test("R-CLI-19: readTcCopy lists a link without following it, and passes over one that is ignored", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory, stored } = await makeTcCopyHolding(temporary, {
    "a.txt": "a",
  });
  const target = path.join(temporary, "elsewhere");
  writeFileUnder(target, "far.txt");
  // A junction on Windows, which needs no administrator; a symbolic link
  // elsewhere
  symlinkSync(target, path.join(stored, "latest"), "junction");
  symlinkSync(target, path.join(stored, "ignored-link"), "junction");

  const contents = readTcCopy(tcDirectory, ignoring("ignored-link\n"));

  assert.deepEqual(contents.notRegular, [path.join(stored, "latest")]);
  assert.equal(
    contents.directories.has("local-folder/moon-laptop/latest"),
    false,
  );
});

test("R-CLI-18: readTcCopy ends with an error at a configuration file below a TC Directory", async (t) => {
  const { tcDirectory } = await makeTcCopyHolding(temporaryDirectory(t), {
    "a.txt": "a",
  });
  writeFileUnder(
    tcDirectory,
    "local-folder/nested/.turbo-collection/turbo-collection-config.json",
    "{}",
  );

  assert.throws(
    () => readTcCopy(tcDirectory, ignoring("")),
    /nested" is a TC Directory inside the TC Copy at/,
  );
});

test("R-MFILE-1: readTcCopy lists what a .turbo-collection holds that is no meta file there, and reads a location receipt file at a TC Directory alone", async (t) => {
  const { tcDirectory, stored } = await makeTcCopyHolding(
    temporaryDirectory(t),
    {
      "a.txt": "a",
    },
  );
  const metaDirectory = path.join(stored, ".turbo-collection");
  writeFileUnder(metaDirectory, "notes.txt");
  const locationReceipt = "receipt-20261022T150000Z-0002-main.location.json";
  writeFileUnder(metaDirectory, locationReceipt, "{}");
  writeFileUnder(tcDirectory, `.turbo-collection/${locationReceipt}`, "{}");
  mkdirSync(path.join(tcDirectory, ".turbo-collection", "tmp"));

  const contents = readTcCopy(tcDirectory, ignoring(""));

  assert.deepEqual(
    contents.unrecognized.sort(),
    [
      path.join(tcDirectory, ".turbo-collection", "tmp"),
      path.join(metaDirectory, "notes.txt"),
      path.join(metaDirectory, locationReceipt),
    ].sort(),
  );
  assert.deepEqual(contents.directories.get("")!.receiptFiles, [
    locationReceipt,
  ]);
});

test("R-MFILE-7: readTcCopy ends with an error at a manifest that is not a JSON document", async (t) => {
  const { tcDirectory, stored } = await makeTcCopyHolding(
    temporaryDirectory(t),
    {
      "a.txt": "a",
    },
  );
  writeFileUnder(stored, ".turbo-collection/manifest.json", '{"version": "0.1');

  assert.throws(
    () => readTcCopy(tcDirectory, ignoring("")),
    /manifest\.json" is not a JSON document/,
  );
});

test("R-TGT-14: readTcCopy ends with an error at a meta directory or a manifest spelled in another letter case, or at a file named .turbo-collection", async (t) => {
  const { tcDirectory, stored } = await makeTcCopyHolding(
    temporaryDirectory(t),
    {
      "a.txt": "a",
    },
  );
  // Through another name, since a drive that ignores case takes a rename
  // to a new letter case alone as no change on some systems
  const renameTo = (from: string, to: string) => {
    renameSync(from, `${from}.renaming`);
    renameSync(`${from}.renaming`, to);
  };
  const metaDirectory = path.join(stored, ".turbo-collection");

  renameTo(
    path.join(metaDirectory, "manifest.json"),
    path.join(metaDirectory, "Manifest.json"),
  );
  assert.throws(
    () => readTcCopy(tcDirectory, ignoring("")),
    /Manifest\.json" stands where Turbo-Collection keeps a file named "manifest\.json"/,
  );

  renameTo(metaDirectory, path.join(stored, ".Turbo-Collection"));
  assert.throws(
    () => readTcCopy(tcDirectory, ignoring("")),
    /Turbo-Collection" stands where Turbo-Collection keeps a directory named "\.turbo-collection"/,
  );

  rmSync(path.join(stored, ".Turbo-Collection"), { recursive: true });
  writeFileUnder(stored, ".turbo-collection");
  assert.throws(
    () => readTcCopy(tcDirectory, ignoring("")),
    /keeps a directory named "\.turbo-collection"/,
  );
});
