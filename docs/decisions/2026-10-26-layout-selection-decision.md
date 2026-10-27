# An import has one primary layout, by its import source's rule, and the supplied-path layout is the floor

**Status:** Accepted **Date:** 2026-10-26

Replaces the record of 2026-10-03, under which each import source named one
primary layout for all its imports, and bytes never chose a layout. That rule
reversed on first use: a folder of camera photos, imported as a local folder,
kept its folder paths, where its owner expected each photo filed by date.

**Each import has one primary layout, and its import source's specification
states the rule that picks it** (`R-SRC-15`). iCloud names the photo layout for
every import. A local folder names the photo layout where that layout is able to
place at least one of an import's items, and the supplied-path layout otherwise
(`R-LOCALFOLDER-5`).

The rule has three parts.

- **An import source's specification picks an import's primary layout**, as
  above.
- **A layout specification owns placement and nothing else.** It states where
  its items go, and which items it is able to place at all (`R-PHOTO-1` for the
  photo layout). Bytes decide where an item goes _within_ a layout, and, for a
  local folder, whether an import holds anything the photo layout places.
- **The supplied-path layout is the floor** (`R-SRC-20`). An item its import's
  primary layout is not able to place is stored under the supplied-path layout,
  at `<import source>/<path at the import source>`, and reported. It is never
  skipped.

Choosing per import, not per item, keeps one primary layout per import and one
provenance per directory (`R-SRC-24`). A local folder holding no photo lands
where it would under either layout, since the floor keeps each file at its
supplied path; so its test of what an import holds moves no file, and decides
only which layout that import names and which files it reports as floored
(`R-LOG-18`, `R-LOG-19`).

The floor follows from what a content file is. Once a content file is any file
that is neither a meta file nor an ignored file, skipping one is the loss a
preservation system exists to prevent. So the partition is total: an ignored
file never enters a TC Copy; an item its import's primary layout can place goes
there; everything else goes to the floor.

The floor can always catch because **every importer supplies a path with every
file** (`R-SRC-21`), and the supplied-path layout places by that path. Whether
such a path stays the same from one import to the next is a property of the
import source, stated in its own specification; a path that changes risks a
duplicate of a floored item on re-import, never a loss.

A command-line option, `--layout`, is to name an import's layout outright, so a
folder of photos can keep its paths on demand. It is not specified yet.

## Rejected

- **One primary layout per import source, for all its imports** (the rule until
  this date). A local folder of photos kept its folder paths, so the photo
  layout never ran on a local folder.
- **The photo layout as a local folder's primary layout for every import, its
  floor keeping every other file at its path.** It places every file where the
  rule above does, and an import of documents alone would then report every file
  as floored.
- **The supplied-path layout for every file of a folder that holds anything but
  photos.** A sidecar file such as `.AAE` or `.XMP` would keep a camera folder
  from being sorted by date.
- **Each layout claims items by a condition on their bytes, and the core
  arbitrates.** It could not express taking a file in where it sits: the photo
  layout claimed every photograph from anywhere, so a photograph found in a TC
  Copy was claimed twice and the run refused.
- **Narrowing the photo layout's claim to exclude items that arrive with a path
  to keep.** It seats the choice inside a layout as a per-item test, when an
  import source and a layout are already recorded together for every directory.
- **A layout that states nothing about what it can place.** An item it cannot
  place would then have nowhere to go.
- **Report and skip an item its layout cannot place.** Skipped is lost.
- **An ordered chain of layouts per import source.** It brings back a per-item
  routing decision and the possibility of overlap. One primary layout and one
  floor is enough; an album is a separate import source naming an album layout,
  not a second entry in a chain.
- **A floor path derived from a checksum** (`<import source>/<checksum>`). It
  needs no supplied path and cannot duplicate, and it turns the floor into a
  drawer of names no person can read. It becomes the answer only if an import
  source turns out unable to supply a usable path at all.

## Touches

`import-spec.md`: `R-SRC-15` recast so an import source specification states
which layout is an import's primary layout; `R-SRC-20` speaks of an import's
primary layout. `local-folder-import-source-spec.md`: `R-LOCALFOLDER-5` picks
the photo layout or the supplied-path layout by what an import holds.
`logging-spec.md`: `R-LOG-18`'s import entry records its layout, and `R-LOG-19`
adds `floored` and `uncertain-date` entries. Both layout specifications and the
iCloud specification speak of an import's primary layout.
