# Turbo-Collection: Off-site Procedure

> **Version:** 0.1.0-draft
> **Created:** 2026-08-08
> **Status:** Draft. The off-site run is not built yet, so R-OFF-2 names work that does not exist.
> **Applies to:** a human operator, every time the off-site copy is brought up to date.
> **Why any of this:** [`../../docs/decisions/2026-08-08-storage-hardware-decision.md`](../../docs/decisions/2026-08-08-storage-hardware-decision.md)

Bringing the copy that lives in another building up to date.

Written under [`../language-requirement.md`](../language-requirement.md). Terms: `turbo-collection-spec.md` Section 3. Prefix: `R-OFF-*`.

---

| ID | Do this |
|---|---|
| **R-OFF-1** | Fetch the off-site drive, and plug in the collection drive together with it. |
| **R-OFF-2** | Run the Turbo-Collection off-site run. |
| **R-OFF-3** | Read the report. |
| **R-OFF-4** | Return the off-site drive to a **different building** from every other copy. |
| **R-OFF-5** | Keep at least one copy off-site at all times. While the off-site drive is in your possession, do not release any source copy. |
| **R-OFF-6** | The off-site drive MUST NOT be a solid-state drive. |

---

## Not yet stated

How often to run this. The six-month figure in R-OFF-6 is a media-choice floor, not a rotation
schedule.

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
