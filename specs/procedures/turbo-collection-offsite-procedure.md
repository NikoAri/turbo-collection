# Turbo-Collection: Off-site Procedure

> **Version:** 0.1.0-draft
> **Created:** 2026-08-08
> **Status:** Draft. The off-site run is not built yet, so R-OFF-2 names work that does not exist. R-OFF-6 was withdrawn on 2026-08-10 and its number is not reused.
> **Applies to:** a human operator, every time the off-site copy is brought up to date.
> **Why any of this:** [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md)

Bringing the off-site copy up to date. **Off-site** means in a different building from every other
copy; the off-site drive is backup 2 from `turbo-collection-setup-procedure.md`.

Written under [`../language-requirement.md`](../language-requirement.md). Terms: `turbo-collection-spec.md` Section 3. Prefix: `R-OFF-*`.

---

| ID | Do this |
|---|---|
| **R-OFF-1** | Fetch the off-site drive, and plug in the collection drive together with it. |
| **R-OFF-2** | Run the Turbo-Collection off-site run. |
| **R-OFF-3** | Read the report. |
| **R-OFF-4** | Return the off-site drive **off-site**. |
| **R-OFF-5** | Keep at least one copy off-site at all times. While the off-site drive is in your possession, do not release any source copy. |

---

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
| 0.1.0-draft | 2026-08-10 | Terminology coalesced: this document said "another building" and "different building" for what it elsewhere called **off-site**, so R-LANG-6's one-concept-one-name rule was broken across three documents at once. Off-site is now defined once, in `turbo-collection-setup-procedure.md` Section 1, and restated here. R-OFF-4 reworded to use the term instead of restating its definition. **R-OFF-6 withdrawn**, and its number is not reused. It banned a solid-state off-site drive outright, which was stricter than the six-month rule it derived from and therefore unsupported even by that rule's own rationale; the rationale itself has since been withdrawn, having misread a JEDEC retention floor measured on a fully worn drive. Rationale: [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md). |
