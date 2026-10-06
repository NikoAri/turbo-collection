# The manifest is JSON, and nothing sits beside it

**Status:** Accepted
**Date:** 2026-08-16
**Replaces:** the 2026-08-13 record of the same topic, which required a second copy of every manifest
in checksum-utility format. That copy is withdrawn. The reversal is recorded below, because the
reasoning error is worth not repeating.

The manifest is a JSON document (RFC 8259, UTF-8) stating its `version`, the `layout` and
`importSource` that placed its directory, and its `checksumAlgorithm`, then one entry per file with
`file`, `size` and `checksum` (`R-MFILE-9`, `R-MFILE-10`). It is named `manifest.json` and covers the
content files of its own directory alone (`R-MFILE-8`). Nothing is written beside it.

## Why JSON rather than a checksum-utility format

The requirement once read "a standard, widely-readable checksum format, such that a standard checksum
utility can verify it without Turbo-Collection". That claimed more standardization than exists, and
all of this still holds:

- **`sha256sum` is a GNU program, not a standard.** POSIX specifies `cksum`. BSD ships a different
  tool with different output. macOS ships a Perl `shasum`. A single Windows machine was found on
  2026-08-10 carrying two implementations that behave differently depending on the shell.
- **The format is harder to parse correctly than JSON.** Binary-mode markers, backslash escaping for
  filenames containing newlines, no declared character encoding, and ambiguity around leading and
  trailing spaces in names.
- **It cannot carry its own metadata by documented means.** Recording the algorithm and the version
  stamp needs comment lines, and comment handling is documented by none of the three implementations
  tested, though all three honor it.

JSON is a frozen standard, declares its encoding, escapes strings unambiguously, and holds the
algorithm and the stamp as ordinary fields. `R-MFILE-27` also requires each field and each array
element on its own line, so the file stays processable without a JSON parser.

## Why the companion copy was withdrawn

The 2026-08-13 argument was that a future reader should not have to write anything, and that
`sha256sum -c` exists on every machine this project runs on today.

That argument assumed a reader who **holds a checksum utility but cannot obtain a format
conversion**. That reader is not real. Anyone able to obtain the conversion is equally able to obtain
the verification directly and skip the intermediate file, and the project now states this as a
standing assumption: see [a future reader has help](2026-08-16-future-reader-decision.md).

Note what the assumption does not license. The manifest still names its algorithm, carries its
version stamp, states its layout, and places one file per line, because an assistant can
act only on data that says what it is. The convenience was removed; the self-description was not.

## Rejected

- **Keeping the checksum format alone.** Neither as standard nor as parseable as the old requirement
  assumed.
- **`sha256sum --tag` (BSD-style) to carry the algorithm.** It names the algorithm per line by
  documented means, but the version stamp still needs a comment line and the parsing hazards remain.
- **JSON Lines, one object per line.** Proposed for corruption locality, then withdrawn: a byte flip
  inside a string value damages one entry either way, and a flip that breaks the parse leaves readable
  text a person repairs by hand. `R-TGT-9` is the real protection, putting an independent manifest on
  every copy, so three drives means three manifests and a corrupt one is found by comparison.
- **Keeping the companion anyway, on the grounds that it is cheap.** It is cheap in bytes and not free
  in obligation: a second file that can disagree with the first needed `R-INT-9`'s disagreement clause,
  `R-INT-1`'s exclusion clause and `R-INT-8`'s reporting clause to exist at all. Three clauses is what
  a redundant convenience actually cost.

## Touches

`R-INT-9` withdrawn, its ID retired. `R-INT-1`, `R-INT-4` and `R-INT-8` lost their companion clauses;
`R-INT-4` gained `layoutConvention` and `R-INT-1` gained the `manifest.json` name. Section 3 lost the
*companion manifest* term and its mention in *Artifact*. The integrity contract and the bindings row
updated.

These are the 2026-08-16 IDs. The meta file requirements moved to `meta-file-spec.md` on 2026-08-27:
`R-INT-1` is now `R-MFILE-8`, and `R-INT-4` is now `R-MFILE-3`, `R-MFILE-9` and `R-MFILE-10`.

`R-INT-10` is unchanged and predates this record: rebuilding a manifest hashes whatever is present at
that moment, corrupted files included, so a recorded checksum may only be replaced by a newly computed
one when Turbo-Collection wrote that file's content itself.
