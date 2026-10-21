import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { URL } from "node:url";

import { compileIgnorePatterns, readIgnorePatterns } from "../tcignore.ts";

const starterIgnoreFile = readFileSync(
  new URL("../templates/default.tcignore", import.meta.url),
  "utf8",
);

// A test of whether a path is ignored by an ignore file whose content
// is `text`.
function isIgnoredBy(text: string): (path: string) => boolean {
  const ignoringPattern = compileIgnorePatterns(readIgnorePatterns(text));
  return (path) => ignoringPattern(path) !== undefined;
}

test("R-MFILE-20: each line is one pattern, numbered from 1", () => {
  assert.deepEqual(readIgnorePatterns(".DS_Store\nThumbs.db\n"), [
    { line: 1, text: ".DS_Store" },
    { line: 2, text: "Thumbs.db" },
  ]);
});

test("R-MFILE-20: a blank line is skipped, and still counts as a line", () => {
  assert.deepEqual(readIgnorePatterns(".DS_Store\n\n   \nThumbs.db"), [
    { line: 1, text: ".DS_Store" },
    { line: 4, text: "Thumbs.db" },
  ]);
});

test("R-MFILE-20: a text that holds no pattern gives none", () => {
  assert.deepEqual(readIgnorePatterns(""), []);
  assert.deepEqual(readIgnorePatterns("\n# only a comment\n"), []);
});

test("R-MFILE-20: a line beginning with # is a comment", () => {
  assert.deepEqual(readIgnorePatterns("# macOS\n.DS_Store\n#Thumbs.db\n"), [
    { line: 2, text: ".DS_Store" },
  ]);
});

test("R-MFILE-20: a # that does not begin its line is part of a pattern", () => {
  assert.deepEqual(readIgnorePatterns("photo#1.jpg\n\\#notes\n"), [
    { line: 1, text: "photo#1.jpg" },
    { line: 2, text: "\\#notes" },
  ]);
});

test("R-MFILE-20: a line ends at LF or at CRLF", () => {
  assert.deepEqual(
    readIgnorePatterns("# Windows\r\nThumbs.db\r\n\r\n$RECYCLE.BIN/\r\n"),
    readIgnorePatterns("# Windows\nThumbs.db\n\n$RECYCLE.BIN/\n"),
  );
});

test("R-MFILE-20: the starter ignore file reads as its patterns, without its comments", () => {
  const texts = readIgnorePatterns(starterIgnoreFile).map(
    (pattern) => pattern.text,
  );

  for (const expected of [".DS_Store", "Thumbs.db", "$RECYCLE.BIN/"]) {
    assert.ok(texts.includes(expected), `${expected} is a starter pattern`);
  }
  for (const text of texts) {
    assert.ok(!text.startsWith("#"), `"${text}" is not a comment`);
    assert.notEqual(text.trim(), "", "no pattern is blank");
  }
});

test("R-MFILE-20: a pattern with no slash matches at any depth below the copy root", () => {
  const isIgnored = isIgnoredBy(".DS_Store\n");

  assert.equal(isIgnored(".DS_Store"), true);
  assert.equal(isIgnored("2019/trip/.DS_Store"), true);
  assert.equal(isIgnored("2019/trip/photo.jpg"), false);
});

test("R-MFILE-20: a pattern beginning with a slash matches at the copy root only", () => {
  const isIgnored = isIgnoredBy("/notes.txt\n");

  assert.equal(isIgnored("notes.txt"), true);
  assert.equal(isIgnored("2019/notes.txt"), false);
});

test("R-MFILE-20: a pattern ending in a slash matches a directory and what it holds, not a file", () => {
  const isIgnored = isIgnoredBy("__MACOSX/\n");

  assert.equal(isIgnored("__MACOSX/"), true);
  assert.equal(isIgnored("2019/__MACOSX/photo.jpg"), true);
  assert.equal(isIgnored("__MACOSX"), false);
});

test("R-MFILE-20: *, ? and a range match within one name", () => {
  const isIgnored = isIgnoredBy("._*\nphoto-?.tmp\nscan-[0-9].tmp\n");

  assert.equal(isIgnored("2019/._photo.jpg"), true);
  assert.equal(isIgnored("photo-1.tmp"), true);
  assert.equal(isIgnored("photo-12.tmp"), false);
  assert.equal(isIgnored("scan-7.tmp"), true);
  assert.equal(isIgnored("scan-x.tmp"), false);
  assert.equal(isIgnored("2019/photo.jpg"), false);
});

test("R-MFILE-20: a pattern beginning with ! keeps in what an earlier pattern ignores", () => {
  const isIgnored = isIgnoredBy("*.mov\n!keep.mov\n");

  assert.equal(isIgnored("2019/clip.mov"), true);
  assert.equal(isIgnored("2019/keep.mov"), false);
});

test("R-MFILE-20: the starter patterns ignore what an operating system leaves behind, and no photograph", () => {
  const isIgnored = isIgnoredBy(starterIgnoreFile);

  for (const path of [
    ".DS_Store",
    "2019/trip/.DS_Store",
    "2019/trip/._IMG_0001.jpg",
    "2019/Thumbs.db",
    "2019/desktop.ini",
    "$RECYCLE.BIN/",
    ".Spotlight-V100/",
    "__MACOSX/2019/IMG_0001.jpg",
  ]) {
    assert.equal(isIgnored(path), true, `${path} is ignored`);
  }
  for (const path of ["IMG_0001.jpg", "2019/", "2019/trip/IMG_0001.jpg"]) {
    assert.equal(isIgnored(path), false, `${path} is not ignored`);
  }
});
