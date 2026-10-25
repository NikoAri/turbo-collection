# Paths that differ only in letter case or normalization are one path in a TC Copy

**Status:** Accepted **Date:** 2026-10-22

Two paths in a TC Copy that differ only in letter case, or only in Unicode
normalization (NFC versus NFD), are one path on every drive, and a TC Copy keeps
such a path in the spelling it already holds (`R-TGT-14`). This is how Windows
treats letter case (owner: "strive to keep case, but not differentiate on case
only, similar to Windows behavior"). A file arriving under a name that differs
from a listed file's only so is that file: an import compares their content, and
leaves the arriving file out where it differs (`R-SRC-23`).

Windows and Mac drives already take two names that differ only in case for one
file. Import code that compared names exactly wrote `photo.jpg` over a listed
`Photo.jpg` on a Windows drive, losing that file's content from the collection,
and that directory's manifest then listed both names for a single file. TC
Copies sit on drives formatted differently and back up to one another, so one
rule for every drive keeps each TC Copy able to take in every other.

## Rejected

- **Following each drive.** Two names would be one only where a drive treats
  them so. That is exact for each drive, but a TC Copy on a case-sensitive Linux
  drive could then hold `Photo.jpg` beside `photo.jpg`, and no backup to a
  Windows, Mac or exFAT drive could hold both.
- **Comparing names exactly.** On a drive that ignores case, an import overwrote
  a file in the collection.
- **Letter case alone.** A Mac's drive can take the NFC and NFD spellings of
  `café.jpg` for one file, which is the same overwrite.

## Touches

`R-TGT-14` added to `turbo-collection-spec.md` Section 6. `R-FOUND-5` keeps a
supplied path's letter case except where a TC Copy already holds a segment in
another letter case or normalization. `R-NAME-1` still has verify names report
such a pair, which a person can make by hand on a case-sensitive drive.
