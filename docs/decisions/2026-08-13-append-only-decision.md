# Turbo-Collection only ever adds

**Status:** Accepted **Date:** 2026-07-29 (drafted into the specification
2026-08-13)

Turbo-Collection never deletes a photograph, anywhere, and carries no setting
that would let it. Every operation creates something or reports something.
Deletion is an act a human performs with ordinary tools, on evidence
Turbo-Collection supplies.

This was already the specification's behavior in seven separate places
(`R-COL-2`, `R-SRC-7`, `R-BACKUP-5`, `R-INT-6`, `R-INT-7`, `R-NAME-2`, and an
`R-COL-5` since removed), none of which named the rule behind them.
Mirror-delete was the single exception, and it is gone.

## Why remove a feature that defaulted to off

Mirror-delete bought one thing: a TC Copy that shrinks when another does. It
risked the classic backup catastrophe, in which a source appears empty (a failed
mount, an expired token, a partial sync), the tool concludes everything was
deleted, and the deletion propagates to the TC Copy that was supposed to survive
exactly that. A default is a promise the code makes to itself. Withdrawing the
capability makes the catastrophe structurally unreachable rather than merely
switched off.

The strongest argument is that **this project's code is explicitly not a trust
anchor.** The guiding principles call the orchestrator small, regenerable from
the specification, and therefore disposable. A regenerated implementation could
reintroduce a delete. So the guarantee cannot rest on the tool alone, which is
why it rests on the specification, on a conformance test asserting no deletion
path exists, and on operational hardening around the data.

Prior art agrees, from the other direction. Borg does not enforce append-only in
its client at all: the restriction lives in an SSH `command=` on the server, and
the client's `borg delete` simply fails. **A promise made by a tool is weaker
than a constraint imposed outside it.** Offline drive rotation, already this
project's design, is the same idea and the cheapest version of it: a
disconnected drive cannot be deleted from.

## What it cost, accepted knowingly

- **A corrupt file in a TC Copy is never healed automatically.** `R-BACKUP-4`
  used to overwrite any file differing from another TC Copy's, which treated one
  TC Copy as authoritative and contradicted `R-INT-7`, where neither side is.
  `R-INT-7` won. Repair is now an action a human requests.
- **Each TC Copy becomes a superset of what has been imported**, so `R-COL-4` no
  longer claims structural equivalence, and `R-INT-8` stops `extra` in a TC Copy
  being reported as an error. A tree that only grows is what makes an accidental
  deletion recoverable.
- **Turbo-Collection cannot detect a deletion at a source of something never
  backed up.** `R-SRC-13` forbids computing the collection-to-source direction
  at all. The protection is ordering rather than detection: confirm coverage
  with an import dry-run (`R-SRC-14`), then delete.

## Rejected

- **Keeping mirror-delete, disabled by default.** The status quo. Rejected: a
  setting that must never be enabled is better expressed as a capability that
  does not exist.
- **Withdrawing `R-BACKUP-6` outright**, leaving the prohibition to the guiding
  principle. Rejected: `language-requirement.md` R-LANG-3 means only an RFC 2119
  keyword states an obligation, and principles carry none. The ID keeps the
  prohibition in normative text; the configurable behavior is what was removed.
- **Reporting what a source no longer holds.** Sounds useful, is mostly false
  positives: a cloud photo source presents a local cache, so an absent item is
  as likely to be a sync failure as a deletion. Every true positive is an item
  already safely in the collection.
- **A content-addressable store** (the Git object model) for immutability.
  Rejected: reading it back requires software, against `R-COL-1` and `R-COL-3`.
- **Hardlink snapshots** (Time Machine, `rsync --link-dest`). Rejected earlier
  on exFAT and elevation grounds, and this decision does not revive them.
- **In-place migration when a layout changes.** A migration interrupted halfway
  leaves a half-moved tree, the worst available state. Writing a new generation
  beside the old one leaves the old tree intact at every instant, and mirrors
  what `R-PUB-5` already does to superseded document texts. Not yet drafted as a
  requirement.

## Touches

Core specification: guiding principle added in Section 2. Amended `R-COL-4`,
`R-BACKUP-4`, `R-BACKUP-6`, `R-BACKUP-10`, `R-TGT-5`, `R-TGT-8`, `R-CFG-4`,
`R-LOG-1`, `R-CLI-5`, `R-CLI-8`. Added `R-SRC-12`, `R-SRC-13`, `R-SRC-14`,
`R-BACKUP-11`, `R-BACKUP-12`, `R-INT-8`. Section 3 dropped the _mirror-delete_
term and gained _dry-run_ and _temporary file_. Section 8.4 grew to four
inspections. Section 13 gained the no-deletion conformance test. Section 14 lost
the collection-location question, answered by
[`2026-08-10-storage-hardware-decision.md`](2026-08-10-storage-hardware-decision.md).

`R-TGT-5` and `R-TGT-8` were removed on 2026-10-09, and `R-BACKUP-11`, the
temporary-file carve-out, on 2026-10-22. `R-BACKUP-6` and `R-TGT-7` still
prohibit deleting a file in a TC Copy.
