# A copy records its own location as a location receipt

**Status:** Accepted
**Date:** 2026-09-10

A copy records where it physically sits as a **location receipt**, a third receipt type beside
`arrival` and `error`, living in a `.turbo-collection/` subdirectory at the **copy root** (`R-MFILE-2`,
`R-MFILE-26`). One connected drive can then recognize which attached volume is `off-site` and ask the
operator fewer questions.

A location receipt states a two-part locator: an **optional `volumeId`** and an **always-relative
`relativePath`**. No absolute path is ever stored; it is derived each run. Like every receipt file it
is immutable and propagates by the `R-REC-6` union, and it is written **on change** only, so an
unchanged location adds no file and the accumulated series is a free reformat and drive-replacement
trail (`R-REC-9`).

Two guardrails, carried from the in-principle decision, hold it safe:

- **A locator finds a candidate; configuration authorizes.** A resolved locator points at a candidate
  only; Turbo-Collection reads that copy's `turbo-collection-config.json` and confirms `collectionName`
  before acting, and never infers identity from a matched volume (`R-REC-9`, `R-MFILE-19`).
- **It is optional and non-load-bearing.** Turbo-Collection functions without it and falls back to
  asking when it is absent or no longer resolves. A cloud copy has no volume at all. Per the
  future-reader axiom, a convenience is never required.

## Why a two-part locator is legal where an absolute path was not

An absolute, drive-letter, or mount-point path was rejected because it is machine-specific (`E:` here,
`/Volumes/x` there) and, since a receipt is immutable and propagates, it would become a permanent lie
on every other copy. Both parts of this locator are machine-independent instead: a `volumeId` reads
the same on any machine and OS, and a volume-relative path reads the same wherever the volume mounts.
So the locator is a true statement everywhere it lands. Where it stops being true, through a moved
copy, a reformat, or a replaced drive, it resolves to nothing and **degrades to a miss**, never to a
lie, and the tool falls back to asking. This is why it stays a locator and never evidence that a copy
still exists, the same limit `R-REC-8` places on an arrival.

Two anchors keep the relative path relative in both real and test settings. With `volumeId` present,
`relativePath` is relative to that volume's root, resolved through that copy's storage at run time. With
`volumeId` absent (a `null` value means the same), it is relative to the receipt file's own directory,
so a co-located set of copies held in git resolves with no real drives.

## `volumeId` is opaque

Turbo-Collection treats `volumeId` as opaque, comparing it only for equality and never parsing its
form (`R-MFILE-26`). No universal format exists: exFAT, the project's portable filesystem, exposes only
a short volume serial, while other filesystems expose longer identifiers. The core never interprets the
value; it compares it and hands it to that copy's storage to resolve to a current mount point
(`R-REC-9`, `R-TGT-5`). This is the same opaque-token treatment `importSourceDetails` already carries. Pinning a format would either disqualify exFAT or force a copy's storage to
fabricate an identifier, and it would invite a concrete bug: validation against the exFAT shape would
reject a valid identifier from another filesystem. A serial collision is safe regardless, because
configuration-confirm turns it into a question, never a wrong action.

## Rejected

- **Storing an absolute path, drive letter, or mount point.** The whole point of the design. A relative
  path is not an absolute one, so making `volumeId` optional did not relax this.
- **Hanging the volume identifier on the per-directory arrival record** (the placement first agreed on
  2026-09-07). A category error: a volume locator is a per-copy fact, and an arrival would restate it
  in every directory. The duplication the spec does tolerate is justified by a single mailed directory
  reconstructing the layout that placed it, which a whole-copy locator has no need of, so that
  rationale does not transfer.
- **A bare `volumeId` with no path.** It under-resolves when a copy root is a subdirectory of its
  volume, and when two copies share one volume, where the identifier cannot tell them apart.
- **A nested `location: { }` block.** Sibling types keep scalar payload flat and nest only a compound
  pair such as `{specId, version}`. `volumeId` and `relativePath` are scalars, and the `.location.json`
  name already states the type.
- **A roster of copies listing where the others are.** Sibling discovery comes from each copy's own
  location receipt propagating into a set, never from a file that names others (`R-CFG-1`).
- **A host-local cache**, useless on the borrowed machines this system is designed to run on.
- **Naming it a "top-level receipt."** That names the record by where it sits, but propagation scatters
  a copy's receipts onto other copies, so the record does not stay where it sits. A type suffix carries
  what it records instead.

## Does not close

"Which drive do I plug in?" for a copy **not yet attached** stays unmet: a location receipt is authored
off a drive already present and reaches others only by propagation, so it cannot point at a copy never
connected. That is the `init` and provisioning question, answered by a procedure or a derived report
rather than a stored locator.

## Touches

Added: `R-MFILE-26` (the location receipt: copy-root placement, field order, optional and opaque
`volumeId` with `null` equivalent to absent, always-relative `relativePath` and its two anchors,
immutability) and `R-REC-9` (the behavior: on-change cadence, candidate-then-confirm, optional and
non-load-bearing, absolute path derived at run time, copy-root propagation union, observed and not
remaining). Amended: `R-MFILE-2` (a `.turbo-collection/` at the copy root, distinct from the
per-directory one) and `R-TGT-5` with the storage layout contract (report a stable volume identifier, and
resolve it to a mount point).
