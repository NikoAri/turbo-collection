import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  cpSync,
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
import { fileURLToPath, URL } from "node:url";

import { NamedMutex } from "../helpers/named-mutex.ts";
import { importIntoTcCopy } from "../import.ts";
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

// A new TC Copy named `photos` in `parent`, made by init.
function makeTcCopy(parent: string): {
  tcDirectory: string;
  tcConfig: TcConfig;
} {
  const tcDirectory = path.join(parent, "photos");
  return { tcDirectory, tcConfig: initializeTc({ directory: tcDirectory }) };
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

// Imports `folder` into `tcDirectory`.
async function importFolder(
  folder: string,
  tcDirectory: string,
  dryRun = false,
): Promise<void> {
  await importIntoTcCopy(
    { importDirectory: folder, tcDirectory, dryRun },
    nextRunId(),
  );
}

// Where a TC Copy at `tcDirectory` holds what an import of a directory named
// `moon-laptop` stores at `relativePath` under it.
function storedDirectory(tcDirectory: string, relativePath = ""): string {
  return path.join(tcDirectory, "local-folder", "moon-laptop", relativePath);
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
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, {
    "Woodwork/birdhouse/drawing.pdf": "plan",
    "notes.txt": "notes",
  });

  await importFolder(folder, tcDirectory);

  assert.equal(
    readFileSync(
      storedDirectory(tcDirectory, "Woodwork/birdhouse/drawing.pdf"),
      "utf8",
    ),
    "plan",
  );
  assert.equal(
    readFileSync(storedDirectory(tcDirectory, "notes.txt"), "utf8"),
    "notes",
  );
});

test("R-MFILE-9, R-MFILE-10, R-MFILE-12: a manifest names the layout and the import source, and lists each file with its size and checksum, without regard to case", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, {
    "Soup.txt": "soup",
    "bread.txt": "bread",
  });

  await importFolder(folder, tcDirectory);

  assert.deepEqual(manifestOf(storedDirectory(tcDirectory)), {
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
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a", "b.txt": "b" });

  await importFolder(folder, tcDirectory);

  const arrival = onlyReceiptOf(
    storedDirectory(tcDirectory),
    "-main.arrival.json",
  );
  const digest = createHash("sha256")
    .update([checksumOf("a"), checksumOf("b")].sort().join("\n"))
    .digest("hex");
  assert.equal(arrival.version, "0.1.0-draft");
  assert.equal(arrival.tcSpecVersion, "0.1.0-draft");
  assert.equal(arrival.tcCopyName, "main");
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
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  await importFolder(folder, tcDirectory);
  const entries = collectEntries(t);

  await importFolder(folder, tcDirectory);

  assert.equal(
    receiptsOf(storedDirectory(tcDirectory), ".arrival.json").length,
    1,
  );
  assert.equal(
    receiptsOf(storedDirectory(tcDirectory), ".error.json").length,
    0,
  );
  const importEntry = entries.find((entry) => entry.event === "import")!;
  assert.equal(importEntry.files, 0);
  assert.equal(importEntry.leftOut, 0);
});

test("R-SRC-23, R-SRC-26: a file whose content differs from the one at its path in the collection is left out and recorded, and every other file is imported before the run ends with an error", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "soup.txt": "soup" });
  await importFolder(folder, tcDirectory);
  writeFileUnder(folder, "soup.txt", "soup, edited");
  writeFileUnder(folder, "cake.txt", "cake");
  const entries = collectEntries(t);

  await assert.rejects(
    importFolder(folder, tcDirectory),
    /1 file left out of the collection/,
  );

  assert.equal(
    readFileSync(storedDirectory(tcDirectory, "soup.txt"), "utf8"),
    "soup",
  );
  assert.equal(
    readFileSync(storedDirectory(tcDirectory, "cake.txt"), "utf8"),
    "cake",
  );
  const errorFile = onlyReceiptOf(
    storedDirectory(tcDirectory),
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
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a", "b.txt": "b" });
  await importFolder(folder, tcDirectory);
  // What an import stopped as it wrote c.txt would leave
  writeFileUnder(storedDirectory(tcDirectory), "c.txt", "c, cut sh");
  writeFileUnder(folder, "c.txt", "c, complete");

  await importFolder(folder, tcDirectory);

  assert.equal(
    readFileSync(storedDirectory(tcDirectory, "c.txt"), "utf8"),
    "c, complete",
  );
  const files = manifestOf(storedDirectory(tcDirectory)).files as {
    file: string;
  }[];
  assert.deepEqual(
    files.map((entry) => entry.file),
    ["a.txt", "b.txt", "c.txt"],
  );
});

test("R-SRC-24: a file for a directory whose manifest names another import source is left out, and that manifest is left as it is", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  const manifest = {
    version: "0.1.0-draft",
    layout: { specId: "photo-path-layout", version: "0.1.0-draft" },
    importSource: { specId: "icloud", version: "0.1.0-draft" },
    checksumAlgorithm: "SHA-256",
    files: [],
  };
  writeFileUnder(
    storedDirectory(tcDirectory),
    ".turbo-collection/manifest.json",
    JSON.stringify(manifest),
  );

  await assert.rejects(importFolder(folder, tcDirectory), /1 file left out/);

  assert.equal(existsSync(storedDirectory(tcDirectory, "a.txt")), false);
  assert.deepEqual(manifestOf(storedDirectory(tcDirectory)), manifest);
  assert.equal(
    receiptsOf(storedDirectory(tcDirectory), ".error.json").length,
    1,
  );
});

test("R-MFILE-7: a manifest that is not JSON ends the run with an error naming it", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  writeFileUnder(
    storedDirectory(tcDirectory),
    ".turbo-collection/manifest.json",
    '{"vers',
  );

  await assert.rejects(
    importFolder(folder, tcDirectory),
    /manifest\.json" is not a JSON document/,
  );

  assert.equal(existsSync(storedDirectory(tcDirectory, "a.txt")), false);
});

test("R-LOCALFOLDER-3: a file the TC Copy's ignore file ignores is not imported, and an ignored directory is not looked into", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  writeFileSync(path.join(tcDirectory, ".tcignore"), "*.tmp\ncache/\n");
  const folder = makeFolder(temporary, {
    "keep.txt": "keep",
    "draft.tmp": "draft",
    "cache/thumbnail.jpg": "thumbnail",
  });

  await importFolder(folder, tcDirectory);

  assert.equal(existsSync(storedDirectory(tcDirectory, "keep.txt")), true);
  assert.equal(existsSync(storedDirectory(tcDirectory, "draft.tmp")), false);
  assert.equal(existsSync(storedDirectory(tcDirectory, "cache")), false);
});

test("R-LOCALFOLDER-3, R-LOG-18: a .turbo-collection directory is passed over, logged, and the files beside it are imported", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, {
    "Recipes/soup.txt": "soup",
    "Recipes/.turbo-collection/manifest.json": "{}",
  });
  const entries = collectEntries(t);

  await importFolder(folder, tcDirectory);

  assert.equal(
    existsSync(storedDirectory(tcDirectory, "Recipes/soup.txt")),
    true,
  );
  const passedOver = entries.filter((entry) => entry.event === "passed-over");
  assert.equal(passedOver.length, 1);
  assert.equal(passedOver[0]!.verbose, true);
  assert.equal(
    passedOver[0]!.path,
    path.join(folder, "Recipes", ".turbo-collection"),
  );
});

test("R-LOCALFOLDER-2: a directory that holds a TC Copy is not imported, and nothing is written", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  initializeTc({ directory: path.join(folder, "inner") });

  await assert.rejects(importFolder(folder, tcDirectory), /holds a TC Copy at/);

  assert.equal(existsSync(path.join(tcDirectory, "local-folder")), false);
});

test("R-LOCALFOLDER-2: a directory that is a TC Directory, or lies inside a TC Copy, is not imported", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const other = makeTcCopy(path.join(temporary, "other")).tcDirectory;
  writeFileUnder(other, "inside/a.txt", "a");

  await assert.rejects(
    importFolder(other, tcDirectory),
    /is a TC Directory, and a TC Copy is not imported/,
  );
  await assert.rejects(
    importFolder(path.join(other, "inside"), tcDirectory),
    /lies inside a TC Copy at/,
  );
});

test("R-LOCALFOLDER-2: a directory with no name of its own, such as a drive's root, is not imported", async (t) => {
  const { tcDirectory } = makeTcCopy(temporaryDirectory(t));
  const root = path.parse(tcDirectory).root;

  await assert.rejects(
    importFolder(root, tcDirectory),
    /has no name of its own/,
  );
});

test("R-CLI-14: an import into a directory that is not a TC Copy is an error, and writes nothing", async (t) => {
  const temporary = temporaryDirectory(t);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  const notATcDirectory = path.join(temporary, "photos");
  mkdirSync(notATcDirectory);

  await assert.rejects(
    importFolder(folder, notATcDirectory),
    /is not a TC Directory/,
  );

  assert.deepEqual(readdirSync(notATcDirectory), []);
});

test("R-SRC-22: a directory holding a link imports nothing, and the link is named", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  const target = path.join(temporary, "elsewhere");
  mkdirSync(target);
  // A junction on Windows, which needs no administrator; a symbolic link
  // elsewhere
  symlinkSync(target, path.join(folder, "latest"), "junction");
  const entries = collectEntries(t);

  await assert.rejects(importFolder(folder, tcDirectory), /imports nothing/);

  assert.equal(existsSync(path.join(tcDirectory, "local-folder")), false);
  assert.ok(
    entries.some(
      (entry) =>
        entry.event === "error" && entry.path === path.join(folder, "latest"),
    ),
  );
});

test("R-SRC-22: a link that the TC Copy's ignore file ignores is passed over", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  writeFileSync(path.join(tcDirectory, ".tcignore"), "latest\n");
  const folder = makeFolder(temporary, { "a.txt": "a" });
  const target = path.join(temporary, "elsewhere");
  mkdirSync(target);
  symlinkSync(target, path.join(folder, "latest"), "junction");

  await importFolder(folder, tcDirectory);

  assert.equal(existsSync(storedDirectory(tcDirectory, "a.txt")), true);
});

test("R-SRC-14, R-LOG-15, R-LOG-18: a dry run writes nothing, and logs what a real import would write", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a", "b/c.txt": "cc" });
  const entries = collectEntries(t);

  await importFolder(folder, tcDirectory, /*dryRun*/ true);

  assert.equal(existsSync(path.join(tcDirectory, "local-folder")), false);
  const transfers = entries.filter((entry) => entry.event === "transfer");
  assert.equal(transfers.length, 2);
  const importEntry = entries.find((entry) => entry.event === "import")!;
  assert.equal(importEntry.files, 2);
  assert.equal(importEntry.bytes, 3);
});

test("R-LOG-15, R-LOG-18: an import logs a verbose transfer for each file it writes, and an import entry at the end", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "abc" });
  const entries = collectEntries(t);

  await importFolder(folder, tcDirectory);

  const transfer = entries.find((entry) => entry.event === "transfer")!;
  assert.equal(transfer.verbose, true);
  assert.equal(transfer.from, path.join(folder, "a.txt"));
  assert.equal(transfer.to, storedDirectory(tcDirectory, "a.txt"));
  assert.equal(transfer.size, 3);
  const importEntry = entries.at(-1)!;
  assert.equal(importEntry.event, "import");
  assert.equal(importEntry.importSource, "local-folder");
  assert.equal(importEntry.from, folder);
  assert.equal(importEntry.to, tcDirectory);
  assert.equal(importEntry.files, 1);
  assert.equal(importEntry.bytes, 3);
  assert.equal(importEntry.leftOut, 0);
});

test("R-SRC-26: a file that cannot be written into the TC Copy is left out and recorded in its directory's error file, and every other file is imported", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a", "b.txt": "b" });
  // A directory where a.txt is to go
  mkdirSync(storedDirectory(tcDirectory, "a.txt"), { recursive: true });

  await assert.rejects(importFolder(folder, tcDirectory), /1 file left out/);

  assert.equal(
    readFileSync(storedDirectory(tcDirectory, "b.txt"), "utf8"),
    "b",
  );
  const errorFile = onlyReceiptOf(
    storedDirectory(tcDirectory),
    "-main.error.json",
  );
  assert.match(
    (errorFile.importErrors as { message: string }[])[0]!.message,
    /a\.txt" is left out: .* is a directory/,
  );
});

test("R-CLI-18: a TC Copy inside the TC Copy, on the way to a directory an import fills, is an error", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  writeFileUnder(
    storedDirectory(tcDirectory),
    ".turbo-collection/turbo-collection-config.json",
    "{}",
  );

  await assert.rejects(
    importFolder(folder, tcDirectory),
    /a TC Copy never lies inside another/,
  );
});

test("R-PARALLEL-5: an import while another run holds the collection's lock is an error naming the collection", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory, tcConfig } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  await using _held = await NamedMutex.take(tcConfig.collectionId);

  await assert.rejects(
    importFolder(folder, tcDirectory),
    new RegExp(
      `"photos" \\(${tcConfig.collectionId}\\); its process ID is not known`,
    ),
  );

  assert.equal(existsSync(path.join(tcDirectory, "local-folder")), false);
});

test("R-LOG-13: an import logs the configuration it read, and where, as a verbose entry", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory, tcConfig } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "a" });
  const entries = collectEntries(t);

  await importFolder(folder, tcDirectory);

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
  const { tcDirectory } = makeTcCopy(temporary);
  await importFolder(
    makeFolder(path.join(temporary, "first"), { "Photo.jpg": "first" }),
    tcDirectory,
  );

  await assert.rejects(
    importFolder(
      makeFolder(path.join(temporary, "second"), { "photo.jpg": "second" }),
      tcDirectory,
    ),
    /1 file left out of the collection/,
  );

  const stored = storedDirectory(tcDirectory);
  assert.deepEqual(contentNamesOf(stored), ["Photo.jpg"]);
  assert.equal(readFileSync(path.join(stored, "Photo.jpg"), "utf8"), "first");
  assert.deepEqual(listedNamesOf(stored), ["Photo.jpg"]);
});

test("R-TGT-14, R-SRC-8: a file whose name differs from a listed file's only in letter case, with identical content, is in the collection already", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  await importFolder(
    makeFolder(path.join(temporary, "first"), { "Photo.jpg": "same" }),
    tcDirectory,
  );

  await importFolder(
    makeFolder(path.join(temporary, "second"), { "PHOTO.JPG": "same" }),
    tcDirectory,
  );

  const stored = storedDirectory(tcDirectory);
  assert.deepEqual(contentNamesOf(stored), ["Photo.jpg"]);
  assert.deepEqual(listedNamesOf(stored), ["Photo.jpg"]);
  assert.equal(receiptsOf(stored, ".arrival.json").length, 1);
});

test("R-TGT-14: a file whose name differs from a listed file's only in Unicode normalization is that file", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const composed = "café.txt";
  const decomposed = "café.txt";
  await importFolder(
    makeFolder(path.join(temporary, "first"), { [composed]: "first" }),
    tcDirectory,
  );

  await assert.rejects(
    importFolder(
      makeFolder(path.join(temporary, "second"), { [decomposed]: "second" }),
      tcDirectory,
    ),
    /1 file left out of the collection/,
  );

  const stored = storedDirectory(tcDirectory);
  assert.deepEqual(contentNamesOf(stored), [composed]);
  assert.equal(readFileSync(path.join(stored, composed), "utf8"), "first");
});

test("R-TGT-14: an import writes into a directory a TC Copy holds under another spelling of its name, and makes no second one", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  await importFolder(
    makeFolder(path.join(temporary, "first"), { "Photos/one.jpg": "one" }),
    tcDirectory,
  );

  await importFolder(
    makeFolder(path.join(temporary, "second"), { "photos/two.jpg": "two" }),
    tcDirectory,
  );

  assert.deepEqual(contentNamesOf(storedDirectory(tcDirectory)), ["Photos"]);
  const photos = storedDirectory(tcDirectory, "Photos");
  assert.deepEqual(contentNamesOf(photos), ["one.jpg", "two.jpg"]);
  assert.deepEqual(listedNamesOf(photos), ["one.jpg", "two.jpg"]);
});

test("R-TGT-14, R-SRC-14: of two spellings of one name in an Imported directory, one is imported and the other compared with it, in a dry run as in a real one", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "a.txt": "lower", "A.txt": "upper" });
  if (readdirSync(folder).length < 2) {
    t.skip("this drive holds one file for both spellings");
    return;
  }

  await assert.rejects(
    importFolder(folder, tcDirectory, true),
    /1 file left out of the collection/,
  );
  assert.equal(existsSync(storedDirectory(tcDirectory)), false);

  await assert.rejects(
    importFolder(folder, tcDirectory),
    /1 file left out of the collection/,
  );
  assert.deepEqual(contentNamesOf(storedDirectory(tcDirectory)), ["A.txt"]);
  assert.equal(
    readFileSync(storedDirectory(tcDirectory, "A.txt"), "utf8"),
    "upper",
  );
});

test("R-SRC-26, R-MFILE-2: a file named .turbo-collection is left out and recorded, since its directory's meta files go there, and every other file is imported", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, {
    ".turbo-collection": "a plain file",
    "todo.txt": "todo",
  });

  await assert.rejects(
    importFolder(folder, tcDirectory),
    /1 file left out of the collection/,
  );

  const stored = storedDirectory(tcDirectory);
  assert.deepEqual(listedNamesOf(stored), ["todo.txt"]);
  const errorFile = onlyReceiptOf(stored, "-main.error.json");
  assert.match(
    (errorFile.importErrors as { message: string }[])[0]!.message,
    /\.turbo-collection" is left out: .* holds that directory's meta files/,
  );

  // A later import leaves it out the same way, and fails no other way.
  await assert.rejects(
    importFolder(folder, tcDirectory),
    /1 file left out of the collection/,
  );
  assert.deepEqual(listedNamesOf(stored), ["todo.txt"]);
});

test("R-LOCALFOLDER-3, R-TGT-14: a directory whose name differs from .turbo-collection only in letter case is passed over too", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, {
    ".Turbo-Collection/notes.txt": "notes",
    "photo.jpg": "photo",
  });
  const entries = collectEntries(t);

  await importFolder(folder, tcDirectory);

  const stored = storedDirectory(tcDirectory);
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

// `samples/moon-photos/`, whose JPEGs samples/README.md lists, each with
// where photo-path layout files it.
const MoonPhotos = fileURLToPath(
  new URL("../../samples/moon-photos/", import.meta.url),
);

// Copies photos into `folder`: each from its path under `MoonPhotos` to its
// path under `folder`.
function copyPhotos(folder: string, photos: Record<string, string>): void {
  for (const [relativePath, samplePath] of Object.entries(photos)) {
    const file = path.join(folder, relativePath);
    mkdirSync(path.dirname(file), { recursive: true });
    cpSync(path.join(MoonPhotos, samplePath), file);
  }
}

test("R-LOCALFOLDER-5, R-PHOTO-3, R-PHOTO-10: a directory holding photos is imported under photo-path layout, each photo where samples/README.md files it, and each manifest names that layout", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = path.join(temporary, "moon-photos");
  cpSync(MoonPhotos, folder, { recursive: true });
  const entries = collectEntries(t);

  await importFolder(folder, tcDirectory);

  for (const stored of [
    "2019/2019-07/local-folder/IMG_0101.JPG",
    "2019/2019-07/local-folder/IMG_0102.JPG",
    "2020/2020-01/local-folder/IMG_0187.JPG",
    "2018/2018-05/local-folder/DSC_0042.JPG",
    "2021/2021-03/local-folder/IMG-20210305-WA0003.jpg",
  ]) {
    assert.equal(existsSync(path.join(tcDirectory, stored)), true, stored);
  }
  assert.equal(existsSync(path.join(tcDirectory, "local-folder")), false);
  assert.deepEqual(
    manifestOf(path.join(tcDirectory, "2019/2019-07/local-folder")).layout,
    { specId: "photo-path-layout", version: "0.1.0-draft" },
  );
  const importEntry = entries.find((entry) => entry.event === "import")!;
  assert.equal(importEntry.layout, "photo-path-layout");
  assert.equal(importEntry.files, 5);
});

test("R-SRC-20, R-FOUND-3: under photo-path layout, a file it does not place keeps its Supplied path under supplied-path layout, and is logged", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "notes.txt": "notes" });
  copyPhotos(folder, { "IMG_0101.JPG": "phone/IMG_0101.JPG" });
  const entries = collectEntries(t);

  await importFolder(folder, tcDirectory);

  assert.equal(
    existsSync(
      path.join(tcDirectory, "2019/2019-07/local-folder/IMG_0101.JPG"),
    ),
    true,
  );
  assert.equal(existsSync(storedDirectory(tcDirectory, "IMG_0101.JPG")), false);
  assert.equal(
    readFileSync(storedDirectory(tcDirectory, "notes.txt"), "utf8"),
    "notes",
  );
  assert.deepEqual(manifestOf(storedDirectory(tcDirectory)).layout, {
    specId: "supplied-path-layout",
    version: "0.1.0-draft",
  });
  assert.deepEqual(
    entries
      .filter((entry) => entry.event === "floored")
      .map((entry) => entry.path),
    [path.join(folder, "notes.txt")],
  );
});

test("R-LOCALFOLDER-5, R-PHOTO-1: a directory holding no photo, whatever its files' names, is imported under supplied-path layout", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = makeFolder(temporary, { "IMG_0101.JPG": "not a JPEG" });
  const entries = collectEntries(t);

  await importFolder(folder, tcDirectory);

  assert.equal(
    readFileSync(storedDirectory(tcDirectory, "IMG_0101.JPG"), "utf8"),
    "not a JPEG",
  );
  const importEntry = entries.find((entry) => entry.event === "import")!;
  assert.equal(importEntry.layout, "supplied-path-layout");
  assert.equal(
    entries.some((entry) => entry.event === "floored"),
    false,
  );
});

test("R-PHOTO-8: each photo whose date is uncertain is logged, with that date and what it was read from", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = path.join(temporary, "moon-photos");
  cpSync(MoonPhotos, folder, { recursive: true });
  const entries = collectEntries(t);

  await importFolder(folder, tcDirectory);

  assert.deepEqual(
    entries
      .filter((entry) => entry.event === "uncertain-date")
      .map((entry) => [
        path.basename(String(entry.path)),
        entry.governingTimestamp,
        entry.readFrom,
      ])
      .sort(),
    [
      ["DSC_0042.JPG", "2018-05-20T08:00:00", "capture time with no offset"],
      ["IMG-20210305-WA0003.jpg", "2021-03-05", "filename"],
    ],
  );
});

test("R-SRC-23, R-SRC-26: of two different photos given one name and taken in one month, the second by Supplied path is left out and recorded, and the run ends with an error", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  const folder = path.join(temporary, "moon-photos");
  copyPhotos(folder, {
    "a/IMG_0101.JPG": "phone/IMG_0101.JPG",
    "b/IMG_0101.JPG": "phone/IMG_0102.JPG",
  });

  await assert.rejects(
    importFolder(folder, tcDirectory),
    /1 file left out of the collection/,
  );

  const stored = path.join(tcDirectory, "2019/2019-07/local-folder");
  assert.deepEqual(
    readFileSync(path.join(stored, "IMG_0101.JPG")),
    readFileSync(path.join(MoonPhotos, "phone/IMG_0101.JPG")),
  );
  const errorFile = onlyReceiptOf(stored, "-main.error.json");
  assert.match(
    (errorFile.importErrors as { message: string }[])[0]!.message,
    /b[\\/]IMG_0101\.JPG" is left out: .* holds other content/,
  );
});

test("R-LOCALFOLDER-3: a photo whose place by date the TC Copy's ignore file ignores is not imported, nor kept at its Supplied path", async (t) => {
  const temporary = temporaryDirectory(t);
  const { tcDirectory } = makeTcCopy(temporary);
  writeFileSync(path.join(tcDirectory, ".tcignore"), "2019/\n");
  const folder = path.join(temporary, "moon-photos");
  copyPhotos(folder, {
    "IMG_0101.JPG": "phone/IMG_0101.JPG",
    "IMG_0187.JPG": "phone/IMG_0187.JPG",
  });

  await importFolder(folder, tcDirectory);

  assert.equal(
    existsSync(
      path.join(tcDirectory, "2020/2020-01/local-folder/IMG_0187.JPG"),
    ),
    true,
  );
  assert.equal(existsSync(path.join(tcDirectory, "2019")), false);
  assert.equal(existsSync(path.join(tcDirectory, "local-folder")), false);
});
