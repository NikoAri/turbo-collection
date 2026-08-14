# The manifest is JSON, with a checksum-utility copy beside it

**Status:** Accepted
**Date:** 2026-08-13

The manifest is a JSON document (RFC 8259, UTF-8) stating its algorithm and specification version as
its first fields, then one entry per file with `filePath` and `checksum` (`R-INT-4`). Beside it,
Turbo-Collection writes a **companion manifest** carrying the same checksums in the line-oriented
form `sha256sum -c` reads (`R-INT-9`). Turbo-Collection reads the JSON one. Neither is authoritative
over the other, and a disagreement between them is reported rather than resolved.

## Why the previous rule was wrong

`R-INT-4` used to require "a standard, widely-readable checksum format, such that a standard checksum
utility can verify it without Turbo-Collection". That claimed more standardization than exists.

- **`sha256sum` is a GNU program, not a standard.** POSIX specifies `cksum`. BSD ships a different
  tool with different output. macOS ships a Perl `shasum`. A single Windows machine was found on
  2026-08-10 carrying two implementations that behave differently depending on the shell.
- **The format is harder to parse correctly than JSON.** Binary-mode markers, backslash escaping for
  filenames containing newlines, no declared character encoding, and ambiguity around leading and
  trailing spaces in names.
- **It cannot carry its own metadata by documented means.** Recording the algorithm and the version
  stamp needs comment lines, and comment handling is documented by none of the three implementations
  tested, though all three honor it.

JSON is a frozen standard (RFC 8259, ECMA-404, ISO/IEC 21778), declares its encoding, escapes strings
unambiguously, and holds the algorithm and the stamp as ordinary fields. If a future reader has to
write a parser, JSON is the easier thing to write a parser for.

## Why both formats, rather than choosing

A future reader can write a JSON parser. They should not have to write anything today, and today they
do not: `sha256sum -c` exists on every machine this project runs on. The JSON manifest is the record
that survives the tooling; the companion manifest is the one that costs a reader nothing while the
tooling lives.

Manifests are derived from a copy and regenerable, so a second format costs storage and nothing else,
roughly 50 MB per format for 500,000 files against terabytes of photographs. The redundancy principle
already prefers a copy to a clever choice between two goods, and this is the same move the authoring
standard makes by requiring rationale beside normative text: two imperfect channels beat one polished
one.

## Rejected

- **Keeping the checksum format alone.** Rejected as above: it is neither as standard nor as
  parseable as the requirement assumed.
- **`sha256sum --tag` (BSD-style) to carry the algorithm.** It does name the algorithm per line by
  documented means, and it was the proposal before JSON was raised. It solves only half the problem,
  since the version stamp still needs a comment line, and it leaves the format's parsing hazards
  untouched.
- **JSON Lines, one object per line.** Proposed for corruption locality, then withdrawn: a byte flip
  inside a string value leaves ordinary JSON parseable and damages one entry either way, and a flip
  that does break the parse leaves readable text a person repairs by hand. The real protection against
  a corrupt manifest is `R-TGT-9`, which puts an independent manifest on every target, so three drives
  means three manifests and a corrupt one is found by comparison. Format was the wrong lever.
- **JSON alone, with no companion.** Rejected for costing today's reader a program they do not
  currently need to write.

## Touches

Amended `R-INT-1`, `R-INT-4`, `R-INT-8` and `R-VER-3`. Added `R-INT-9` and `R-INT-10`. Core
specification Section 3 gained *companion manifest* and *copy*, and rewrote *manifest*; the
IntegrityStore port contract and the Section 12 bindings row updated to match.

Two of these are new reasoning rather than format choices. `R-INT-10`: rebuilding a manifest hashes
whatever is present at that moment, corrupted files included, so a recorded checksum may only be
replaced by a newly computed one when Turbo-Collection wrote that file's content itself. `R-INT-1`:
it required a checksum for **every** file in the collection, which no implementation can satisfy,
because a manifest is a file in the collection and cannot contain its own checksum. A manifest and
its companion are now the only exclusions, kept as narrow as possible so that static artifacts such
as the recovery note and the carried specification stay covered.
