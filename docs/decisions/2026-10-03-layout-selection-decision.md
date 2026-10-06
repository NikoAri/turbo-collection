# An import source names its layout, and the as-found layout is the floor

**Status:** Accepted
**Date:** 2026-10-03

**An item's layout is decided by its import source, not by its bytes.** An in-place import is the proof: the
same photograph is filed by date when imported from iCloud, and stays exactly where it sits when
taken in from a directory that init makes a copy. Nothing about the bytes differs, so the bytes
cannot be what chooses.

The rule has three parts.

- **Each import source specification names one primary layout**, which governs that import source's
  items (`R-SRC-15`). iCloud names the photo layout; a local folder names the as-found layout.
- **A layout specification owns placement and nothing else.** It states where its items go, and
  which items it is able to place at all (`R-PHOTO-1` for the photo layout). Bytes decide where an
  item goes _within_ a layout, such as which file of an item is read for its date, and never _which_
  layout.
- **The as-found layout is the floor** (`R-SRC-20`). An item its primary layout is not able to place
  is stored under the as-found layout, at `<import source>/<path at the import source>`, and
  reported. It is never skipped.

The floor follows from what a content file is. Once a content file is any file that is neither a meta
file nor an ignored file, skipping one is the loss a preservation system exists to prevent. So the
partition is total: an ignored file never enters a copy; an item its primary layout can place goes
there; everything else goes to the floor. Nothing that is not explicitly ignored is dropped.

The floor can always catch because **every importer supplies a path with every file** (`R-SRC-21`),
and the as-found layout places by that path. Whether such a path stays the same from one import to
the next is a property of the import source, stated in its own specification; a path that changes
risks a duplicate of a floored item on re-import, never a loss.

Two failure modes of the earlier rule disappear. An item claimed by two layouts, which stopped a whole
run, cannot occur, because one import source names one primary layout and a declined item has exactly
one floor. An item claimed by none, which was reported and passed over, is now reported and kept.

## Rejected

- **Each layout claims items by a condition on their bytes, and the core arbitrates** (the rule
  until this date). It could not express taking a file in where it sits: the photo layout claimed
  every photograph from anywhere, so a photograph found in a copy was claimed twice and the run
  refused.
- **Narrowing the photo layout's claim to exclude items that arrive with a path to keep.** It seats
  the choice inside a layout as a per-item test, when the import source and the layout are already
  recorded together for every directory. The selector is the import source.
- **A layout that states nothing about what it can place.** An item it cannot place would then have
  nowhere to go, so a layout keeps a statement of what it is able to place.
- **Report and skip an item its layout cannot place.** Overturned for the reason above: skipped is
  lost.
- **An ordered chain of layouts per import source.** More general, and it brings back a per-item
  routing decision and the possibility of overlap. One primary layout and one floor is enough; an
  album is a separate import source naming an album layout, not a second entry in a chain.
- **A floor path derived from a checksum** (`<import source>/<checksum>`). It needs no supplied path
  and cannot duplicate, and it turns the floor into a drawer of names no person can read. It becomes
  the answer only if an import source turns out unable to supply a usable path at all.

## Touches

`turbo-collection-spec.md`: `R-SRC-15` recast from arbitration between claims to a named primary
layout; `R-SRC-20` (the floor) and `R-SRC-21` (a supplied path) added; `R-SRC-10` and `R-CLI-12`
reworded to match; the glossary gains _Primary layout_ and _As-found layout_.
`photo-path-layout-spec.md`: `R-PHOTO-1` restated from what the layout claims to what it is able
to place. `as-found-path-layout-spec.md` created (`R-FOUND-*`). Each import source specification
names its primary layout. [The import-source decision](2026-08-22-import-source-decision.md) still
describes the photo layout's path, where an import source is a path segment.
