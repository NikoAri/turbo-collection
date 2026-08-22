# The import source is a path segment, and the only category above a photo

**Status:** Accepted
**Date:** 2026-08-22

**Replaces `2026-08-16-acquisition-route-decision.md`**, which named this same category the
*acquisition route*. The category and its role are unchanged; the name is not. The reversal is
recorded below, under Rejected, because the reasoning that produced the discarded name is worth not
repeating.

A photo's place in the collection is `YYYY/YYYY-MM/<import-source>/<original filename>`. An **import
source** is one way of getting original bytes in, such as iCloud or a camera card. One Source adapter
reaches exactly one import source, and configuration names it (`R-SRC-3`), so the directory name is a
declared value rather than a derived one.

This replaced `R-SRC-10`, which had said the layout MUST NOT depend on which source supplied a file
and that two identical photos arriving by different ways in MUST land in the same place. **That
guarantee is withdrawn.** A photo arriving by two import sources is now two files, which `R-SRC-8`
already sends to the duplicate report rather than to an import-time gate.

The reason is that the import source is the one fact about an arrival a file cannot state about
itself. Everything else worth knowing, including the capturing device, is in the photo's own metadata
and can be derived at any time. A path segment should carry what derivation cannot reach.

## Why the name changed

*Acquisition* named the act the project already calls **import**, defined in
`turbo-collection-spec.md` Section 3 as the act of a source supplying files into the collection. Two
Latin roots for one act is what `language-requirement.md` R-LANG-6 exists to prevent, and the project
had been carrying both since 2026-07-25.

With *acquisition* gone, the second noun went too. *Route* was doing one job, which was keeping the
category from being named by the bare word *source*, and a qualifier does that job instead.

## Rejected

- **`specs/sources/`, unqualified.** Rejected 2026-08-16 and still rejected. The bare word reads as
  source code in a repository, and it collides with the Source port. **What the 2026-08-16 record got
  wrong** was concluding from this that the category needed a different noun. The defect was that the
  word was too general, and a qualifier is what cures that; `import-sources` is ambiguous with neither
  source code nor the port. Reaching for a second noun instead cost the project a redundant word for
  five days.
- **`specs/routes/` and `specs/source-routes/`.** The first is as general as `sources/` and repeats
  the same fault. The second pairs two nouns that each name the category on their own, which
  `import-source` does not: *import* is a qualifier.
- **Capturing device as the segment** (`canon-eos-r6`, from EXIF Make and Model). Intrinsic to the
  file and therefore stable, which is why it was recommended for three sessions. It lost because the
  device is derivable from the photo, so a directory spends structure on a fact already in hand. It
  also required an `unknown-device` bucket for screenshots and scans, and a registry file to separate
  two identical camera bodies. Both problems dissolve under import source naming.
- **Import batch** (`Card25`). A batch is a property of a transfer, not of a photo, so a replayed
  import produces a second copy under a new name, and one card split across two sessions splits the
  photos. Where a batch genuinely needs recording, a receipt records it.
- **A vendor surface level above the category.** The 2026-07-25 structure had one document per vendor
  system, covering every way into it, because one party controls them all. Withdrawn: the project has
  no use for the vendor as an entity, and running *surface* beside a second word meant two words for
  one level. Two ways into one vendor that deliver different bytes are simply two import sources,
  which the iCloud evidence already shows.

## Consequences accepted

The same photograph arriving by two import sources occupies two paths. Duplication moves from an edge
case to an ordinary one, and the duplicate report is what finds it.

Under append-only nothing ever moves, so an import source that a vendor kills stops receiving new
files and its existing directories stand as an accurate record of how those photos arrived.

The receipt field naming the import source is `importSource`, not `source`. A receipt is permanent
and is read without the specification beside it, so the field carries the qualifier that the prose
carries.

## Touches

`R-SRC-10` replaced (2026-08-16), then amended for the term (2026-08-22). `R-META-1`, `R-CFG-1`,
`R-REC-4` and `R-REC-9` amended for the term; `R-REC-4` and `R-REC-9` rename the receipt field `route`
to `importSource`, which is an artifact change. Section 3 carries *Import source*, and *Source* gained
a clause separating the port from the way in that one adapter reaches. The Source port contract
updated. `specs/sources/` became `specs/acquisition-routes/` on 2026-08-16 and
`specs/import-sources/` on 2026-08-22; references updated across `README.md`, `docs/spec-guide.md`,
`docs/design-record.md`, `specs/language-requirement.md`, `specs/version-requirement.md`,
`specs/procedures/turbo-collection-setup-procedure.md`, and both iCloud documents, whose titles now
read *Import Source Specification* and *Import Procedure*.
