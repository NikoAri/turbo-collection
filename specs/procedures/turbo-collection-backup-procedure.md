# Turbo-Collection: Backup Procedure

> **Version:** 0.1.0-draft  
> **Created:** 2026-08-08  
> **Status:** Draft. R-BAK-4 was withdrawn on 2026-08-10 and its number is not
> reused.  
> **Applies to:** a human operator, every time your home TC Copy is brought up
> to date.  
> **Requires:** `turbo-collection-setup-procedure.md` R-SET-13 already holds.  
> **Why any of this:**
> [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md)

Backing up your working TC Copy with a home TC Copy kept with you: each gains
every file that only one of them has, and nothing is deleted. Your off-site TC
Copy is not covered here; it never travels, and
`turbo-collection-offsite-procedure.md` takes your working TC Copy to it.

Written under [`../language-requirement.md`](../language-requirement.md). Terms:
`turbo-collection-spec.md` Section 3. Prefix: `R-BAK-*`.

---

**R-BAK-1.** Plug in your working TC Copy and your home TC Copy.

**R-BAK-2.** Run Turbo-Collection's backup.

**R-BAK-3.** Read that backup's report.

Your off-site TC Copy has its own procedure:
`turbo-collection-offsite-procedure.md`.

---

## Not yet stated

How often to back up, how often to verify a TC Copy, and how often to test a
restore. All need numbers that are undecided. Verification cadence now carries
protection that R-BAK-4, now withdrawn, claimed to provide, so it matters more
than it did while a media rule stood in for it.

## Bump test

Required by `version-requirement.md` R-PUB-1.

| Level     | Test                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| **MAJOR** | An obligation here is withdrawn or narrowed, so an operator conforming before no longer conforms. |
| **MINOR** | Additions only.                                                                                   |
| **PATCH** | Prose that changes no obligation.                                                                 |
