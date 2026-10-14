import ignore from "ignore";

// A copy's ignore file, `.tcignore` (meta-file-spec.md R-MFILE-20).

// One pattern of an ignore file: the number of its line, counted from 1, and that line as written.
export type IgnorePattern = {
  line: number;
  text: string;
};

// The patterns of an ignore file whose content is `text`: one pattern per line, where a blank line
// is skipped and a line beginning with `#` is a comment (R-MFILE-20).
//
// Takes text and returns data, so it can be tested without the filesystem.
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

// Says whether a path is ignored.
//
// `path` is relative to the copy root, with `/` between its segments. The path of a directory ends
// in `/`, which is how the `ignore` package tells one: a pattern ending in `/` matches a directory
// and not a file.
export type IsIgnored = (path: string) => boolean;

// A test of whether a path is ignored by `patterns`. Pattern syntax and matching are those of a
// `.gitignore` (R-MFILE-20), and are the work of the `ignore` package, used as it comes
// (turbo-collection-spec.md Section 12).
export function compileIgnorePatterns(
  patterns: readonly IgnorePattern[],
): IsIgnored {
  const matcher = ignore().add(patterns.map((pattern) => pattern.text));
  return (path) => matcher.ignores(path);
}
