# Copies are peers, with no privileged collection

**Status:** Accepted
**Date:** 2026-09-05

A collection is one logical dataset, held as one or more **peer copies**. No copy is privileged:
there is no distinguished collection that subordinate targets mirror from. Verifying, healing, and
filling are symmetric operations any copy performs with any other, arbitrated by manifests and always
add-only. One asymmetry survives, that new external bytes enter through an **import**, but that is a
property of an operation, not of a distinguished drive: every copy can import.

Three renames carry the reframing:

- **Target** as a role is retired. What was its port is a copy's **storage** (`R-TGT-*`, IDs
  frozen), which mirroring and verify act on for every copy. It was first renamed the _Storage
  port_; [the vocabulary decision](2026-10-06-spec-vocabulary-decision.md) later removed ports from
  the specification altogether.
- The operation over copies is **symmetric and add-only, never one-way** (`R-MIRROR-*`, IDs frozen),
  not a one-directional push from a privileged copy. Its naming (the **mirror** mechanism, the
  **backup** operation) is settled in [the backup-naming decision](2026-09-27-backup-naming-decision.md).
- `role` is withdrawn from configuration. A copy still declares its own identity, now `collectionName`
  alone (`R-MFILE-18`).

Directionality can go because the safety it seemed to buy was already bought by content. Which bytes
are correct is decided by a recorded checksum, never by a label (`R-INT-7`), and that checksum is
immutable once written for an existing file (`R-SRC-12`); the mirror never overwrites a differing file
and never deletes at the far copy. A one-way mirror was guarding a catastrophe the add-only rules
already forbid, that a corrupt copy overwrites good ones. Restoring a damaged copy is therefore not a
reversed mirror but ordinary mirroring toward whichever copy verifies clean, per file and per
directory (`R-TGT-9`).

Authority splits once role is gone. Authority over **bytes**, which copy of a file is correct, is
pure content. Authority over **membership**, which files should exist at all, is import, which is
additive and idempotent (`R-SRC-8`), so one photo imported into two copies converges rather than
conflicting.

## Rejected

- **Automatic bidirectional mirroring**, proposed to rebuild a damaged copy from a backup. It is
  precisely the catastrophe the design forbids: a corrupt copy would overwrite good ones. Rebuilding
  is a plain verified copy, not a reversed flow.
- **`role` as a fixed brand on a drive.** Its meaning had already collapsed from "which way data
  flows" to "which copy import writes to," and even that is not a drive property, since any copy can
  be imported into and content converges. The field stored no decision worth keeping.
- **A privileged collection to reject junk and wrong-drive imports.** The real test is whether a file
  sits in a manifest: an imported photo has an entry, a hand-dropped file does not, and that test runs
  on any copy. Importing into an unexpected copy causes no harm; it propagates and converges.
- **A privileged collection to serialize layout-path collisions.** Were two different photos ever to
  compute one path, peers importing separately would meet a *reported* conflict when next mirrored,
  never silent loss, because add-only never overwrites. Whether that collision can occur is a layout-spec
  question, not grounds to privilege a drive.

## Deferred

**Collection cleanups**, meaning deletions and reorganizations, are the one non-additive workflow and
stay out of scope. When they arrive, the recorded instinct is an explicit dated additive record, a
tombstone, that propagates like content under newer-date-wins, so the system stays add-only and
peer-symmetric.

## Touches

- **`turbo-collection-spec.md`:** the glossary (**Collection**, **Copy**, and storage in place of
  **Target**), Section 1 scope and diagram, Section 2 principles,
  `R-COL-4`, `R-INT-2/7/8`, `R-CFG-1`, `R-CLI-4/5/9/10`, `R-LOG-1/2`, Section 7.1
  (`R-MIRROR-*`, IDs frozen), the storage rules (`R-TGT-*`, IDs frozen), and the Section 11
  contracts (the mirror engine). The operation's naming is settled in
  [the backup-naming decision](2026-09-27-backup-naming-decision.md).
- **`meta-file-spec.md`:** `R-MFILE-18` (a copy declares `collectionName` only; `role` and any roster of
  other copies withdrawn) and `R-MFILE-19` (a `collectionName` collision refuses the whole run).

The same 2026-09-05 pass also made each import source its own instance with its own specification;
that is a separate topic and a separate record still owed.
