# Turbo-Collection writes no `README.md` into a TC Copy

**Status:** Accepted **Date:** 2026-10-06

A TC Copy carries no orientation file written by Turbo-Collection. A `README.md`
in a TC Directory is the owner's file: content like any other, never a meta
file.

**One filename could not be both.** Turbo-Collection used to write its own
`README.md` into every TC Copy, never overwriting one already there. A found
`README.md` was then content in the first TC Copy, while the next backup wrote a
different `README.md` into the second, and the two differed at one path on every
backup from then on. Treating the found file as a meta file avoids that, at the
price of leaving the owner's file unchecked in a single TC Copy.

**Nothing depended on it.** The requirement itself said the file was orientation
only. It was written once and never updated, so its account of how a TC Copy is
organized went stale with the first layout added after it. What a TC Copy needs
to describe itself is elsewhere: every manifest names its checksum algorithm,
its layout and its versions, and a TC Copy can carry the text of the
specifications that governed it (`R-VER-8`).

**A TC Copy is still recognizable.** The `.turbo-collection/` directory at its
root marks it, as a `.git` directory marks a repository. `.tcignore` stays a
meta file at the root: like `.gitignore`, its name is unlikely to belong to
anything else, and one found there becomes the TC Copy's ignore file.

The cost is that a person opening a drive cold finds no plain-language note at
the top. Recovery stays possible and is not made convenient
([the future-reader decision](2026-08-16-future-reader-decision.md)).

## Rejected

- **A found `README.md` as a meta file.** It leaves the owner's file in one TC
  Copy, in no manifest.
- **Letting the found file win where there is one.** One filename would be a
  meta file in some collections and content in others, and backup and verify
  would each need a way to tell which.
- **The written `README.md` as content too.** It works, and puts a file
  Turbo-Collection wrote among the owner's content for good, frozen at whatever
  it said on the first day.
- **A different name for the written file.** It keeps a convenience that nothing
  depends on.

## Touches

`meta-file-spec.md`: `R-MFILE-22` and its section removed; `README.md` leaves
`R-MFILE-2`. `turbo-collection-spec.md`: `README.md` leaves the meta file
definition and the storage layout contract. `backup-spec.md`: it leaves
`R-BACKUP-1`. `init-spec.md`: it leaves `R-INIT-1`. Both layout specifications,
the design record and the samples follow.
