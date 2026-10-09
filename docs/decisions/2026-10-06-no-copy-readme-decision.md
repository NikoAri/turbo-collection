# Turbo-Collection writes no `README.md` into a copy

**Status:** Accepted
**Date:** 2026-10-06

A copy carries no orientation file written by Turbo-Collection. A `README.md` found at the root of a
directory that becomes a copy is the owner's file: content like any other, recorded by the in-place
import, checksummed, and carried to every other copy by backup.

**One filename could not be both.** Turbo-Collection used to write its own `README.md` into every
copy, never overwriting one already there. A found `README.md` was then content in the first copy,
while the next backup wrote a different `README.md` into the second, and the two differed at one
path on every backup from then on. Treating the found file as a meta file avoids that, at the price
of leaving the owner's file unchecked in a single copy.

**Nothing depended on it.** The requirement itself said the file was orientation only. It was
written once and never updated, so its account of how a copy is organized went stale with the first
layout added after it. What a copy needs to describe itself is elsewhere: every manifest names its
checksum algorithm, its layout and its versions, and a copy can carry the text of the specifications
that governed it (`R-VER-8`).

**A copy is still recognizable.** The `.turbo-collection/` directory at its root marks it, as a
`.git` directory marks a repository. `.tcignore` stays a meta file at the root: like `.gitignore`,
its name is unlikely to belong to anything else, and one found there becomes the copy's ignore file.

The cost is that a person opening a drive cold finds no plain-language note at the top. Recovery
stays possible and is not made convenient
([the future-reader decision](2026-08-16-future-reader-decision.md)).

## Rejected

- **A found `README.md` as a meta file.** It leaves the owner's file in one copy, in no manifest.
- **Letting the found file win where there is one.** One filename would be a meta file in some
  collections and content in others, and backup and verify would each need a way to tell which.
- **The written `README.md` as content too.** It works, and puts a file Turbo-Collection wrote among
  the owner's content for good, frozen at whatever it said on the first day.
- **A different name for the written file.** It keeps a convenience that nothing depends on.

## Touches

`meta-file-spec.md`: `R-MFILE-22` and its section removed; `README.md` leaves `R-MFILE-2`.
`turbo-collection-spec.md`: `README.md` leaves `R-CLI-11`, `R-CLI-13`, the meta file definition and
the storage layout contract. Both layout specifications, the design record and the samples follow.
