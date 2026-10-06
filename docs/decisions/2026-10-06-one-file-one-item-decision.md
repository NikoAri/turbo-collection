# A file read from a directory is one item, and nothing pairs files by name

**Status:** Accepted
**Date:** 2026-10-06

Where an importer reads a plain directory, with no vendor to say which files belong together, every
file is an item of its own. This holds for the in-place import source and for the local-folder
import source. A still image and a motion clip that share a name are two items.

**Nothing states the pairing.** A vendor's export can say that two files are one thing, and an
import source specification for that vendor can rely on it. A directory says nothing, so a pairing
would be inferred from two files sharing a name: a naming habit that no document defines and that
any tool is free to break.

**Declining to guess loses nothing here.** Both import sources place files under the as-found
layout, which stores each file at the path it was supplied with (`R-FOUND-2`, `R-FOUND-3`), so two
files that sat side by side stay side by side whether or not anything calls them one item. What
`R-SRC-9` adds for an item of several files is that all of them arrive or none do. An interrupted
import already converges when it is run again (`R-SRC-8`), and an in-place import writes no content
file at all (`R-INPLACE-7`).

The cost is a window. After an interrupted local-folder import a copy can hold a still image without
its clip, and a backup in that window carries the still alone. Running the import again closes it.

This says nothing about an import source whose layout places by item, such as one that files
photographs by date: its own specification states its items.

## Rejected

- **Pairing files that share a name and differ in extension.** A guess from an undocumented habit.
  A wrong guess ties two unrelated files together, so that one failing holds back the other.
- **Pairing a fixed list of known combinations**, such as one still format with one clip format.
  The same guess with a list to maintain, and the list is knowledge about vendors, which belongs in
  a vendor's import source specification.
- **Leaving it open in both specifications.** It stood as a marked open note with a stated default.
  An implementation needs one answer, and the default was the right one.

## Touches

`in-place-import-source-spec.md`: `R-INPLACE-9` added in place of an open note.
`local-folder-import-source-spec.md`: the placeholder in its items section replaced by the same
rule. `turbo-collection-spec.md` `R-SRC-9` is unchanged, and still governs an import source whose
specification names items of several files.
