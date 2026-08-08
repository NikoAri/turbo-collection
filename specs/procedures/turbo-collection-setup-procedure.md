# Turbo-Collection: Setup Procedure

> **Version:** 0.1.0-draft
> **Created:** 2026-08-08
> **Status:** Draft.
> **Applies to:** a human operator, once, before a collection is protected.
> **Why any of this:** [`../../docs/decisions/2026-08-08-storage-hardware-decision.md`](../../docs/decisions/2026-08-08-storage-hardware-decision.md)

Do these once. Written under [`../language-requirement.md`](../language-requirement.md). Terms: `turbo-collection-spec.md` Section 3. Prefix: `R-SET-*`.

---

## 1. Buy

| ID | Do this |
|---|---|
| **R-SET-1** | Buy **two hard disk drives** and **one solid-state drive**. |
| **R-SET-2** | Buy them on **different dates**, never together. |
| **R-SET-3** | Buy **different models**. Buy different manufacturers where a listing says which. |
| **R-SET-4** | Buy capacity of at least **twice** your current photo total, so age rather than fullness decides replacement. |

On 2026-08-08 that was 4 TB each, about 490 US dollars total. Re-check by 2027-08-08.

Why two hard disks and one solid-state drive rather than three of anything:
[storage hardware decision](../../docs/decisions/2026-08-08-storage-hardware-decision.md).

## 2. Prepare

| ID | Do this |
|---|---|
| **R-SET-5** | Write **purchase date** and **role** on the outside of each drive. |
| **R-SET-6** | Put your collection on the **solid-state drive**. |
| **R-SET-7** | Use the two hard disk drives as backups. A backup that will sit unpowered longer than **six months** MUST NOT be a solid-state drive. |

## 3. Fill

| ID | Do this |
|---|---|
| **R-SET-8** | Copy your collection to backup 1, then verify backup 1 against its own manifest. |
| **R-SET-9** | Copy your collection to backup 2, then verify backup 2 against its own manifest. |
| **R-SET-10** | Take backup 2 to **another building**. |

## 4. Done when

| ID | Do this |
|---|---|
| **R-SET-11** | Confirm **three copies exist on three drives, one of them off-site**, before treating any source copy as releasable. |

`turbo-collection-backup-procedure.md` takes over from here, and its release gate depends on
R-SET-11 holding.

---

## Not yet stated

Drive replacement on age, retiring a drive to a cold spare, and what to do when a drive dies. All
need a replacement cadence, which is undecided.

## Bump test

Required by `version-requirement.md` R-PUB-1.

| Level | Test |
|---|---|
| **MAJOR** | An obligation here is withdrawn or narrowed, so an operator conforming before no longer conforms. |
| **MINOR** | Additions only. |
| **PATCH** | Prose, or a refreshed price or capacity, which binds nothing. |

## Change ledger

Required by `version-requirement.md` R-PUB-6. Nothing published yet (R-PUB-3), so this entry is
informal.

| Version | Date | Change |
|---|---|---|
| 0.1.0-draft | 2026-08-08 | First draft, R-SET-1 to R-SET-11. Split out of `turbo-collection-procedure.md`, which held setup and recurring work together. Former R-OP-7 to R-OP-10 land here as R-SET-1 to R-SET-7 and R-SET-11. |
