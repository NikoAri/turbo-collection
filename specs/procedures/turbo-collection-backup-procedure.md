# Turbo-Collection: Backup Procedure

> **Version:** 0.1.0-draft  
> **Created:** 2026-08-08  
> **Status:** Draft. The backup is not built yet, so R-BAK-2 names work that
> does not exist. R-BAK-4 was withdrawn on 2026-08-10 and its number is not
> reused.  
> **Applies to:** a human operator, every time the home copy is brought up to
> date.  
> **Requires:** `turbo-collection-setup-procedure.md` R-SET-13 already holds.  
> **Why any of this:**
> [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md)

Backing up your working copy with the home copy kept with you: each gains any
file the other has, and nothing is deleted. The off-site copy is not covered
here; it never travels, and `turbo-collection-offsite-procedure.md` takes the
working copy to it.

Written under [`../language-requirement.md`](../language-requirement.md). Terms:
`turbo-collection-spec.md` Section 3. Prefix: `R-BAK-*`.

---

**R-BAK-1.** Plug in the working copy and the home copy.

**R-BAK-2.** Run the Turbo-Collection backup.

**R-BAK-3.** Read the report.

The off-site copy has its own procedure:
`turbo-collection-offsite-procedure.md`.

---

## Not yet stated

How often to back up, how often to verify a copy, and how often to test a
restore. All need numbers that are undecided. Verification cadence now carries
the protection that the withdrawn R-BAK-4 claimed to provide, so it matters more
than it did while a media rule stood in for it.

## Bump test

Required by `version-requirement.md` R-PUB-1.

| Level     | Test                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| **MAJOR** | An obligation here is withdrawn or narrowed, so an operator conforming before no longer conforms. |
| **MINOR** | Additions only.                                                                                   |
| **PATCH** | Prose that changes no obligation.                                                                 |
