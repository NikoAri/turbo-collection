# Files already inside a copy are taken in by an in-place importer

**Status:** Accepted
**Date:** 2026-10-06

A file that is already inside a copy, and that no manifest lists, enters the collection through an
ordinary import whose import source is the copy itself: the **in-place** import source. Its files
are recorded where they sit and nothing moves. Init performs one such import as it makes a directory
a copy, and an operator can start another on any later day, which is how a file added with a file
manager becomes protected content.

**There is no adoption concept.** Until this date init "adopted" found files under rules of its own:
an exception in `R-SRC-7`, a path rule in the as-found layout that applied to adoption alone, and a
glossary term. Each was a second statement of something an import already does. With the import
source named, the as-found layout selects by import source (`R-FOUND-2`, `R-FOUND-3`), which is one
of the three things a layout is allowed to depend on (`R-SRC-10`), and `R-SRC-7` keeps a file at an
import source where it is, for every import alike.

Three rules bound it.

- **An operator starts it; backup never does.** Backup cannot tell a file still being copied in from
  a finished one, and a file recorded half-written would carry a wrong checksum to other copies.
- **One directory, one provenance.** A manifest names one layout and one import source for its
  directory (`R-MFILE-9`), so an in-place import takes a file only where its directory has no
  manifest yet, or has one naming `in-place`. A file dropped into a directory another import source
  filled is reported and left alone.
- **It adds, and does nothing else.** An edited file reads as a mismatch, a renamed file as a new
  one beside the old, and a file deleted from one copy is copied back by the next backup
  (`R-COL-4`). Deliberate cleanup stays out of scope.

## Rejected

- **A mode or a flag that drops the import-source path segment.** Which importer brought a file
  already decides it, so a flag would add configuration for a fact.
- **A reserved identifier inside the local-folder import source.** First recommendation. It keyed the
  path rule on where a file sits, which is not something a layout is allowed to depend on.
- **Keeping "adoption" as a term for the import that init performs.** A second name for one thing.
- **Backup takes in found files by itself.** See above.
- **An operator-chosen name for each in-place import.** The name would describe nothing: no outside
  source exists, and an arrival already records which copy took a file in, and when.

## Touches

`specs/import-sources/in-place/in-place-import-source-spec.md` created (`R-INPLACE-*`), and
`local-folder-import-source-spec.md` narrowed to a folder outside the copy.
`as-found-path-layout-spec.md`: `R-FOUND-2` and `R-FOUND-3` select by import source, and the
_Adoption_ term is removed. `turbo-collection-spec.md`: `R-SRC-7` reworded with no adoption clause;
`R-CLI-12` has init perform an in-place import; `R-COL-4` states that a difference between copies is
closed only by adding; the glossary's _Adoption_ becomes _In-place Import_. `meta-file-spec.md`:
`R-MFILE-21`.
