# Turbo-Collection: Backup Procedure

> **Version:** 0.1.0-draft
> **Created:** 2026-08-08
> **Status:** Draft. The mirror is not built yet, so R-BAK-2 names work that does not exist.
> **Applies to:** a human operator, every time backup drives are brought up to date.
> **Requires:** `turbo-collection-setup-procedure.md` R-SET-11 already holds.
> **Why any of this:** [`../../docs/decisions/2026-08-08-storage-hardware-decision.md`](../../docs/decisions/2026-08-08-storage-hardware-decision.md)

Copying your collection onto backup drives.

Written under [`../language-requirement.md`](../language-requirement.md). Terms: `turbo-collection-spec.md` Section 3. Prefix: `R-BAK-*`.

---

| ID | Do this |
|---|---|
| **R-BAK-1** | Plug in the collection drive and a backup drive. |
| **R-BAK-2** | Run the Turbo-Collection mirror. |
| **R-BAK-3** | Read the report. |
| **R-BAK-4** | A backup drive that will sit unpowered longer than **six months** MUST NOT be a solid-state drive. |

The off-site copy has its own procedure: `turbo-collection-offsite-procedure.md`.

---

## Not yet stated

How often to mirror, how often to verify a backup, and how often to test a restore. All need numbers
that are undecided.

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
