# An import never overwrites: a differing file stays out, and the rest comes in

**Status:** Accepted
**Date:** 2026-10-06

Where an import would store a file at a path that already holds a content file with different
content, the file already there is kept, the arriving file stays out of the collection and is
reported, every other file of that import comes in, and the run exits non-zero.

**It is what mirroring already does.** Two copies holding different content at one path are reported
and neither is overwritten (`R-MIRROR-1`). An import meets the same situation, most often when a
file at an import source was edited after it was first imported, and one answer keeps the two
operations alike.

**The collection keeps the first version it saw.** Import only adds (`R-SRC-12`), so newer content
has no way in at that path, and the report repeats on every run until a person deals with it.
Keeping both versions would be versioning, which is a non-goal (Section 1.3 of the core
specification).

## Rejected

- **Failing the whole import**, as an import does when it meets a symbolic link (`R-SRC-22`). One
  edited file at an import source would then block every later import from that folder.
- **Storing the arriving file under a second name.** A collection path depends on nothing but the
  file, the metadata supplied with it, and its import source (`R-SRC-10`), so no suffix records the
  order of imports.
- **Overwriting.** Import only adds.

## Touches

`turbo-collection-spec.md`: `R-SRC-23` added.
