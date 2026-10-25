import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { mock, test, type TestContext } from "node:test";

import { NamedMutex } from "../helpers/named-mutex.ts";
import { importIntoCopy } from "../import.ts";
import { initializeTc } from "../init.ts";
import { logEntryOf, logger, type LogEntry } from "../logger.ts";
import type { TcConfig } from "../meta-files.ts";

// What these tests make an import log is shown nowhere, unless a test
// collects it.
mock.method(logger, "log", () => {});

// Entries `logger` is given during test `t`, in order.
function collectEntries(t: TestContext): LogEntry[] {
  const entries: LogEntry[] = [];
  t.mock.method(logger, "log", (entry: LogEntry | string) =>
    entries.push(logEntryOf(entry)),
  );
  return entries;
}

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

// A new copy named `photos` in `parent`, made by init.
function makeCopy(parent: string): { copyRoot: string; tcConfig: TcConfig } {
  const copyRoot = path.join(parent, "photos");
  return { copyRoot, tcConfig: initializeTc({ directory: copyRoot }) };
}

// A directory named `moon-laptop` in `parent`, holding `files`, each a path
// relative to it with its content.
function makeFolder(parent: string, files: Record<string, string>): string {
  const folder = path.join(parent, "moon-laptop");
  mkdirSync(folder, { recursive: true });
  for (const [relativePath, content] of Object.entries(files)) {
    writeFileUnder(folder, relativePath, content);
  }
  return folder;
}

// A new run ID for each import, so that two imports in one test write
// receipt files of two names.
let runCount = 0;
function nextRunId(): string {
  runCount++;
  return `20261021T150000Z-${runCount.toString(16).padStart(4, "0")}`;
}

// Imports `folder` into `copyRoot`.
async function importFolder(
  folder: string,
  copyRoot: string,
  dryRun = false,
): Promise<void> {
  await importIntoCopy(
    { directory: folder, copy: copyRoot, dryRun },
    nextRunId(),
  );
}

// Where a copy at `copyRoot` holds what an import of a directory named
// `moon-laptop` stores at `relativePath` under it.
function storedDirectory(copyRoot: string, relativePath = ""): string {
  return path.join(copyRoot, "local-folder", "moon-laptop", relativePath);
}

// `directory`'s manifest, parsed.
function manifestOf(directory: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(
      path.join(directory, ".turbo-collection", "manifest.json"),
      "utf8",
    ),
  );
}

// Names of `directory`'s receipt files that end in `suffix`.
function receiptsOf(directory: string, suffix: string): string[] {
  const metaDirectory = path.join(directory, ".turbo-collection");
  if (!existsSync(metaDirectory)) {
    return [];
  }
  return readdirSync(metaDirectory).filter((name) => name.endsWith(suffix));
}

// `directory`'s receipt file whose name ends in `suffix`, parsed, where there
// is one.
function onlyReceiptOf(
  directory: string,
  suffix: string,
): Record<string, unknown> {
  const [name, ...others] = receiptsOf(directory, suffix);
  assert.equal(others.length, 0);
  return JSON.parse(
    readFileSync(path.join(directory, ".turbo-collection", name!), "utf8"),
  );
}

// `text`'s SHA-256 checksum.
function checksumOf(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

test("R-SRC-25, R-FOUND-3, R-LOCALFOLDER-6: an import stores each file at local-folder/ and its Supplied path, which starts with the directory's name", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, {
    "Woodwork/birdhouse/drawing.pdf": "plan",
    "notes.txt": "notes",
  });

  await importFolder(folder, copyRoot);

  assert.equal(
    readFileSync(
      storedDirectory(copyRoot, "Woodwork/birdhouse/drawing.pdf"),
      "utf8",
    ),
    "plan",
  );
  assert.equal(
    readFileSync(storedDirectory(copyRoot, "notes.txt"), "utf8"),
    "notes",
  );
});

test("R-MFILE-9, R-MFILE-10, R-MFILE-12: a manifest names the layout and the import source, and lists each file with its size and checksum, without regard to case", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, {
    "Soup.txt": "soup",
    "bread.txt": "bread",
  });

  await importFolder(folder, copyRoot);

  assert.deepEqual(manifestOf(storedDirectory(copyRoot)), {
    version: "0.1.0-draft",
    layout: { specId: "supplied-path-layout", version: "0.1.0-draft" },
    importSource: { specId: "local-folder", version: "0.1.0-draft" },
    checksumAlgorithm: "SHA-256",
    files: [
      { file: "bread.txt", size: 5, checksum: checksumOf("bread") },
      { file: "Soup.txt", size: 4, checksum: checksumOf("soup") },
    ],
  });
});

test("R-MFILE-14, R-MFILE-15, R-REC-5: each directory an import writes into gets an arrival file whose digest covers its files", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a", "b.txt": "b" });

  await importFolder(folder, copyRoot);

  const arrival = onlyReceiptOf(
    storedDirectory(copyRoot),
    "-main.arrival.json",
  );
  const digest = createHash("sha256")
    .update([checksumOf("a"), checksumOf("b")].sort().join("\n"))
    .digest("hex");
  assert.equal(arrival.version, "0.1.0-draft");
  assert.equal(arrival.tcSpecVersion, "0.1.0-draft");
  assert.equal(arrival.copyName, "main");
  assert.match(arrival.date as string, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  assert.equal(arrival.fileCount, 2);
  assert.equal(arrival.contentDigest, digest);
  assert.deepEqual(arrival.layout, {
    specId: "supplied-path-layout",
    version: "0.1.0-draft",
  });
  assert.deepEqual(arrival.importSource, {
    specId: "local-folder",
    version: "0.1.0-draft",
  });
});

test("R-SRC-8: importing a directory again adds nothing, and writes no receipt file", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  await importFolder(folder, copyRoot);
  const entries = collectEntries(t);

  await importFolder(folder, copyRoot);

  assert.equal(
    receiptsOf(storedDirectory(copyRoot), ".arrival.json").length,
    1,
  );
  assert.equal(receiptsOf(storedDirectory(copyRoot), ".error.json").length, 0);
  const importEntry = entries.find((entry) => entry.event === "import")!;
  assert.equal(importEntry.files, 0);
  assert.equal(importEntry.leftOut, 0);
});

test("R-SRC-23, R-SRC-26: a file whose content differs from the one at its path in the collection is left out and recorded, and every other file is imported before the run ends with an error", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "soup.txt": "soup" });
  await importFolder(folder, copyRoot);
  writeFileUnder(folder, "soup.txt", "soup, edited");
  writeFileUnder(folder, "cake.txt", "cake");
  const entries = collectEntries(t);

  await assert.rejects(
    importFolder(folder, copyRoot),
    /1 file left out of the collection/,
  );

  assert.equal(
    readFileSync(storedDirectory(copyRoot, "soup.txt"), "utf8"),
    "soup",
  );
  assert.equal(
    readFileSync(storedDirectory(copyRoot, "cake.txt"), "utf8"),
    "cake",
  );
  const errorFile = onlyReceiptOf(
    storedDirectory(copyRoot),
    "-main.error.json",
  );
  assert.match(
    (errorFile.importErrors as { message: string }[])[0]!.message,
    /soup\.txt" is left out: .* holds other content/,
  );
  assert.ok(
    entries.some(
      (entry) => entry.event === "error" && entry.outcome === "failure",
    ),
  );
});

test("R-TGT-13: a file the manifest does not list is not in the collection, and an import writes over it and lists it", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a", "b.txt": "b" });
  await importFolder(folder, copyRoot);
  // What an import stopped as it wrote c.txt would leave
  writeFileUnder(storedDirectory(copyRoot), "c.txt", "c, cut sh");
  writeFileUnder(folder, "c.txt", "c, complete");

  await importFolder(folder, copyRoot);

  assert.equal(
    readFileSync(storedDirectory(copyRoot, "c.txt"), "utf8"),
    "c, complete",
  );
  const files = manifestOf(storedDirectory(copyRoot)).files as {
    file: string;
  }[];
  assert.deepEqual(
    files.map((entry) => entry.file),
    ["a.txt", "b.txt", "c.txt"],
  );
});

test("R-SRC-24: a file for a directory whose manifest names another import source is left out, and that manifest is left as it is", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  const manifest = {
    version: "0.1.0-draft",
    layout: { specId: "photo-path-layout", version: "0.1.0-draft" },
    importSource: { specId: "icloud", version: "0.1.0-draft" },
    checksumAlgorithm: "SHA-256",
    files: [],
  };
  writeFileUnder(
    storedDirectory(copyRoot),
    ".turbo-collection/manifest.json",
    JSON.stringify(manifest),
  );

  await assert.rejects(importFolder(folder, copyRoot), /1 file left out/);

  assert.equal(existsSync(storedDirectory(copyRoot, "a.txt")), false);
  assert.deepEqual(manifestOf(storedDirectory(copyRoot)), manifest);
  assert.equal(receiptsOf(storedDirectory(copyRoot), ".error.json").length, 1);
});

test("R-MFILE-7: a manifest that is not JSON ends the run with an error naming it", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  writeFileUnder(
    storedDirectory(copyRoot),
    ".turbo-collection/manifest.json",
    '{"vers',
  );

  await assert.rejects(
    importFolder(folder, copyRoot),
    /manifest\.json" is not a JSON document/,
  );

  assert.equal(existsSync(storedDirectory(copyRoot, "a.txt")), false);
});

test("R-LOCALFOLDER-3: a file the copy's ignore file ignores is not imported, and an ignored directory is not looked into", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  writeFileSync(path.join(copyRoot, ".tcignore"), "*.tmp\ncache/\n");
  const folder = makeFolder(temporary, {
    "keep.txt": "keep",
    "draft.tmp": "draft",
    "cache/thumbnail.jpg": "thumbnail",
  });

  await importFolder(folder, copyRoot);

  assert.equal(existsSync(storedDirectory(copyRoot, "keep.txt")), true);
  assert.equal(existsSync(storedDirectory(copyRoot, "draft.tmp")), false);
  assert.equal(existsSync(storedDirectory(copyRoot, "cache")), false);
});

test("R-LOCALFOLDER-3, R-LOG-18: a .turbo-collection directory is passed over, logged, and the files beside it are imported", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, {
    "Recipes/soup.txt": "soup",
    "Recipes/.turbo-collection/manifest.json": "{}",
  });
  const entries = collectEntries(t);

  await importFolder(folder, copyRoot);

  assert.equal(existsSync(storedDirectory(copyRoot, "Recipes/soup.txt")), true);
  const passedOver = entries.filter((entry) => entry.event === "passed-over");
  assert.equal(passedOver.length, 1);
  assert.equal(passedOver[0]!.verbose, true);
  assert.equal(
    passedOver[0]!.path,
    path.join(folder, "Recipes", ".turbo-collection"),
  );
});

test("R-LOCALFOLDER-2: a directory that holds a copy is not imported, and nothing is written", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  initializeTc({ directory: path.join(folder, "inner") });

  await assert.rejects(importFolder(folder, copyRoot), /holds a copy at/);

  assert.equal(existsSync(path.join(copyRoot, "local-folder")), false);
});

test("R-LOCALFOLDER-2: a directory that is a copy, or lies inside one, is not imported", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const other = makeCopy(path.join(temporary, "other")).copyRoot;
  writeFileUnder(other, "inside/a.txt", "a");

  await assert.rejects(
    importFolder(other, copyRoot),
    /is a copy, and a copy is not imported/,
  );
  await assert.rejects(
    importFolder(path.join(other, "inside"), copyRoot),
    /lies inside a copy at/,
  );
});

test("R-LOCALFOLDER-2: a directory with no name of its own, such as a drive's root, is not imported", async (t) => {
  const { copyRoot } = makeCopy(temporaryDirectory(t));
  const root = path.parse(copyRoot).root;

  await assert.rejects(importFolder(root, copyRoot), /has no name of its own/);
});

test("R-CLI-14: an import into a directory that is not a copy is an error, and writes nothing", async (t) => {
  const temporary = temporaryDirectory(t);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  const notACopy = path.join(temporary, "photos");
  mkdirSync(notACopy);

  await assert.rejects(importFolder(folder, notACopy), /is not a copy/);

  assert.deepEqual(readdirSync(notACopy), []);
});

test("R-SRC-22: a directory holding a link imports nothing, and the link is named", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  const target = path.join(temporary, "elsewhere");
  mkdirSync(target);
  // A junction on Windows, which needs no administrator; a symbolic link
  // elsewhere
  symlinkSync(target, path.join(folder, "latest"), "junction");
  const entries = collectEntries(t);

  await assert.rejects(importFolder(folder, copyRoot), /imports nothing/);

  assert.equal(existsSync(path.join(copyRoot, "local-folder")), false);
  assert.ok(
    entries.some(
      (entry) =>
        entry.event === "error" && entry.path === path.join(folder, "latest"),
    ),
  );
});

test("R-SRC-22: a link that the copy's ignore file ignores is passed over", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  writeFileSync(path.join(copyRoot, ".tcignore"), "latest\n");
  const folder = makeFolder(temporary, { "a.txt": "a" });
  const target = path.join(temporary, "elsewhere");
  mkdirSync(target);
  symlinkSync(target, path.join(folder, "latest"), "junction");

  await importFolder(folder, copyRoot);

  assert.equal(existsSync(storedDirectory(copyRoot, "a.txt")), true);
});

test("R-SRC-14, R-LOG-15, R-LOG-18: a dry run writes nothing, and logs what a real import would write", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a", "b/c.txt": "cc" });
  const entries = collectEntries(t);

  await importFolder(folder, copyRoot, /*dryRun*/ true);

  assert.equal(existsSync(path.join(copyRoot, "local-folder")), false);
  const transfers = entries.filter((entry) => entry.event === "transfer");
  assert.equal(transfers.length, 2);
  const importEntry = entries.find((entry) => entry.event === "import")!;
  assert.equal(importEntry.files, 2);
  assert.equal(importEntry.bytes, 3);
});

test("R-LOG-15, R-LOG-18: an import logs a verbose transfer for each file it writes, and an import entry at the end", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "abc" });
  const entries = collectEntries(t);

  await importFolder(folder, copyRoot);

  const transfer = entries.find((entry) => entry.event === "transfer")!;
  assert.equal(transfer.verbose, true);
  assert.equal(transfer.from, path.join(folder, "a.txt"));
  assert.equal(transfer.to, storedDirectory(copyRoot, "a.txt"));
  assert.equal(transfer.size, 3);
  const importEntry = entries.at(-1)!;
  assert.equal(importEntry.event, "import");
  assert.equal(importEntry.importSource, "local-folder");
  assert.equal(importEntry.from, folder);
  assert.equal(importEntry.to, copyRoot);
  assert.equal(importEntry.files, 1);
  assert.equal(importEntry.bytes, 3);
  assert.equal(importEntry.leftOut, 0);
});

test("R-SRC-26: a file that cannot be written into the copy is left out and recorded in its directory's error file, and every other file is imported", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a", "b.txt": "b" });
  // A directory where a.txt is to go
  mkdirSync(storedDirectory(copyRoot, "a.txt"), { recursive: true });

  await assert.rejects(importFolder(folder, copyRoot), /1 file left out/);

  assert.equal(readFileSync(storedDirectory(copyRoot, "b.txt"), "utf8"), "b");
  const errorFile = onlyReceiptOf(
    storedDirectory(copyRoot),
    "-main.error.json",
  );
  assert.match(
    (errorFile.importErrors as { message: string }[])[0]!.message,
    /a\.txt" is left out: .* is a directory/,
  );
});

test("R-CLI-18: a copy inside the copy, on the way to a directory an import fills, is an error", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  writeFileUnder(
    storedDirectory(copyRoot),
    ".turbo-collection/turbo-collection-config.json",
    "{}",
  );

  await assert.rejects(
    importFolder(folder, copyRoot),
    /a copy never lies inside another/,
  );
});

test("R-PARALLEL-5: an import while another run holds the collection's lock is an error naming the collection", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot, tcConfig } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  await using _held = await NamedMutex.take(tcConfig.collectionId);

  await assert.rejects(
    importFolder(folder, copyRoot),
    new RegExp(
      `"photos" \\(${tcConfig.collectionId}\\); its process ID is not known`,
    ),
  );

  assert.equal(existsSync(path.join(copyRoot, "local-folder")), false);
});

test("R-LOG-13: an import logs the configuration it read, and where, as a verbose entry", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot, tcConfig } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  const entries = collectEntries(t);

  await importFolder(folder, copyRoot);

  const configuration = entries.find(
    (entry) => entry.event === "configuration",
  )!;
  assert.equal(configuration.verbose, true);
  assert.deepEqual(configuration.configuration, tcConfig);
});

// Names `directory` holds, other than its meta files' directory, in order.
function contentNamesOf(directory: string): string[] {
  return readdirSync(directory)
    .filter((name) => name !== ".turbo-collection")
    .sort();
}

// Names `directory`'s manifest lists, in its order.
function listedNamesOf(directory: string): string[] {
  return (manifestOf(directory).files as { file: string }[]).map(
    (entry) => entry.file,
  );
}

test("R-TGT-14, R-SRC-23: a file whose name differs from a listed file's only in letter case is that file, and is left out where its content differs", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  await importFolder(
    makeFolder(path.join(temporary, "first"), { "Photo.jpg": "first" }),
    copyRoot,
  );

  await assert.rejects(
    importFolder(
      makeFolder(path.join(temporary, "second"), { "photo.jpg": "second" }),
      copyRoot,
    ),
    /1 file left out of the collection/,
  );

  const stored = storedDirectory(copyRoot);
  assert.deepEqual(contentNamesOf(stored), ["Photo.jpg"]);
  assert.equal(readFileSync(path.join(stored, "Photo.jpg"), "utf8"), "first");
  assert.deepEqual(listedNamesOf(stored), ["Photo.jpg"]);
});

test("R-TGT-14, R-SRC-8: a file whose name differs from a listed file's only in letter case, with identical content, is in the collection already", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  await importFolder(
    makeFolder(path.join(temporary, "first"), { "Photo.jpg": "same" }),
    copyRoot,
  );

  await importFolder(
    makeFolder(path.join(temporary, "second"), { "PHOTO.JPG": "same" }),
    copyRoot,
  );

  const stored = storedDirectory(copyRoot);
  assert.deepEqual(contentNamesOf(stored), ["Photo.jpg"]);
  assert.deepEqual(listedNamesOf(stored), ["Photo.jpg"]);
  assert.equal(receiptsOf(stored, ".arrival.json").length, 1);
});

test("R-TGT-14: a file whose name differs from a listed file's only in Unicode normalization is that file", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const composed = "café.txt";
  const decomposed = "café.txt";
  await importFolder(
    makeFolder(path.join(temporary, "first"), { [composed]: "first" }),
    copyRoot,
  );

  await assert.rejects(
    importFolder(
      makeFolder(path.join(temporary, "second"), { [decomposed]: "second" }),
      copyRoot,
    ),
    /1 file left out of the collection/,
  );

  const stored = storedDirectory(copyRoot);
  assert.deepEqual(contentNamesOf(stored), [composed]);
  assert.equal(readFileSync(path.join(stored, composed), "utf8"), "first");
});

test("R-TGT-14: an import writes into a directory a copy holds under another spelling of its name, and makes no second one", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  await importFolder(
    makeFolder(path.join(temporary, "first"), { "Photos/one.jpg": "one" }),
    copyRoot,
  );

  await importFolder(
    makeFolder(path.join(temporary, "second"), { "photos/two.jpg": "two" }),
    copyRoot,
  );

  assert.deepEqual(contentNamesOf(storedDirectory(copyRoot)), ["Photos"]);
  const photos = storedDirectory(copyRoot, "Photos");
  assert.deepEqual(contentNamesOf(photos), ["one.jpg", "two.jpg"]);
  assert.deepEqual(listedNamesOf(photos), ["one.jpg", "two.jpg"]);
});

test("R-TGT-14, R-SRC-14: of two spellings of one name in an Imported directory, one is imported and the other compared with it, in a dry run as in a real one", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "lower", "A.txt": "upper" });
  if (readdirSync(folder).length < 2) {
    t.skip("this drive holds one file for both spellings");
    return;
  }

  await assert.rejects(
    importFolder(folder, copyRoot, true),
    /1 file left out of the collection/,
  );
  assert.equal(existsSync(storedDirectory(copyRoot)), false);

  await assert.rejects(
    importFolder(folder, copyRoot),
    /1 file left out of the collection/,
  );
  assert.deepEqual(contentNamesOf(storedDirectory(copyRoot)), ["A.txt"]);
  assert.equal(
    readFileSync(storedDirectory(copyRoot, "A.txt"), "utf8"),
    "upper",
  );
});

test("R-SRC-26, R-MFILE-2: a file named .turbo-collection is left out and recorded, since its directory's meta files go there, and every other file is imported", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, {
    ".turbo-collection": "a plain file",
    "todo.txt": "todo",
  });

  await assert.rejects(
    importFolder(folder, copyRoot),
    /1 file left out of the collection/,
  );

  const stored = storedDirectory(copyRoot);
  assert.deepEqual(listedNamesOf(stored), ["todo.txt"]);
  const errorFile = onlyReceiptOf(stored, "-main.error.json");
  assert.match(
    (errorFile.importErrors as { message: string }[])[0]!.message,
    /\.turbo-collection" is left out: .* holds that directory's meta files/,
  );

  // A later import leaves it out the same way, and fails no other way.
  await assert.rejects(
    importFolder(folder, copyRoot),
    /1 file left out of the collection/,
  );
  assert.deepEqual(listedNamesOf(stored), ["todo.txt"]);
});

test("R-LOCALFOLDER-3, R-TGT-14: a directory whose name differs from .turbo-collection only in letter case is passed over too", async (t) => {
  const temporary = temporaryDirectory(t);
  const { copyRoot } = makeCopy(temporary);
  const folder = makeFolder(temporary, {
    ".Turbo-Collection/notes.txt": "notes",
    "photo.jpg": "photo",
  });
  const entries = collectEntries(t);

  await importFolder(folder, copyRoot);

  const stored = storedDirectory(copyRoot);
  assert.deepEqual(listedNamesOf(stored), ["photo.jpg"]);
  assert.equal(
    existsSync(path.join(stored, ".turbo-collection", "notes.txt")),
    false,
  );
  assert.ok(
    entries.some(
      (entry) =>
        entry.event === "passed-over" &&
        String(entry.path).endsWith(".Turbo-Collection"),
    ),
  );
});
