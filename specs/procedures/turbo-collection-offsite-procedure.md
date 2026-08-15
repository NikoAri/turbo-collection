# Turbo-Collection: Off-site Procedure

> **Version:** 0.1.0-draft
> **Created:** 2026-08-08
> **Status:** Draft. The off-site run is not built yet, so R-OFF-2 names work that does not exist. R-OFF-6 was withdrawn on 2026-08-10 and its number is not reused.
> **Applies to:** a human operator, every time the off-site copy is brought up to date.
> **Why any of this:** [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md)

Bringing the off-site copy up to date. **Off-site** means in a different building from every other
copy; the off-site drive is the **offsite target drive** from
`turbo-collection-setup-procedure.md`.

**The offsite target drive never travels.** You take the collection drive to it, and run the backup
there.

Written under [`../language-requirement.md`](../language-requirement.md). Terms: `turbo-collection-spec.md` Section 3. Prefix: `R-OFF-*`.

Do these in the order listed. Requirement numbers are stable rather than sequential, because R-OFF-6
was withdrawn and its number is not reused.

---

| ID | Do this |
|---|---|
| **R-OFF-7** | Before traveling, mirror the collection to the **target drive** at home, and confirm the run reported no error. |
| **R-OFF-1** | Take the **collection drive** to the building where the offsite target drive is kept. Do not bring the offsite target drive to the collection. |
| **R-OFF-2** | Run the Turbo-Collection off-site run there. Any computer will do, including one you do not own. |
| **R-OFF-3** | Read the report. |
| **R-OFF-4** | Leave the offsite target drive **off-site**. Bring home only the collection drive. |
| **R-OFF-5** | Keep at least one copy off-site at all times. |

---

> **Why the drive stays and the collection travels.** Bringing an off-site drive home to be updated
> puts all three copies in one building for as long as it is there, and one fire during that window
> destroys every copy. That is the exact event off-site storage exists to prevent, reintroduced
> periodically by the routine meant to maintain it. Taking the collection to the drive never puts more
> than two copies under one roof.

> **Why R-OFF-7 comes first.** With the collection drive traveling, it is the copy exposed to a car, a
> bag, and a journey. Mirroring to the target drive before leaving means a lost or dropped collection
> drive costs a drive and no photographs, because a current copy stayed at home. Without it, the trip
> is taken with the only current copy in hand.

> **Why any computer will do.** Nothing about a run lives on the host. Configuration travels with the
> collection (`turbo-collection-spec.md` R-CFG-5), the run's log is written to the drives rather than
> to the machine (R-LOG-5), and no database is kept anywhere (Section 2). So the computer at the far
> end is equipment you borrow, not part of the system. One caution, which is not a rule here: a
> borrowed computer is a machine whose state you do not control, and plugging the collection into it
> is a judgment you make about that machine.

## Not yet stated

How often to run this, and how often the off-site copy is read and verified. The second is what
establishes it is still intact, and it replaced the withdrawn media rule rather than merely
outliving it.

## Bump test

Required by `version-requirement.md` R-PUB-1.

| Level | Test |
|---|---|
| **MAJOR** | An obligation here is withdrawn or narrowed, so an operator conforming before no longer conforms. |
| **MINOR** | Additions only. |
| **PATCH** | Prose that changes no obligation. |

## Change ledger

Required by `version-requirement.md` R-PUB-6. Nothing published yet (R-PUB-3), so this entry is
informal.

| Version | Date | Change |
|---|---|---|
| 0.1.0-draft | 2026-08-08 | First draft, R-OFF-1 to R-OFF-6. Split out of `turbo-collection-procedure.md`. |
| 0.1.0-draft | 2026-08-15 | **The off-site drive no longer travels.** R-OFF-1 amended from fetching the off-site drive to taking the **collection drive** to it, and R-OFF-4 from returning the drive to leaving it in place. Fetching it put all three copies in one building for as long as it was there, so one fire during that window destroyed every copy, which is the event off-site storage exists to prevent. R-OFF-7 added: mirror to the target drive before traveling, so that the journey risks a drive rather than photographs, since the collection is now the copy that moves. R-OFF-2 amended to state that any computer will do, including one the operator does not own, which `turbo-collection-spec.md` R-CFG-5 and R-LOG-5 are what make true. R-OFF-5 lost its clause about the off-site drive being in the operator's possession, a state this model no longer produces. Requirement numbers are no longer in reading order, and the document now says so, because R-OFF-6 is withdrawn and numbers are not reused. Rationale: [`../../docs/decisions/2026-08-15-drive-naming-and-hardware-decision.md`](../../docs/decisions/2026-08-15-drive-naming-and-hardware-decision.md). |
| 0.1.0-draft | 2026-08-10 | Terminology coalesced: this document said "another building" and "different building" for what it elsewhere called **off-site**, so R-LANG-6's one-concept-one-name rule was broken across three documents at once. Off-site is now defined once, in `turbo-collection-setup-procedure.md` Section 1, and restated here. R-OFF-4 reworded to use the term instead of restating its definition. **R-OFF-6 withdrawn**, and its number is not reused. It banned a solid-state off-site drive outright, which was stricter than the six-month rule it derived from and therefore unsupported even by that rule's own rationale; the rationale itself has since been withdrawn, having misread a JEDEC retention floor measured on a fully worn drive. Rationale: [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md). |
