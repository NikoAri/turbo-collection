# A quick verify checks copies by name and size; a deep verify reads every byte

**Status:** Accepted
**Date:** 2026-10-19

**`verify copies` is the quick check**, and a verify with no inspection named runs it (`R-CLI-17`).
It reads each copy's manifests and directory listings and no file's content. On each copy, every
file a manifest lists must be there at its recorded size, and every content file must be listed
(`R-INT-11`). Across the copies, each must hold every content file another holds, with the same
checksum, in both directions (`R-INT-12`), and their ignore files must hold the same patterns, as a
backup requires (`R-INT-13`). Copies of two collections are an error. Any finding fails the run
(`R-INT-14`), because a verify after a backup exists to show the copies agree.

**`verify fixity` is the deep check**, run by `verify --deep`. It reads every byte, which takes
hours per terabyte, so it cannot be the check that follows every backup. It needs no comparison of
its own: where each copy's bytes match its manifests and the manifests agree, the copies hold the
same bytes, so it runs one drive at a time, and an off-site copy can be checked alone.

**What only the deep check sees** is a file whose bytes changed and whose length did not. The quick
check therefore never reports a file as ok, since it compared no checksum.

## Rejected

- **A quick check of meta files alone.** A manifest says what a copy recorded, not what it holds: a
  photo deleted with a file manager stays listed, so comparing manifests says both copies have it.
  Reading records is status's side of the line
  ([the operation-taxonomy decision](2026-10-19-operation-taxonomy-decision.md)).
- **A one-way check** ("off-site holds all of main"). It needs a reference copy, and copies are
  peers. A file missing from either copy is on fewer copies than it should be.
- **Copies that differ, reported without failing the run.** After a backup, a difference is the
  failure the check is there to find.
- **A bare verify that reads every byte.** At hours per terabyte, nobody would run it after each
  backup.
- **Comparing two drives byte for byte.** Each copy against its own manifests, plus the manifests
  against each other, shows the same thing one drive at a time.
- **Comparing ignore files byte for byte.** A line ending would fail the check where a backup goes
  ahead ([the backup-mirror decision](2026-10-19-backup-mirror-decision.md)).

## Touches

`verify-spec.md`: `R-INT-11` to `R-INT-14`. `turbo-collection-core-spec.md`: `R-CLI-5` names
**verify copies**, `R-CLI-17` leaves fixity to `--deep` and makes copies of two collections an
error, and Section 8.4 gains the agreement row and gives backup's dry run only "what would a backup
transfer".
