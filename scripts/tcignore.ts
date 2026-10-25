import { lstatSync, readFileSync } from "node:fs";
import path from "node:path";

import ignore from "ignore";

// A copy's ignore file, `.tcignore` (meta-file-spec.md R-MFILE-20).

// Where a copy whose root is `copyRoot` keeps its ignore file (R-MFILE-2).
export function ignoreFileOf(copyRoot: string): string {
  return path.join(copyRoot, ".tcignore");
}

// Patterns of an ignore file of a copy at `copyRoot`: none where that copy
// has no ignore file (R-MFILE-20).
export function readIgnoreFile(copyRoot: string): IgnorePattern[] {
  const file = ignoreFileOf(copyRoot);
  if (lstatSync(file, { throwIfNoEntry: false }) === undefined) {
    return [];
  }
  return readIgnorePatterns(readFileSync(file, "utf8"));
}

// One pattern of an ignore file: its line's number, counted from 1, and that
// line as written.
export type IgnorePattern = {
  line: number;
  text: string;
};

// Patterns of an ignore file whose content is `text`: one pattern per line,
// where a blank line is skipped and a line beginning with `#` is a comment
// (R-MFILE-20).
//
// Takes text and returns data, so it can be tested without a filesystem.
export function readIgnorePatterns(text: string): IgnorePattern[] {
  const patterns: IgnorePattern[] = [];
  for (const [index, lineText] of text.split(/\r?\n/).entries()) {
    if (lineText.trim() === "" || lineText.startsWith("#")) {
      continue;
    }
    patterns.push({ line: index + 1, text: lineText });
  }
  return patterns;
}

// Whether a path is ignored. Where more than one pattern matches, whichever
// comes last decides, as in a `.gitignore`.
//
// `path` is relative to a copy's root, with `/` between its segments. A
// directory's path ends in `/`, which is how npm package `ignore` tells one: a
// pattern ending in `/` matches a directory and not a file.
export type IsIgnored = (path: string) => boolean;

// A test of whether `patterns` ignore a path. Pattern syntax and matching are
// those of a `.gitignore` (R-MFILE-20), and are done by npm package `ignore`,
// used as it comes (turbo-collection-spec.md Section 12).
export function compileIgnorePatterns(
  patterns: readonly IgnorePattern[],
): IsIgnored {
  const matcher = ignore().add(patterns.map((pattern) => pattern.text));
  return (path) => matcher.ignores(path);
}
