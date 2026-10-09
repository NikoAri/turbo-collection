# Turbo-Collection: Import Procedure

> **Version:** 0.1.0-draft  
> **Created:** 2026-08-08  
> **Status:** Draft. Turbo-Collection is not built yet, so R-IMP-2 names work
> that does not exist.  
> **Applies to:** a human operator, every time photos come off an import
> source.  
> **Why any of this:**
> [`../../docs/decisions/2026-08-08-operator-procedure-decision.md`](../../docs/decisions/2026-08-08-operator-procedure-decision.md)

Getting photos from an import source into your collection. Nothing is deleted
here; see `turbo-collection-release-procedure.md`.

Written under [`../language-requirement.md`](../language-requirement.md). Terms:
`turbo-collection-spec.md` Section 3. Prefix: `R-IMP-*`.

---

**R-IMP-1.** Plug in the working copy.

**R-IMP-2.** Run the Turbo-Collection import for the import source you are
importing from.

**R-IMP-3.** Read the report.

**R-IMP-4.** Leave these items in place at the import source until another copy
holds them. What an import source holds does not count toward the three copies
`turbo-collection-release-procedure.md` R-REL-1 requires, because those three
are on drives you hold.

**R-IMP-5.** Import in batches small enough to count, until export completeness
at scale has been measured.

---

## Bump test

Required by `version-requirement.md` R-PUB-1.

| Level     | Test                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| **MAJOR** | An obligation here is withdrawn or narrowed, so an operator conforming before no longer conforms. |
| **MINOR** | Additions only.                                                                                   |
| **PATCH** | Prose that changes no obligation.                                                                 |
