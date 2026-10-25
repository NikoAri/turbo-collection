import assert from "node:assert/strict";
import type { Buffer } from "node:buffer";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { mock, test, type TestContext } from "node:test";

import { backUp } from "../backup.ts";
import { importIntoTcCopy } from "../import.ts";
import { initializeTc } from "../init.ts";
import { logEntryOf, logger, type LogEntry } from "../logger.ts";

// What these tests make a backup log is shown nowhere, unless a test
// collects it.
mock.method(logger, "log", () => {});
mock.method(logger, "error", () => {});

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

// A new run ID for each run, so that two runs in one test write receipt
// files of two names.
let runCount = 0;
function nextRunId(): string {
  runCount++;
  return `20261023T120000Z-${runCount.toString(16).padStart(4, "0")}`;
}

// Imports into `tcDirectory` a new directory named `name` in `parent`, holding
// `files`, each a path relative to it with its content.
let folderCount = 0;
async function importFolder(
  parent: string,
  tcDirectory: string,
  name: string,
  files: Record<string, string>,
): Promise<void> {
  folderCount++;
  const folder = path.join(parent, `folders-${folderCount}`, name);
  for (const [relativePath, content] of Object.entries(files)) {
    writeFileUnder(folder, relativePath, content);
  }
  await importIntoTcCopy(
    { importDirectory: folder, tcDirectory, dryRun: false },
    nextRunId(),
  );
}

// Backs up `a` and `b`, naming a TC Copy it makes `tcCopyName`.
async function backUpTcCopies(
  a: string,
  b: string,
  {
    tcCopyName,
    dryRun = false,
  }: { tcCopyName?: string; dryRun?: boolean } = {},
): Promise<void> {
  await backUp({ directories: [a, b], tcCopyName, dryRun }, nextRunId());
}

// Two TC Copies of one collection in `parent`: `main`, made by init, and
// `home`, made by a backup of it.
async function makeTwoTcCopies(
  parent: string,
): Promise<{ main: string; home: string }> {
  const main = path.join(parent, "main");
  initializeTc({ directory: main });
  const home = path.join(parent, "home");
  await backUpTcCopies(main, home, { tcCopyName: "home" });
  return { main, home };
}

// Where a TC Copy at `tcDirectory` holds what an import of a directory named
// `name` stores at `relativePath` under it.
function stored(tcDirectory: string, name: string, relativePath = ""): string {
  return path.join(tcDirectory, "local-folder", name, relativePath);
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

// Names of `directory`'s receipt files, sorted.
function receiptsOf(directory: string): string[] {
  const metaDirectory = path.join(directory, ".turbo-collection");
  if (!existsSync(metaDirectory)) {
    return [];
  }
  return readdirSync(metaDirectory)
    .filter((name) => name.startsWith("receipt-"))
    .sort();
}

// `tcDirectory`'s configuration, parsed.
function configurationOf(tcDirectory: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(
      path.join(
        tcDirectory,
        ".turbo-collection",
        "turbo-collection-config.json",
      ),
      "utf8",
    ),
  );
}

test("R-BACKUP-1, R-BACKUP-2, R-MFILE-19: a backup makes a TC Copy of its collection in a directory that does not exist, with the name given, the other TC Copy's ignore file and every file", async (t) => {
  const temporary = temporaryDirectory(t);
  const main = path.join(temporary, "main");
  const mainConfig = initializeTc({ directory: main });
  await importFolder(temporary, main, "moon-laptop", { "a.txt": "a" });
  const home = path.join(temporary, "drive", "photos");

  await backUpTcCopies(main, home, { tcCopyName: "home" });

  const homeConfig = configurationOf(home);
  assert.equal(homeConfig.collectionId, mainConfig.collectionId);
  assert.equal(homeConfig.collectionName, mainConfig.collectionName);
  assert.equal(homeConfig.tcCopyName, "home");
  assert.equal(
    readFileSync(path.join(home, ".tcignore"), "utf8"),
    readFileSync(path.join(main, ".tcignore"), "utf8"),
  );
  assert.equal(readFileSync(stored(home, "moon-laptop", "a.txt"), "utf8"), "a");
});

test("R-BACKUP-4, R-BACKUP-13, R-REC-6: a backup copies into each TC Copy what the other holds, with the same manifest entries, and both TC Copies end with every receipt file", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "a.txt": "a" });
  await importFolder(temporary, home, "phone", { "b.txt": "b" });

  await backUpTcCopies(main, home);

  assert.equal(readFileSync(stored(home, "laptop", "a.txt"), "utf8"), "a");
  assert.equal(readFileSync(stored(main, "phone", "b.txt"), "utf8"), "b");
  for (const name of ["laptop", "phone"]) {
    assert.deepEqual(
      manifestOf(stored(main, name)),
      manifestOf(stored(home, name)),
    );
    const receipts = receiptsOf(stored(main, name));
    assert.deepEqual(receipts, receiptsOf(stored(home, name)));
    // An import's arrival, and a backup's for the TC Copy it copied into
    assert.equal(
      receipts.filter((receipt) => receipt.endsWith(".arrival.json")).length,
      2,
    );
  }
});

test("R-BACKUP-7, R-LOG-15, R-LOG-16: a backup of TC Copies in agreement copies nothing and writes no receipt file", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "a.txt": "a" });
  await backUpTcCopies(main, home);
  const receipts = receiptsOf(stored(home, "laptop"));
  const entries = collectEntries(t);

  await backUpTcCopies(main, home);

  assert.deepEqual(receiptsOf(stored(home, "laptop")), receipts);
  assert.equal(entries.filter((entry) => entry.event === "transfer").length, 0);
  assert.deepEqual(
    entries
      .filter((entry) => entry.event === "mirror")
      .map((entry) => [entry.tcCopyName, entry.files, entry.bytes]),
    [
      ["home", 0, 0],
      ["main", 0, 0],
    ],
  );
});

test("R-LOG-15, R-LOG-16: a backup records each file it copies, and how many files and bytes it copied into each TC Copy", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "a.txt": "aaa" });
  const entries = collectEntries(t);

  await backUpTcCopies(main, home);

  assert.deepEqual(
    entries
      .filter((entry) => entry.event === "transfer")
      .map((entry) => [entry.from, entry.to, entry.size]),
    [[stored(main, "laptop", "a.txt"), stored(home, "laptop", "a.txt"), 3]],
  );
  assert.deepEqual(
    entries
      .filter((entry) => entry.event === "mirror")
      .map((entry) => [entry.path, entry.tcCopyName, entry.files, entry.bytes]),
    [
      [home, "home", 1, 3],
      [main, "main", 0, 0],
    ],
  );
});

test("R-BACKUP-1: a backup given no TC Directory, TC Copies of two collections, two TC Copies of one name, or a name where it makes no TC Copy, is refused", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  const other = path.join(temporary, "other");
  initializeTc({ directory: other, collectionName: "Other" });
  const empty = path.join(temporary, "empty");

  await assert.rejects(
    backUpTcCopies(empty, path.join(temporary, "empty-too")),
    /nor .* is a TC Directory/,
  );
  await assert.rejects(
    backUpTcCopies(main, other),
    /holds a TC Copy of the collection .* and .* holds a TC Copy of the collection "Other"/,
  );
  await assert.rejects(
    backUpTcCopies(main, home, { tcCopyName: "x" }),
    /--tc-copy/,
  );
  await assert.rejects(backUpTcCopies(main, main), /given .* twice/);
  assert.equal(existsSync(empty), false);

  const configurationFile = path.join(
    home,
    ".turbo-collection",
    "turbo-collection-config.json",
  );
  writeFileSync(
    configurationFile,
    JSON.stringify({ ...configurationOf(home), tcCopyName: "MAIN" }, null, 2),
  );
  await assert.rejects(
    backUpTcCopies(main, home),
    /one name without regard to letter case/,
  );
});

test("R-BACKUP-1, R-MFILE-19: a backup that would make a TC Copy is refused before it makes a directory, given no name, a name that is not valid, or the other TC Copy's name in another letter case", async (t) => {
  const temporary = temporaryDirectory(t);
  const main = path.join(temporary, "main");
  initializeTc({ directory: main });
  const home = path.join(temporary, "drive", "home");

  await assert.rejects(backUpTcCopies(main, home), /with --tc-copy/);
  await assert.rejects(
    backUpTcCopies(main, home, { tcCopyName: "a/b" }),
    /cannot be a TC Copy's name/,
  );
  await assert.rejects(
    backUpTcCopies(main, home, { tcCopyName: "MAIN" }),
    /is the name of the TC Copy this backup mirrors/,
  );
  assert.equal(existsSync(path.join(temporary, "drive")), false);
});

test("R-BACKUP-1: a backup does not make a TC Copy in a directory holding a file the other TC Copy's ignore file does not ignore, and names that file", async (t) => {
  const temporary = temporaryDirectory(t);
  const main = path.join(temporary, "main");
  initializeTc({ directory: main });
  const home = path.join(temporary, "home");
  writeFileUnder(home, "notes.txt");
  writeFileUnder(home, ".DS_Store");
  const entries = collectEntries(t);

  await assert.rejects(
    backUpTcCopies(main, home, { tcCopyName: "home" }),
    /holds 1 file that the ignore file of/,
  );
  assert.deepEqual(
    entries
      .filter((entry) => entry.event === "file-not-ignored")
      .map((entry) => entry.file),
    ["notes.txt"],
  );
  assert.equal(existsSync(path.join(home, ".turbo-collection")), false);
});

test("R-BACKUP-15: a backup of TC Copies whose ignore files hold other patterns is refused, and one whose files differ only in a comment is not", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  const ignoreFile = path.join(home, ".tcignore");
  const text = readFileSync(ignoreFile, "utf8");

  writeFileSync(ignoreFile, `${text}*.tmp\n`);
  await assert.rejects(
    backUpTcCopies(main, home),
    /\.tcignore" and ".*\.tcignore" hold different patterns/,
  );

  writeFileSync(ignoreFile, `# A comment of this TC Copy alone\r\n${text}`);
  await backUpTcCopies(main, home);
});

test("R-BACKUP-4, R-INT-7: a file whose two TC Copies differ is copied over neither, is reported, and every other file is still copied", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "a.txt": "main's" });
  await importFolder(temporary, home, "laptop", { "a.txt": "home's" });
  await importFolder(temporary, main, "phone", { "b.txt": "b" });
  const entries = collectEntries(t);

  await assert.rejects(backUpTcCopies(main, home), /found 1 problem/);

  assert.equal(readFileSync(stored(main, "laptop", "a.txt"), "utf8"), "main's");
  assert.equal(readFileSync(stored(home, "laptop", "a.txt"), "utf8"), "home's");
  assert.equal(readFileSync(stored(home, "phone", "b.txt"), "utf8"), "b");
  assert.ok(
    entries.some(
      (entry) =>
        entry.outcome === "failure" &&
        /laptop\/a\.txt" differs between TC Copy "main" .* and TC Copy "home"/.test(
          String(entry.message),
        ),
    ),
  );
});

test("R-BACKUP-9, R-BACKUP-12: a file no manifest lists is copied nowhere and reported, and one an interrupted backup left is written over in silence", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "a.txt": "a" });
  // What a stopped backup leaves: part of a file at its path, unlisted
  writeFileUnder(stored(home, "laptop"), "a.txt", "half");
  writeFileUnder(stored(main, "laptop"), "by-hand.txt", "by hand");
  const entries = collectEntries(t);

  await assert.rejects(backUpTcCopies(main, home), /found 1 problem/);

  assert.equal(readFileSync(stored(home, "laptop", "a.txt"), "utf8"), "a");
  assert.deepEqual(
    (manifestOf(stored(home, "laptop")).files as { file: string }[]).map(
      (entry) => entry.file,
    ),
    ["a.txt"],
  );
  assert.equal(existsSync(stored(home, "laptop", "by-hand.txt")), false);
  assert.deepEqual(
    entries
      .filter((entry) => entry.outcome === "failure")
      .map((entry) => entry.path),
    [stored(main, "laptop", "by-hand.txt")],
  );
});

test("R-BACKUP-12, R-MFILE-13: a file that fails its checksum as it is copied is listed in no manifest where it was written, and is recorded in an error file of the TC Copy it was copied from", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "a.txt": "good" });
  // Silent corruption: the same length, other bytes
  writeFileSync(stored(main, "laptop", "a.txt"), "evil");

  await assert.rejects(backUpTcCopies(main, home), /found 1 problem/);

  assert.equal(
    existsSync(
      path.join(stored(home, "laptop"), ".turbo-collection", "manifest.json"),
    ),
    false,
  );
  const errorFiles = receiptsOf(stored(main, "laptop")).filter((name) =>
    name.endsWith("-home.error.json"),
  );
  assert.equal(errorFiles.length, 1);
  const errorFile = JSON.parse(
    readFileSync(
      path.join(stored(main, "laptop"), ".turbo-collection", errorFiles[0]!),
      "utf8",
    ),
  );
  assert.match(errorFile.mirrorErrors[0].message, /its checksum is/);
  assert.equal(errorFile.tcCopyName, "home");
  // That error file reaches the other TC Copy too
  assert.ok(receiptsOf(stored(home, "laptop")).includes(errorFiles[0]!));
});

test("R-BACKUP-4, R-BACKUP-13: a file a TC Copy lost while its manifest lists it is copied back, and that manifest ends as it was", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "a.txt": "a", "b.txt": "b" });
  await backUpTcCopies(main, home);
  rmSync(stored(home, "laptop", "a.txt"));
  const homeManifest = manifestOf(stored(home, "laptop"));

  await backUpTcCopies(main, home);

  assert.equal(readFileSync(stored(home, "laptop", "a.txt"), "utf8"), "a");
  assert.deepEqual(manifestOf(stored(home, "laptop")), homeManifest);
});

test("R-BACKUP-10: a dry run of a backup makes no TC Copy, copies nothing, and records what a real backup would copy", async (t) => {
  const temporary = temporaryDirectory(t);
  const main = path.join(temporary, "main");
  initializeTc({ directory: main });
  await importFolder(temporary, main, "laptop", { "a.txt": "aaa" });
  const home = path.join(temporary, "home");
  const entries = collectEntries(t);

  await backUpTcCopies(main, home, { tcCopyName: "home", dryRun: true });

  assert.equal(existsSync(home), false);
  assert.deepEqual(
    entries
      .filter((entry) => entry.event === "transfer")
      .map((entry) => [entry.to, entry.size]),
    [[stored(home, "laptop", "a.txt"), 3]],
  );
  assert.deepEqual(
    entries
      .filter((entry) => entry.event === "mirror")
      .map((entry) => [entry.tcCopyName, entry.files, entry.bytes]),
    [
      ["home", 1, 3],
      ["main", 0, 0],
    ],
  );
});

test("R-BACKUP-14: a directory whose manifests name another import source has nothing copied into it, and the backup fails once it has mirrored the rest", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "a.txt": "a" });
  await importFolder(temporary, home, "laptop", { "b.txt": "b" });
  await importFolder(temporary, main, "phone", { "c.txt": "c" });
  const manifestFile = path.join(
    stored(home, "laptop"),
    ".turbo-collection",
    "manifest.json",
  );
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  manifest.importSource.specId = "icloud";
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

  await assert.rejects(backUpTcCopies(main, home), /found 1 problem/);

  assert.equal(existsSync(stored(home, "laptop", "a.txt")), false);
  assert.equal(existsSync(stored(main, "laptop", "b.txt")), false);
  assert.equal(readFileSync(stored(home, "phone", "c.txt"), "utf8"), "c");
});

test("R-TGT-14: a file two TC Copies list in two letter cases is one file, and a backup copies nothing for it", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "Photo.jpg": "photo" });
  await backUpTcCopies(main, home);
  // TC Copy `home` spells that file in lower case, on disk and in its manifest
  const directory = stored(home, "laptop");
  renameSync(path.join(directory, "Photo.jpg"), path.join(directory, "temp"));
  renameSync(path.join(directory, "temp"), path.join(directory, "photo.jpg"));
  const manifestFile = path.join(
    directory,
    ".turbo-collection",
    "manifest.json",
  );
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  manifest.files[0].file = "photo.jpg";
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  const entries = collectEntries(t);

  await backUpTcCopies(main, home);

  assert.equal(entries.filter((entry) => entry.event === "transfer").length, 0);
  assert.deepEqual(readdirSync(directory).sort(), [
    ".turbo-collection",
    "photo.jpg",
  ]);
});

test("R-CLI-19: a backup of a TC Copy holding a link copies nothing, and names the link", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "a.txt": "a" });
  const target = path.join(temporary, "elsewhere");
  mkdirSync(target);
  // A junction on Windows, which needs no administrator; a symbolic link
  // elsewhere
  symlinkSync(target, path.join(stored(main, "laptop"), "latest"), "junction");
  const entries = collectEntries(t);

  await assert.rejects(backUpTcCopies(main, home), /copies nothing/);

  assert.equal(existsSync(stored(home, "laptop")), false);
  assert.ok(
    entries.some(
      (entry) => entry.path === path.join(stored(main, "laptop"), "latest"),
    ),
  );
});

// Every file under `directory`, by its path relative to `directory` with `/`
// between segments, with its bytes.
function filesUnder(directory: string): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  for (const relativePath of readdirSync(directory, {
    recursive: true,
    encoding: "utf8",
  })) {
    const file = path.join(directory, relativePath);
    if (statSync(file).isFile()) {
      files.set(relativePath.split(path.sep).join("/"), readFileSync(file));
    }
  }
  return files;
}

test("R-BACKUP-5: a backup writes into a TC Copy only the content files it copies, manifests and receipt files, and every other file there stays as it was", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "a.txt": "a" });
  await importFolder(temporary, home, "laptop", { "b.txt": "b" });
  const before = filesUnder(home);

  await backUpTcCopies(main, home);

  const after = filesUnder(home);
  for (const [file, bytes] of before) {
    if (!file.endsWith("/.turbo-collection/manifest.json")) {
      assert.deepEqual(after.get(file), bytes, file);
    }
  }
  assert.deepEqual(
    [...after.keys()].filter(
      (file) =>
        !before.has(file) &&
        !/\/\.turbo-collection\/receipt-[^/]+\.json$/.test(file),
    ),
    ["local-folder/laptop/a.txt"],
  );
});

test("R-BACKUP-10, R-BACKUP-12: a dry run refuses a file whose length is not its manifest's, as a real backup does, and records no transfer of it", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "a.txt": "a", "b.txt": "b" });
  writeFileSync(stored(main, "laptop", "a.txt"), "longer than it was");
  const entries = collectEntries(t);

  await assert.rejects(
    backUpTcCopies(main, home, { dryRun: true }),
    /found 1 problem/,
  );

  assert.deepEqual(
    entries
      .filter((entry) => entry.event === "transfer")
      .map((entry) => entry.from),
    [stored(main, "laptop", "b.txt")],
  );
  assert.equal(existsSync(stored(home, "laptop")), false);
});

test("R-REC-6, R-REC-7: a receipt file a TC Copy holds already is never written over by the other TC Copy's file of that name", async (t) => {
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "a.txt": "a" });
  const [receipt] = receiptsOf(stored(main, "laptop"));
  const held = path.join(stored(home, "laptop"), ".turbo-collection", receipt!);
  writeFileUnder(path.dirname(held), receipt!, "home's own bytes");

  await backUpTcCopies(main, home);

  assert.equal(readFileSync(held, "utf8"), "home's own bytes");
});

test("R-BACKUP-8: a backup that cannot write into one TC Copy still copies into the other, and reports each failure", async (t) => {
  if (process.platform === "win32" || process.getuid?.() === 0) {
    t.skip(
      "a read-only directory stops a write only under Linux and macOS, and not for root",
    );
    return;
  }
  const temporary = temporaryDirectory(t);
  const { main, home } = await makeTwoTcCopies(temporary);
  await importFolder(temporary, main, "laptop", { "a.txt": "a" });
  await importFolder(temporary, home, "phone", { "b.txt": "b" });
  // TC Copy `home` takes no new directory under local-folder/
  const readOnly = path.join(home, "local-folder");
  chmodSync(readOnly, 0o555);
  const entries = collectEntries(t);

  try {
    await assert.rejects(backUpTcCopies(main, home), /found \d+ problems?/);
  } finally {
    chmodSync(readOnly, 0o755);
  }

  assert.equal(readFileSync(stored(main, "phone", "b.txt"), "utf8"), "b");
  assert.equal(existsSync(stored(home, "laptop", "a.txt")), false);
  assert.ok(
    entries.some(
      (entry) =>
        entry.outcome === "failure" &&
        /a\.txt" is not copied to TC Copy "home"/.test(String(entry.message)),
    ),
  );
});
