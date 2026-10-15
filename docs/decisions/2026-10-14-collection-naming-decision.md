# A copy carries its collection's ID and name, and its own name for where it permanently rests; the hub copy is `main`

**Status:** Accepted
**Date:** 2026-10-14

Replaces the record of 2026-09-28, under which a copy's one name was its `collectionName` and nothing
named a collection. Two of its conclusions reversed. It rejected `copyName`, holding that the field
named one instance of the collection; now that a collection has a name of its own, a copy's name in
a field called `collectionName` misleads. It rejected `collectionId` because an `Id` marks a
generated token and that field held a chosen name; the `collectionId` here is such a token.

Supersedes the naming portion of the
[2026-08-15 drive-naming-and-hardware decision](2026-08-15-drive-naming-and-hardware-decision.md),
which now covers removable storage and the off-site model only. It reverses that record's blanket
refusal of rank-like names for the one hub copy: `main` is admitted on the git precedent, where a
repository's primary branch is conventionally `main` among peers without asserting a rank.

Every copy's configuration states three things (`R-MFILE-18`, `R-MFILE-19`):

- **`collectionId`**, the collection the copy belongs to: a version 4 UUID that init generates and
  backup writes into each copy it creates. Nobody chooses or types it.
- **`collectionName`**, that collection's name, for people. Init takes it from `--name`, or else
  from the directory it makes a copy
  ([the copy-creation decision](2026-10-14-copy-creation-decision.md)). It appears in no filename,
  so it has only to be non-empty.
- **`copyName`**, the copy's own name, which every receipt carries in its filename and its contents
  (`R-MFILE-13`). It may be in any script, kept in NFC and free of the characters an operating
  system refuses in a filename, and two connected copies whose names differ only by letter case stop
  a run.

A backup refuses copies whose `collectionId` values differ (`R-CLI-13`). Mirroring goes both ways
and deletes nothing, so a backup pointed at another collection's drive would leave both drives
holding both collections, and no operation could undo it. A name alone would not stop that where it
matters most: init takes a name from a directory, and two people's folders called `Photos` share
one. Backup compares IDs; people read names. No filename carries the ID: every copy of a collection
holds the same one, so it would tell no two receipts apart.

A copy is named for **where it permanently rests**: `home`, `off-site`, or a concrete place such as
`parents` or `office`. The one working copy, the copy imported into and carried to the others, is
named **`main`**, which is what init calls the copy it makes unless told otherwise.

Two reasons hold the convention together:

- **A name may encode only what changes by deliberate re-designation, never by routine work.**
  `off-site` is safe as a name precisely because that copy's placement is permanent (`R-OFF-1`); a
  copy whose location genuinely moves is found by its location receipt (`R-MFILE-26`), never by its
  name. This is the rule already found for the exterior drive mark (`R-SET-7`).
- **A place name makes a misplaced drive self-evidently wrong**, which nudges the geographic spread
  the three-copy model exists for. A generic `backup2` can sit on the same desk looking correct; an
  `off-site` drive on that desk cannot.

`copyName` is identity, and stays distinct from the role words the procedures use (working copy,
home copy, off-site copy): Turbo-Collection identifies a copy by its `copyName`, not by which one an
operator imports into.

## Rejected

- **A name alone as a collection's identity.** Two collections whose first copies were made from
  folders of one name would share it, and a backup would merge them for good.
- **A description field** (`collectionDescription`, from 2026-09-30). It gave a readable label to a
  copy's name while that name had to be ASCII for filenames. A copy's name may now be any text, and
  a collection's name, which enters no filename, says what is kept.
- **_Backup_ as the word for a copy** (`backupName`, a "main backup"). _Backup_ is already the
  operation and the noun for one run of it
  ([the backup-naming decision](2026-09-27-backup-naming-decision.md)), it is a verb as well, and
  it labels every peer, the hub included, a backup of something.
- **`tcName`.** It reads as the name of Turbo-Collection itself, whose `tc` prefix marks facts such
  as `tcSpecVersion`.
- **Rank names (`primary`, `origin`, `target`).** `origin` collides with `R-SRC-7`; `primary` and
  `target` cast one peer as subordinate. `main` is admitted only as a customary default for the hub,
  not a rank.

## Touches

- `meta-file-spec.md`: `R-MFILE-18` (the fields) and `R-MFILE-19` (each set once, at creation; what
  a copy's name may hold; the refusal of one name on two connected copies); `R-MFILE-2`,
  `R-MFILE-13`, `R-MFILE-14`, `R-MFILE-16` and `R-MFILE-26` carry `copyName`.
- `turbo-collection-core-spec.md`: `R-CLI-10` (status reports both names), `R-CLI-11` (init's two
  names) and `R-CLI-13` (backup's refusal, and the name of a copy it creates).
- `samples/` fixtures, and the setup procedure's field reference.
- The [2026-08-15 record](2026-08-15-drive-naming-and-hardware-decision.md) loses its naming section
  to this one.
