import assert from "node:assert/strict";
import { test } from "node:test";

import type { CopyContents, DirectoryContents } from "../copy-contents.ts";
import type { Manifest, ManifestEntry } from "../meta-files.ts";
import { planMirror } from "../mirror.ts";

// An entry listing `file`, whose checksum `checksum` stands for a SHA-256
// checksum, since a plan only compares checksums.
function entry(file: string, checksum = `checksum of ${file}`): ManifestEntry {
  return { file, size: 1, checksum };
}

// A manifest listing `entries`, of content that `importSource` placed under
// `layout`, both at `version`.
function manifest(
  entries: ManifestEntry[],
  {
    importSource = "local-folder",
    layout = "supplied-path-layout",
    version = "0.1.0-draft",
  } = {},
): Manifest {
  return {
    version: "0.1.0-draft",
    layout: { specId: layout, version },
    importSource: { specId: importSource, version },
    checksumAlgorithm: "SHA-256",
    files: entries,
  };
}

// What a directory holds: content files at their paths, by name, its
// manifest where it has one, and its receipt files.
function directory({
  files = [],
  manifest,
  receiptFiles = [],
}: {
  files?: string[];
  manifest?: Manifest;
  receiptFiles?: string[];
}): DirectoryContents {
  return { files: new Set(files), manifest, receiptFiles };
}

// A directory holding a file at its path for each of `entries`, which its
// manifest lists.
function holding(...entries: ManifestEntry[]): DirectoryContents {
  return directory({
    files: entries.map((listed) => listed.file),
    manifest: manifest(entries),
  });
}

// What a copy holds: `directories`, each by its path.
function copy(directories: Record<string, DirectoryContents>): CopyContents {
  return {
    directories: new Map(Object.entries(directories)),
    notRegular: [],
    unrecognized: [],
  };
}

// A receipt file's name, of run number `run` and copy `copyName`.
function receipt(run: number, copyName: string, kind: string): string {
  return `receipt-20261022T150000Z-000${run}-${copyName}.${kind}.json`;
}

test("R-BACKUP-4, R-BACKUP-13: a mirror copies into each copy every content file the other holds and it does not, each with every field of its entry", () => {
  const dated = { ...entry("a.jpg"), date: "2024-08-01T10:00:00" };

  const plan = planMirror(
    copy({ "": directory({}), d: holding(dated), e: holding(entry("c.txt")) }),
    copy({ "": directory({}), d: holding(entry("b.jpg")) }),
  );

  assert.deepEqual(plan.b.directories, [
    {
      from: "d",
      to: "d",
      files: [{ from: "a.jpg", entry: dated }],
      receiptFiles: [],
    },
    {
      from: "e",
      to: "e",
      files: [{ from: "c.txt", entry: entry("c.txt") }],
      receiptFiles: [],
    },
  ]);
  assert.deepEqual(plan.a.directories, [
    {
      from: "d",
      to: "d",
      files: [{ from: "b.jpg", entry: entry("b.jpg") }],
      receiptFiles: [],
    },
  ]);
  assert.deepEqual(plan.differing, []);
  assert.deepEqual(plan.mismatched, []);
  assert.deepEqual(plan.a.unlisted, []);
  assert.deepEqual(plan.b.unlisted, []);
});

test("R-BACKUP-7: copies in agreement have nothing copied into either", () => {
  const contents = () =>
    copy({
      "": directory({ receiptFiles: [receipt(1, "main", "location")] }),
      d: holding(entry("a.jpg")),
    });

  const plan = planMirror(contents(), contents());

  assert.deepEqual(plan, {
    a: { directories: [], unlisted: [], heldTwice: [] },
    b: { directories: [], unlisted: [], heldTwice: [] },
    differing: [],
    mismatched: [],
  });
});

test("R-BACKUP-4: a content file whose manifests state two checksums is copied into neither copy, and is reported, whether both copies hold it or one does", () => {
  const plan = planMirror(
    copy({ d: holding(entry("both.jpg", "1"), entry("one.jpg", "1")) }),
    copy({
      d: directory({
        files: ["both.jpg"],
        manifest: manifest([entry("both.jpg", "2"), entry("one.jpg", "2")]),
      }),
    }),
  );

  assert.deepEqual(plan.differing, [
    {
      path: "d/both.jpg",
      a: entry("both.jpg", "1"),
      b: entry("both.jpg", "2"),
    },
    { path: "d/one.jpg", a: entry("one.jpg", "1"), b: entry("one.jpg", "2") },
  ]);
  assert.deepEqual(plan.a.directories, []);
  assert.deepEqual(plan.b.directories, []);
});

test("R-BACKUP-4: a file a copy has lost, while its manifest lists it with the checksum the other copy's manifest states, is copied back, and one both have lost is not", () => {
  const plan = planMirror(
    copy({
      d: directory({
        manifest: manifest([entry("lost.jpg"), entry("gone.jpg")]),
      }),
    }),
    copy({
      d: directory({
        files: ["lost.jpg"],
        manifest: manifest([entry("lost.jpg"), entry("gone.jpg")]),
      }),
    }),
  );

  assert.deepEqual(plan.a.directories, [
    {
      from: "d",
      to: "d",
      files: [{ from: "lost.jpg", entry: entry("lost.jpg") }],
      receiptFiles: [],
    },
  ]);
  assert.deepEqual(plan.b.directories, []);
});

test("R-BACKUP-12: a content file no manifest lists is copied nowhere, and is reported unless a file of the other copy is written over it", () => {
  const plan = planMirror(
    copy({
      d: directory({ files: ["by-hand.jpg", "left-over.jpg"] }),
      e: directory({ manifest: manifest([entry("lost.jpg")]) }),
    }),
    copy({
      d: holding(entry("left-over.jpg")),
      e: directory({ files: ["lost.jpg"] }),
    }),
  );

  assert.deepEqual(plan.a.directories, [
    {
      from: "d",
      to: "d",
      files: [{ from: "left-over.jpg", entry: entry("left-over.jpg") }],
      receiptFiles: [],
    },
  ]);
  assert.deepEqual(plan.a.unlisted, ["d/by-hand.jpg"]);
  assert.deepEqual(plan.b.directories, []);
  assert.deepEqual(plan.b.unlisted, ["e/lost.jpg"]);
});

test("R-BACKUP-14: a directory whose manifests name another import source or layout has nothing copied into it and is reported, every other directory is mirrored, and versions are not compared", () => {
  const plan = planMirror(
    copy({
      d: directory({
        files: ["a.jpg", "by-hand.jpg"],
        manifest: manifest([entry("a.jpg")]),
        receiptFiles: [receipt(1, "main", "arrival")],
      }),
      e: holding(entry("c.jpg")),
      f: directory({
        files: ["x.jpg"],
        manifest: manifest([entry("x.jpg")], { version: "0.2.0" }),
      }),
    }),
    copy({
      d: directory({
        files: ["b.jpg"],
        manifest: manifest([entry("b.jpg")], {
          importSource: "icloud",
          layout: "photo-path-layout",
        }),
      }),
      f: holding(entry("y.jpg")),
    }),
  );

  assert.deepEqual(
    plan.mismatched.map((mismatch) => mismatch.path),
    ["d"],
  );
  assert.deepEqual(
    plan.b.directories.map((copying) => copying.to),
    ["e", "f"],
  );
  assert.deepEqual(
    plan.a.directories.map((copying) => copying.to),
    ["f"],
  );
  assert.deepEqual(plan.a.unlisted, ["d/by-hand.jpg"]);
});

test("R-REC-6, R-REC-9: each copy gets every receipt file the other holds in a directory and it lacks, the root's location receipt files among them", () => {
  const plan = planMirror(
    copy({
      "": directory({ receiptFiles: [receipt(1, "main", "location")] }),
      d: directory({
        receiptFiles: [
          receipt(1, "main", "arrival"),
          receipt(2, "main", "error"),
        ],
      }),
      e: directory({ receiptFiles: [receipt(3, "main", "error")] }),
    }),
    copy({
      "": directory({}),
      d: directory({
        receiptFiles: [
          receipt(2, "main", "error"),
          receipt(4, "home", "arrival"),
        ],
      }),
    }),
  );

  assert.deepEqual(plan.b.directories, [
    {
      from: "",
      to: "",
      files: [],
      receiptFiles: [receipt(1, "main", "location")],
    },
    {
      from: "d",
      to: "d",
      files: [],
      receiptFiles: [receipt(1, "main", "arrival")],
    },
    {
      from: "e",
      to: "e",
      files: [],
      receiptFiles: [receipt(3, "main", "error")],
    },
  ]);
  assert.deepEqual(plan.a.directories, [
    {
      from: "d",
      to: "d",
      files: [],
      receiptFiles: [receipt(4, "home", "arrival")],
    },
  ]);
});

test("R-TGT-14: a mirror takes names that differ only in letter case or normalization for one, and writes at the spelling a copy already holds", () => {
  const cafeComposed = "café.jpg";
  const cafeDecomposed = "café.jpg";

  const plan = planMirror(
    copy({
      Photos: holding(
        entry("IMG_1.jpg", "1"),
        entry(cafeComposed, "2"),
        entry("LOST.jpg", "3"),
        entry("extra.jpg", "4"),
        entry("new.jpg", "5"),
      ),
      "Photos/2024": holding(entry("a.jpg")),
    }),
    copy({
      photos: directory({
        files: ["img_1.jpg", cafeDecomposed, "EXTRA.jpg"],
        manifest: manifest([
          entry("img_1.jpg", "1"),
          entry(cafeDecomposed, "2"),
          entry("lost.jpg", "3"),
        ]),
      }),
    }),
  );

  assert.deepEqual(plan.b.directories, [
    {
      from: "Photos",
      to: "photos",
      files: [
        { from: "LOST.jpg", entry: entry("lost.jpg", "3") },
        { from: "extra.jpg", entry: entry("EXTRA.jpg", "4") },
        { from: "new.jpg", entry: entry("new.jpg", "5") },
      ],
      receiptFiles: [],
    },
    {
      from: "Photos/2024",
      to: "photos/2024",
      files: [{ from: "a.jpg", entry: entry("a.jpg") }],
      receiptFiles: [],
    },
  ]);
  assert.deepEqual(plan.a.directories, []);
  assert.deepEqual(plan.b.unlisted, []);
  assert.deepEqual(plan.differing, []);
});

test("R-TGT-14, R-BACKUP-12: a path a copy holds in two spellings is reported, nothing is copied at it either way, and a file in it that no manifest lists is reported", () => {
  const plan = planMirror(
    copy({
      d: directory({
        files: ["a.jpg", "A.jpg", "b.jpg"],
        manifest: manifest([entry("a.jpg"), entry("b.jpg")]),
      }),
      e: holding(entry("c.jpg")),
      E: directory({
        files: ["C.jpg", "by-hand.jpg"],
        manifest: manifest([entry("C.jpg")]),
      }),
    }),
    copy({ d: directory({}) }),
  );

  assert.deepEqual(plan.a.heldTwice, [
    ["d/a.jpg", "d/A.jpg"],
    ["e", "E"],
  ]);
  assert.deepEqual(plan.a.unlisted, ["E/by-hand.jpg"]);
  assert.deepEqual(plan.b.directories, [
    {
      from: "d",
      to: "d",
      files: [{ from: "b.jpg", entry: entry("b.jpg") }],
      receiptFiles: [],
    },
  ]);
  assert.deepEqual(plan.b.heldTwice, []);
});
