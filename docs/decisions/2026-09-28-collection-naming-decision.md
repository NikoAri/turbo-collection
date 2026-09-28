# A copy's name is its `collectionName`, chosen for where it permanently rests, and the hub copy is `main`

**Status:** Accepted
**Date:** 2026-09-28

Supersedes the naming portion of the
[2026-08-15 drive-naming-and-hardware decision](2026-08-15-drive-naming-and-hardware-decision.md),
which now covers removable storage and the off-site model only. It reverses that record's blanket
refusal of rank-like names for the one hub copy: `main` is admitted on the git precedent, where a
repository's primary branch is conventionally `main` among peers without asserting a rank.

A copy declares its own identity in its configuration, in a field named **`collectionName`**
(`R-MFILE-18`, `R-MFILE-19`). The value is the copy's name and appears verbatim in receipt filenames,
so it must be non-empty, use only portable filename characters, and be unique across connected copies
without regard to letter case (`R-MFILE-19`).

A copy is named for **where it permanently rests**: `home`, `off-site`, or a concrete place such as
`parents` or `office`. The one working copy, the copy imported into and carried to the others, is
named **`main`**. A home or off-site copy takes its place as its name; the hub takes `main`.

Two reasons hold the convention together:

- **A name may encode only what changes by deliberate re-designation, never by routine work.**
  `off-site` is safe as a name precisely because that copy's placement is permanent (`R-OFF-1`); a
  copy whose location genuinely moves is found by its location receipt (`R-MFILE-26`), never by its
  name. This is the rule already found for the exterior drive mark (`R-SET-7`).
- **A place name makes a misplaced drive self-evidently wrong**, which nudges the geographic spread
  the three-copy model exists for. A generic `backup2` can sit on the same desk looking correct; an
  `off-site` drive on that desk cannot.

`collectionName` is identity, and stays distinct from the role words the procedures use (working
copy, home copy, off-site copy): Turbo-Collection identifies a copy by its `collectionName`, not by
which one an operator imports into.

## Rejected

- **`copyName`.** _Copy_ names the on-disk mechanism and undersells a field that carries a required
  identity; the value is the identity of one collection instance. `collectionName` says what it
  holds, and _copy_ stays the word for the mechanism.
- **`backupName`, `backupId`.** Reintroduce _backup_ as a noun for a copy, which the
  [backup-naming decision](2026-09-27-backup-naming-decision.md) confines to the operator command
  surface, and label every peer, the hub included, a backup.
- **`tcName`, `collectionId`.** `tcName` reads as the whole Turbo-Collection rather than one copy,
  and `tc` is already this project's prefix for whole-collection facts such as `tcSpecVersion`. `Id`
  signals a machine-assigned opaque token; these are human-chosen names, and the meta files already
  spell such names with `Name` while reserving `Id` for generated tokens (`runId`, `volumeId`).
- **Rank names (`primary`, `origin`, `target`).** `origin` collides with `R-SRC-7`; `primary` and
  `target` cast one peer as subordinate. `main` is admitted only as a customary default for the hub,
  not a rank.

## Touches

- `meta-file-spec.md`: `R-MFILE-18` and `R-MFILE-19` rename the field; `R-MFILE-13`, `R-MFILE-14`,
  `R-MFILE-16` and `R-MFILE-26` carry it.
- `turbo-collection-spec.md`: the Section 7.4 worked example.
- `samples/` fixtures, and the setup procedure's field reference.
- The [2026-08-15 record](2026-08-15-drive-naming-and-hardware-decision.md) loses its naming section
  to this one.
