# Turbo-Collection copies files itself, and no copying program writes into a copy

**Status:** Accepted **Date:** 2026-10-17

The mirror engine is Turbo-Collection's own code on the runtime's standard
library (`turbo-collection-spec.md` Section 12), and Turbo-Collection starts no
process that writes into a copy (`R-PARALLEL-8`). Until 2026-10-17 the binding
was rclone, with rsync as a fallback.

- **One writer.** A process that a run starts can keep running after that run
  has ended, while the computer releases the collection's lock when the run ends
  (`R-PARALLEL-6`). A copying program left running by a backup that failed could
  still be writing into a copy when the next run takes the lock, which is what
  the lock is there to prevent
  ([the parallel-safety decision](2026-10-20-parallel-safety-decision.md)).
- **One read of each file.** Turbo-Collection already reads a file to check it
  against its manifest before copying it (`R-BACKUP-12`). Copying in that same
  read writes exactly the bytes that were checked, under a temporary name
  renamed into place only where they matched. A copying program would read every
  file a second time.
- **One program to install.** rclone is installed apart from npm, so it does not
  pass the test Section 12 sets for a third-party dependency.

## Rejected

- **rclone**, for the reasons above. What it would add is its backends for cloud
  storage, and a cloud copy is deferred; one would have to meet `R-PARALLEL-8`
  as well.
- **rsync**, the fallback. A separate process, as rclone is, and not part of
  Windows.

## Touches

`turbo-collection-spec.md` Section 12: the mirror engine row.
`turbo-collection-core-spec.md` Section 11: the mirror engine contract's
introduction. `parallel-safety-spec.md`: `R-PARALLEL-8`.
[`design-record.md`](../design-record.md): every place it names rclone.
