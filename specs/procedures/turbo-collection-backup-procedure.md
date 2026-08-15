# Turbo-Collection: Backup Procedure

> **Version:** 0.1.0-draft
> **Created:** 2026-08-08
> **Status:** Draft. The mirror is not built yet, so R-BAK-2 names work that does not exist. R-BAK-4 was withdrawn on 2026-08-10 and its number is not reused.
> **Applies to:** a human operator, every time backup drives are brought up to date.
> **Requires:** `turbo-collection-setup-procedure.md` R-SET-13 already holds.
> **Why any of this:** [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md)

Copying your collection onto the target drive kept with you. The offsite target drive is not covered
here; it never travels, and `turbo-collection-offsite-procedure.md` takes the collection to it.

Written under [`../language-requirement.md`](../language-requirement.md). Terms: `turbo-collection-spec.md` Section 3. Prefix: `R-BAK-*`.

---

| ID | Do this |
|---|---|
| **R-BAK-1** | Plug in the collection drive and the target drive. |
| **R-BAK-2** | Run the Turbo-Collection mirror. |
| **R-BAK-3** | Read the report. |

The off-site copy has its own procedure: `turbo-collection-offsite-procedure.md`.

---

## Not yet stated

How often to mirror, how often to verify a backup, and how often to test a restore. All need numbers
that are undecided. Verification cadence now carries the protection that the withdrawn R-BAK-4
claimed to provide, so it matters more than it did while a media rule stood in for it.

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
| 0.1.0-draft | 2026-08-08 | First draft, R-BAK-1 to R-BAK-4. Split out of `turbo-collection-procedure.md`, which held setup, import, mirror, off-site and release together. |
| 0.1.0-draft | 2026-08-15 | R-BAK-1 reworded from "a backup drive" to "the target drive", following the role rename in `turbo-collection-setup-procedure.md`. The opening line now says this procedure covers the target drive kept with the operator, and that the offsite target drive never travels, which `turbo-collection-offsite-procedure.md` now handles by taking the collection to it. No obligation changed. |
| 0.1.0-draft | 2026-08-10 | **R-BAK-4 withdrawn**, and its number is not reused. It forbade a solid-state backup drive that would sit unpowered longer than six months. The figure halved a JEDEC JESD218 retention floor that is measured on a drive worn to its full rated writes, then applied the result to drives at a small fraction of that wear, so it forbade a medium the evidence permits. Verification cadence, listed above as not yet stated, is what actually establishes a copy is intact. The `Requires` line follows the 2026-08-10 renumbering of `R-SET-*`: the three-copy gate is now R-SET-13. Rationale: [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md). |
