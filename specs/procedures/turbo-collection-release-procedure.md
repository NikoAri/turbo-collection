# Turbo-Collection: Release Procedure

> **Version:** 0.1.0-draft
> **Created:** 2026-08-08
> **Status:** Draft. The safe-to-delete report is not built yet, so R-REL-2 names work that does not
> exist.
> **Applies to:** a human operator, before destroying any copy held outside a collection.
> **Why any of this:** [`../../docs/decisions/2026-08-08-operator-procedure-decision.md`](../../docs/decisions/2026-08-08-operator-procedure-decision.md)

**Release** is any act that destroys a copy held outside your collection, or ends your access to it:
deleting from a cloud account, formatting a memory card, erasing a phone, selling a device, letting a
subscription lapse.

This is the only procedure here that can lose photographs.

Written under [`../language-requirement.md`](../language-requirement.md). Terms: `turbo-collection-spec.md` Section 3. Prefix: `R-REL-*`.

---

| ID | Do this |
|---|---|
| **R-REL-1** | Confirm three copies exist on three drives, one of them off-site (`turbo-collection-setup-procedure.md` R-SET-13). |
| **R-REL-2** | Run Turbo-Collection and confirm a report states that **these specific items** were counted, verified in the collection, and verified on a target drive. |
| **R-REL-6** | Run the **propagation** report (`turbo-collection-spec.md` R-CLI-10) and read the date of each arrival it lists. Treat an arrival as evidence of where content was placed, never as evidence that the copy still exists; R-REL-1 and R-REL-2 are what establish that, and this report only tells you where to look. |
| **R-REL-3** | Stop on any discrepancy. Import again rather than accepting a shortfall. |
| **R-REL-4** | Release only what that report covers. |
| **R-REL-5** | Do not release anything while fewer than three copies exist, or while the offsite target drive is not off-site. |

---

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
| 0.1.0-draft | 2026-08-08 | First draft, R-REL-1 to R-REL-5. Split out of `turbo-collection-procedure.md`. Release is its own procedure because it is a distinct act at a distinct moment, and the only one that can destroy a photograph. |
| 0.1.0-draft | 2026-08-10 | R-REL-5 reworded to use **off-site**, defined in `turbo-collection-setup-procedure.md` Section 1, rather than restating the definition as "in the same building as every other copy". No obligation changed. |
| 0.1.0-draft | 2026-08-15 | R-REL-6 added: run the **propagation** report (`turbo-collection-spec.md` R-CLI-10) and read the date of each arrival, treating an arrival as evidence of where content was placed rather than that the copy still exists. This is what receipts were built for, and it is deliberately additive: R-REL-1 and R-REL-2 remain what establishes that copies exist and are intact, because a receipt describes storage that is not present and can be stale without anything local changing (`R-REC-8`). R-REL-2 and R-REL-5 reworded from "backup drive" and "off-site drive" to the role names set in `turbo-collection-setup-procedure.md`. No obligation was withdrawn or narrowed. |
