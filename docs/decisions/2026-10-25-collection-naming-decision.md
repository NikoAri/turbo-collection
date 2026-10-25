# A TC Copy carries its collection's ID and name, and its own name for where it permanently rests; the hub TC Copy is `main`

**Status:** Accepted **Date:** 2026-10-25

Replaces the record of 2026-10-14, which named this field `copyName` and init's
option `--copy`. An instance of a collection is now a _TC Copy_
([the vocabulary decision](2026-10-25-spec-vocabulary-decision.md)), so its name
is `tcCopyName`, set by `--tc-copy`. No conclusion reversed.

That record had replaced one of 2026-09-28, under which a TC Copy's one name was
its `collectionName` and nothing named a collection, and two of that record's
conclusions reversed. It rejected a field for a TC Copy's own name, holding that
`collectionName` named one instance of the collection; once a collection has a
name of its own, an instance's name in a field called `collectionName` misleads.
It rejected `collectionId` because an `Id` marks a generated token and that
field held a chosen name; the `collectionId` here is such a token.

Supersedes the naming portion of the
[2026-08-15 drive-naming-and-hardware decision](2026-08-15-drive-naming-and-hardware-decision.md),
which now covers removable storage and the off-site model only. It reverses that
record's blanket refusal of rank-like names for the one hub TC Copy: `main` is
admitted on the git precedent, where a repository's primary branch is
conventionally `main` among peers without asserting a rank.

Every TC Copy's configuration states three things (`R-MFILE-18`, `R-MFILE-19`):

- **`collectionId`**, the collection that TC Copy belongs to: a version 4 UUID
  that init generates and backup writes into each TC Copy it creates. Nobody
  chooses or types it.
- **`collectionName`**, that collection's name, for people. Init takes it from
  `--name`, or else from the name of the directory it is given
  ([the copy-creation decision](2026-10-18-copy-creation-decision.md)). It
  appears in no filename, so it has only to be non-empty.
- **`tcCopyName`**, that TC Copy's own name, which every receipt carries in its
  filename and its contents (`R-MFILE-13`). Init takes it from `--tc-copy`, or
  else names it `main`. It may be in any script, kept in NFC and free of the
  characters an operating system refuses in a filename, and two connected TC
  Copies whose names differ only by letter case stop a run.

A backup refuses TC Copies whose `collectionId` values differ (`R-BACKUP-1`).
Mirroring goes both ways and deletes nothing, so a backup pointed at another
collection's drive would leave both drives holding both collections, and no
operation could undo it. A name alone would not stop that where it matters most:
init takes a name from a directory, and two people's folders called `Photos`
share one. Backup compares IDs; people read names. No filename carries the ID:
every TC Copy of a collection holds the same one, so it would tell no two
receipts apart.

A TC Copy is named for **where it permanently rests**: `home`, `off-site`, or a
concrete place such as `parents` or `office`. The one working TC Copy, which is
imported into and carried to the others, is named **`main`**, which is what init
calls the TC Copy it makes unless told otherwise.

Two reasons hold the convention together:

- **A name may encode only what changes by deliberate re-designation, never by
  routine work.** `off-site` is safe as a name precisely because that TC Copy's
  placement is permanent (`R-OFF-1`); a TC Copy whose location genuinely moves
  is found by its location receipt (`R-MFILE-26`), never by its name. This is
  the rule already found for the exterior drive mark (`R-SET-7`).
- **A place name makes a misplaced drive self-evidently wrong**, which nudges
  the geographic spread that keeping three TC Copies exists for. A generic
  `backup2` can sit on the same desk looking correct; an `off-site` drive on
  that desk cannot.

`tcCopyName` is identity, and stays distinct from the role words the procedures
use (working TC Copy, home TC Copy, off-site TC Copy): Turbo-Collection
identifies a TC Copy by its `tcCopyName`, not by which one an operator imports
into.

## Rejected

- **A name alone as a collection's identity.** Two collections whose first TC
  Copies were made from folders of one name would share it, and a backup would
  merge them for good.
- **A description field** (`collectionDescription`, from 2026-09-30). It gave a
  readable label to an instance's name while that name had to be ASCII for
  filenames. A TC Copy's name may now be any text, and a collection's name,
  which enters no filename, says what is kept.
- **_Backup_ as the word for a TC Copy** (`backupName`, a "main backup").
  _Backup_ is already the operation and the noun for one run of it
  ([the backup-naming decision](2026-10-22-backup-naming-decision.md)), it is a
  verb as well, and it labels every peer, the hub included, a backup of
  something.
- **`tcName`.** It reads as the name of Turbo-Collection itself, whose `tc`
  prefix marks facts such as `tcSpecVersion`. `tcCopyName` carries that prefix
  only as part of _TC Copy_, the term it names.
- **`copyName` and `--copy`**, the names of 2026-10-14, which kept a word the
  vocabulary decision retired as the term.
- **Rank names (`primary`, `origin`, `target`).** `origin` collides with
  `R-SRC-7`; `primary` and `target` cast one peer as subordinate. `main` is
  admitted only as a customary default for the hub, not a rank.

## Touches

- `meta-file-spec.md`: `R-MFILE-18` (the fields) and `R-MFILE-19` (each set
  once, at creation; what a TC Copy's name may hold; the refusal of one name on
  two connected TC Copies); `R-MFILE-2`, `R-MFILE-13`, `R-MFILE-14`,
  `R-MFILE-16` and `R-MFILE-26` carry `tcCopyName`.
- `turbo-collection-spec.md`: `R-STATUS-1` (status reports both names).
- `backup-spec.md`: `R-BACKUP-1` (backup's refusal, and the name of a TC Copy it
  creates).
- `init-spec.md`: `R-INIT-4` (the `collectionId` init generates, and init's two
  names).
- `logging-spec.md`: `R-LOG-16`, whose `mirror` entry carries `tcCopyName`.
- `samples/` fixtures, and the setup procedure's field reference.
- The [2026-08-15 record](2026-08-15-drive-naming-and-hardware-decision.md)
  loses its naming section to this one.
