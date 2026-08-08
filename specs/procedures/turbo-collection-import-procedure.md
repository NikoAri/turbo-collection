# Turbo-Collection: Import Procedure

> **Version:** 0.1.0-draft
> **Created:** 2026-08-08
> **Status:** Draft. Turbo-Collection is not built yet, so R-IMP-2 names work that does not exist.
> **Applies to:** a human operator, every time photos come off a source.
> **Why any of this:** [`../../docs/decisions/2026-08-08-operator-procedure-decision.md`](../../docs/decisions/2026-08-08-operator-procedure-decision.md)

Getting photos from a source into your collection. Nothing is deleted here; see
`turbo-collection-release-procedure.md`.

Written under [`../language-requirement.md`](../language-requirement.md). Terms: `turbo-collection-spec.md` Section 3. Prefix: `R-IMP-*`.

---

| ID | Do this |
|---|---|
| **R-IMP-1** | Plug in the collection drive. |
| **R-IMP-2** | Run Turbo-Collection for the source you are importing from. |
| **R-IMP-3** | Read the report. |
| **R-IMP-4** | Leave the source copy in place. It is your second copy until a backup drive holds these items. |
| **R-IMP-5** | Import in batches small enough to count, until export completeness at scale has been measured. |

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
| 0.1.0-draft | 2026-08-08 | First draft, R-IMP-1 to R-IMP-5. Split out of `turbo-collection-procedure.md`. Counting and checksum verification are work Turbo-Collection performs, stated in `turbo-collection-spec.md`, so they are not restated as operator obligations. |
