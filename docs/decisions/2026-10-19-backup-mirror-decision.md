# A backup mirrors two copies and leaves their meta files consistent

**Status:** Accepted **Date:** 2026-10-19

A backup is given exactly two directories, at least one of them a copy
(`R-BACKUP-1`), and mirrors them: each gains every content file the other holds
and it lacks, and nothing is overwritten or deleted
([the append-only decision](2026-08-13-append-only-decision.md)).

- **Two directories.** Every procedure backs up two copies at a time, and the
  off-site copy is never brought together with the other two. With two, no rule
  has to say in what order the pairs of three are mirrored, an order that would
  decide which of two differing versions a third copy receives, and one name for
  a new copy can never go to two new copies.
- **Meta files end consistent.** A copied file's manifest entry goes with it,
  every field included, because a `date` its import source supplied cannot be
  read back from the file (`R-MIRROR-10`). Receipt files already converge
  (`R-REC-6`). Whether two copies disagree about a file is read from their
  manifests, so a copy that lost a file is never refilled with bytes its own
  manifest says are not that file (`R-MIRROR-1`).
- **Manifests that name another layout or import source** for one directory make
  that directory an error, and nothing is copied into it either way
  (`R-MIRROR-11`), as an import refuses such a directory (`R-SRC-24`). Versions
  are not compared: an import that adds to a directory re-stamps its version
  within a MAJOR line (`R-SRC-16`), so two copies of one directory may differ
  there and still hold the same content.
- **A file no manifest lists is an error.** Files enter the collection only by
  an import (`R-SRC-1`), so a file put into a copy by hand is reported and stays
  where it is (`R-MIRROR-9`, `R-INT-8`). The rest of the backup goes ahead.
- **Copies whose ignore files differ are refused**, before anything is written
  (`R-MIRROR-12`). A file that one copy ignores and the other does not would
  otherwise land where its new copy ignores it and no manifest lists it. The
  files are compared as patterns, so a comment, a blank line or a line ending
  does not stop a backup.
- **A file is written in `.turbo-collection/tmp/` and moved into place** once it
  is complete (`R-MIRROR-6`). A backup stopped partway leaves nothing at the
  file's path, so the next backup finds the file absent and copies it again. A
  part-written file at its path could never be replaced or removed by a later
  run (`R-MIRROR-2`, `R-MIRROR-3`), and a file that failed its checksum would
  sit there as though it were complete. Nothing in a `.turbo-collection/`
  directory is a content file, so a verify does not report a file there as
  extra.
- **A new copy's name is checked first.** A backup that creates a copy refuses a
  name that is not valid or that the existing copy already has, before it makes
  a directory, and refuses a name for a new copy when it creates none
  (`R-BACKUP-1`).
- **A backup checks no filename for hazards.** A name the receiving drive cannot
  hold fails that file's copy, as any write does, and is reported. The check for
  names another operating system cannot hold is the verify names inspection
  (`R-NAME-1`), run on demand and before a copy is moved to another filesystem.
- **A file's modification time is not kept.** A file a backup copies carries the
  date of that backup.
- **The log** holds a `transfer` entry for each file copied, shown with
  `--verbose`, and a `mirror` entry with the count and bytes for each copy
  (`R-LOG-15`, `R-LOG-16`). A dry run records the same entries for what it would
  copy.

## Rejected

- **A backup of any number of directories**, for the first implementation, for
  the reasons above.
- **Computing a copied file's manifest entry from its bytes.** It loses the
  `date` and every field this version does not know, which `R-MFILE-5` requires
  to be kept.
- **Mirroring `.tcignore` itself.** Copies are peers, so where two ignore files
  differ neither has a claim to win.
- **Carrying a file no manifest lists.** There is nothing to verify it against
  (`R-MIRROR-9`), and it would enter every other copy without an import.
- **Writing a file at its path directly.** A crash would leave a part-written
  file that no later run may replace.
- **Comparing ignore files byte for byte.** Two files with the same patterns,
  one saved with Windows line endings, would stop every backup for no reason.

## Touches

`backup-spec.md`: `R-BACKUP-1`, `R-MIRROR-1`, `R-MIRROR-2`, `R-MIRROR-6`,
`R-MIRROR-8`, `R-MIRROR-9`, and the new `R-MIRROR-10` to `R-MIRROR-12`.
`meta-file-spec.md`: `R-MFILE-2` names `.turbo-collection/tmp/`, and _Content
file_ leaves out the `.turbo-collection/` directories.
`turbo-collection-spec.md`: _Content File_, the same way. `logging-spec.md`:
`R-LOG-15` and `R-LOG-16`. `verify-spec.md`: `R-NAME-1` is the verify names
inspection, where it applied before every copy.
[`design-record.md`](../design-record.md): the filename gotcha.
