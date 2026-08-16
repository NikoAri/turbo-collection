# The acquisition route is a path segment, and the only category above a photo

**Status:** Accepted
**Date:** 2026-08-16

A photo's place in the collection is `YYYY/YYYY-MM/<acquisition-route>/<original filename>`. An
**acquisition route** is one way of getting original bytes in, such as iCloud or a camera card. One
Source adapter is one route, and configuration names it (`R-SRC-3`), so the directory name is a
declared value rather than a derived one.

This replaced `R-SRC-10`, which had said the layout MUST NOT depend on which source supplied a file
and that two identical photos arriving by different routes MUST land in the same place. **That
guarantee is withdrawn.** A photo acquired by two routes is now two files, which `R-SRC-8` already
sends to the duplicate report rather than to an import-time gate.

The reason is that the route is the one fact about an arrival a file cannot state about itself.
Everything else worth knowing, including the capturing device, is in the photo's own metadata and can
be derived at any time. A path segment should carry what derivation cannot reach.

`specs/sources/` was renamed `specs/acquisition-routes/` in the same movement, so one term names the
directory, the requirement, and the segment on disk.

## Rejected

- **Capturing device as the segment** (`canon-eos-r6`, from EXIF Make and Model). Intrinsic to the
  file and therefore stable, which is why it was recommended for three sessions. It lost because the
  device is derivable from the photo, so a directory spends structure on a fact already in hand. It
  also required an `unknown-device` bucket for screenshots and scans, and a registry file to separate
  two identical camera bodies. Both problems dissolve under route naming.
- **Acquisition batch** (`Card25`). A batch is a property of a transfer, not of a photo, so a replayed
  import produces a second copy under a new name and the same card split across two sessions splits
  the photos. Where a batch genuinely needs recording, an import receipt records it.
- **A vendor surface level above the route.** The 2026-07-25 structure had one document per vendor
  system, covering every route into it, because one party controls them all. Withdrawn: the project
  has no use for the vendor as an entity, and running *surface* beside *route* meant two words for
  one level. Routes into one vendor that deliver different bytes are simply different routes, which
  the iCloud evidence already shows.
- **`specs/routes/` and `specs/source-routes/`** as directory names. The first is generic enough to
  repeat the confusion that prompted the rename; the second compounds two words for two things.

## Consequences accepted

The same photograph acquired by two routes occupies two paths. Duplication moves from an edge case to
an ordinary one, and the duplicate report is what finds it.

Under append-only nothing ever moves, so a route that a vendor kills stops receiving new files and
its existing directories stand as an accurate record of how those photos arrived.

## Touches

`R-SRC-10` replaced. Section 3 gained *acquisition route* and reworded *Layout convention*. The
Source port contract's MUST NOT row updated. `specs/sources/` renamed to
`specs/acquisition-routes/`; the vendor surface level withdrawn from `README.md`,
`docs/spec-guide.md`, `specs/language-requirement.md`, `specs/version-requirement.md`, and the iCloud
route specification, whose stub was reframed.
