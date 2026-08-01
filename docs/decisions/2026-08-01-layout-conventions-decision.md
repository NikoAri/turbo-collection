# One document per layout convention

**Status:** Accepted
**Date:** 2026-08-01

R-VER-7 is being amended so a collection root marker records a **set** of layout conventions. A set
needs members, and a member needs its own version identity, so each convention gets its own
specification under `specs/layout/`:

| Document | Prefix | State |
|---|---|---|
| `turbo-collection-album-spec.md` | `R-ALBUM-*` | decided, ready to draft |
| `turbo-collection-photo-layout-spec.md` | `R-PHOTO-*` | blocked on within-bucket leaf identity, source directory naming, and no-device fallback bucket |

R-VER-1 makes any layout-convention change a MAJOR event. A convention living inside the core
specification would carry that document's version, so changing a month-leaf format would force
archival of an entire core text plus a conversion-grade changes-from section. Other domains are
already anticipated (documents, spreadsheets, video), each bringing its own convention, so photos
should not be privileged by being embedded.

Nothing moves. No layout convention has been written into the core specification yet, so this governs
where new text lands rather than requiring a refactor.

Set membership becomes a directory listing, which resolves a question left open on 2026-07-29: keying
that marker by domain and keying it by document name converge.

Names are deliberately asymmetric. An album document covers hydration, receipts, per-member
provenance and reclaim as well as placement, so calling it an album specification rather than an
album layout specification is honest.

## Rejected

- **One layout specification covering canonical originals and albums together.** Recommended
  2026-07-29 and overturned by owner. A marker recording a set was always the honest shape; a
  singular slot in R-VER-7 was an unexamined assumption from when photos were the only domain.
- **Photo convention stays in the core specification, albums alone get a document.** Entangles core
  versioning with layout churn.
- **`specs/albums/`, as proposed on 2026-07-29.** Grouping both conventions under `specs/layout/`
  makes R-VER-7's set legible in one listing.

## Touches

No requirements. Determines where `R-ALBUM-*` and `R-PHOTO-*` get defined. Depends on a pending
R-VER-7 amendment rather than causing it.
