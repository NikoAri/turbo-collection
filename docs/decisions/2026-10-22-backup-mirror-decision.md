# A backup mirrors two copies and leaves their meta files consistent

**Status:** Accepted **Date:** 2026-10-22

**Replaces the record of 2026-10-19.** A backup writes each file straight to its
path, where that record had it write each file in `.turbo-collection/tmp/` and
move it into place (owner: "it should write file directly without temp
shenanigans"). Staging was chosen because a part-written file at its path could
never be replaced. A file no manifest lists is not in the collection, and a
later run writes over it (`R-TGT-13`), so that reason is gone, and one model of
writing serves import and backup.

A backup is given exactly two directories, at least one of them a copy
(`R-BACKUP-1`), and mirrors them: each gains every content file the other holds
and it lacks, and nothing in the collection is overwritten or deleted
([the append-only decision](2026-08-13-append-only-decision.md)).

- **Two directories.** Every procedure backs up two copies at a time, and the
  off-site copy is never brought together with the other two. With two, no rule
  has to say in what order the pairs of three are mirrored, an order that would
  decide which of two differing versions a third copy receives, and one name for
  a new copy can never go to two new copies.
- **Meta files end consistent.** A copied file's manifest entry goes with it,
  every field included, because a `date` its import source supplied cannot be
  read back from the file (`R-BACKUP-13`). Receipt files already converge
  (`R-REC-6`). Whether two copies disagree about a file is read from their
  manifests, so a copy that lost a file is never refilled with bytes its own
  manifest says are not that file (`R-BACKUP-4`).
- **Manifests that name another layout or import source** for one directory make
  that directory an error, and nothing is copied into it either way
  (`R-BACKUP-14`), as an import refuses such a directory (`R-SRC-24`). Versions
  are not compared: an import that adds to a directory re-stamps its version
  within a MAJOR line (`R-SRC-16`), so two copies of one directory may differ
  there and still hold the same content.
- **A file no manifest lists is an error**, unless the backup writes over it.
  Files enter the collection only by an import (`R-SRC-1`), so a file put into a
  copy by hand is reported and stays where it is (`R-BACKUP-12`, `R-INT-8`). The
  rest of the backup goes ahead. Where the other copy holds a file at that path,
  the backup writes that file over it and reports nothing (owner: "silent"), as
  an import does (`R-TGT-13`).
- **Copies whose ignore files differ are refused**, before anything is written
  (`R-BACKUP-15`). A file that one copy ignores and the other does not would
  otherwise land where its new copy ignores it and no manifest lists it. The
  files are compared as patterns, so a comment, a blank line or a line ending
  does not stop a backup.
- **A file is written straight to its path**, and listed in its directory's
  manifest only once it is completely written (`R-BACKUP-9`, `R-TGT-13`). A
  backup stopped partway leaves a part-written file there that no manifest
  lists, so it is not in the collection, and the next backup writes over it
  (`R-BACKUP-4`, `R-BACKUP-5`). A file that fails its checksum as it is copied
  is left unlisted the same way (`R-BACKUP-12`). Until a later backup writes
  over such a file, a verify reports it as extra (`R-INT-8`), as it does after
  an interrupted import. Nothing in a copy is deleted, so no carve-out is needed
  for a run's own files (`R-BACKUP-6`).
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
  (`R-BACKUP-12`), and it would enter every other copy without an import.
- **Writing a file in `.turbo-collection/tmp/` and moving it into place**, the
  state from 2026-10-19 to 2026-10-22. It needed a directory of its own, a
  deletion carve-out for that directory and a second model of writing beside
  import's, to guard a file that `R-TGT-13` already keeps out of the collection
  until it is listed.
- **Comparing ignore files byte for byte.** Two files with the same patterns,
  one saved with Windows line endings, would stop every backup for no reason.
- **Reporting a file the backup writes over.** The backup after an interrupted
  one would fail once on what that one left. The cost of silence: a file put
  into a copy by hand, at a path the other copy holds, is written over without a
  report, as an import already writes over it.

## Touches

`backup-spec.md`: `R-BACKUP-1`, `R-BACKUP-4` to `R-BACKUP-6`, `R-BACKUP-9`, and
`R-BACKUP-12` to `R-BACKUP-15`; `R-BACKUP-11`, the deletion carve-out for
`.turbo-collection/tmp/`, is removed. `meta-file-spec.md`: _Content file_ leaves
out the `.turbo-collection/` directories, and `R-MFILE-2` names no temporary
directory. `turbo-collection-spec.md`: _Content File_, the same way, and Section
13's no-deletion test has no exception. `turbo-collection-core-spec.md`: the
mirror engine contract. `logging-spec.md`: `R-LOG-15` and `R-LOG-16`.
`verify-spec.md`: `R-NAME-1` is the verify names inspection, where it applied
before every copy. [`design-record.md`](../design-record.md): the filename
gotcha, and the append-only principle with no carve-out.
