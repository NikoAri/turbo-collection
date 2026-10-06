# One document per layout convention

**Status:** Accepted
**Date:** 2026-08-01

A copy can hold content placed under more than one layout convention, and every directory's manifest
records which convention placed it, with that convention's version (`R-MFILE-9`). A convention
therefore needs a version identity of its own, so each gets its own specification, directly under
`specs/`:

| Document | Prefix | State |
|---|---|---|
| `photo-path-layout-spec.md` | `R-PHOTO-*` | written 2026-08-27 |
| `as-found-path-layout-spec.md` | `R-FOUND-*` | written 2026-10-06 |
| an album specification | `R-ALBUM-*` | decided, not yet written |

A change to where an item goes is a MAJOR event for the document that states it. A convention living
inside the core specification would carry that document's version, so changing a month-leaf format
would force archival of an entire core text plus a conversion-grade changes-from section. Other
domains are already anticipated (documents, spreadsheets, video), each bringing its own convention, so
photos should not be privileged by being embedded.

Which conventions a copy uses is read from its manifests, each naming one by its identifier. Which
convention governs a given item is decided by that item's import source
([the layout-selection decision](2026-10-03-layout-selection-decision.md)).

Names are deliberately asymmetric. An album document covers hydration, receipts, per-member
provenance and reclaim as well as placement, so calling it an album specification rather than an
album layout specification is honest.

## Rejected

- **One layout specification covering canonical originals and albums together.** Recommended
  2026-07-29 and overturned by owner. A record naming a set of conventions was always the honest
  shape; a single slot was an unexamined assumption from when photos were the only domain.
- **Photo convention stays in the core specification, albums alone get a document.** Entangles core
  versioning with layout churn.
- **A subdirectory for layout specifications** (`specs/layout/`, and before it `specs/albums/`).
  Planned on this date and not kept: a filename already states the kind, so `*-layout-spec.md`
  beside the other specifications lists the set just as legibly.

## Touches

No requirements. Determines where `R-PHOTO-*`, `R-FOUND-*` and `R-ALBUM-*` get defined.
