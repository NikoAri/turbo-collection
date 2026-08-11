# Turbo-Collection: Setup Procedure

> **Version:** 0.1.0-draft
> **Created:** 2026-08-08
> **Status:** Draft.
> **Applies to:** a human operator, once, before a collection is protected.
> **Why any of this:** [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md)

Do these once. Written under [`../language-requirement.md`](../language-requirement.md). Terms: `turbo-collection-spec.md` Section 3. Prefix: `R-SET-*`.

---

## 1. What you need

| ID | Do this |
|---|---|
| **R-SET-1** | You MUST have a laptop or desktop computer running **Windows** or **macOS**, with a port the drives connect to. |

You also need three drives, which Section 2 covers. Each one holds a **role**, and every later step
names a drive by that role: a solid-state drive is your **collection**, and two hard disks are
**backup 1** and **backup 2**.

**Off-site** means in a different building from every other copy. Backup 2 is the off-site drive.

## 2. Get three drives

Drives you already own count. Nothing here requires a purchase, and a smaller drive today beats a
better one you have not bought yet.

### 2.1 Required

| ID | Do this |
|---|---|
| **R-SET-2** | You MUST have **two hard disk drives** and **one solid-state drive**. |

### 2.2 Recommended

These improve the odds that your three drives do not fail together. Skip any of them and you still
have a working setup.

| ID | Do this |
|---|---|
| **R-SET-3** | When buying, you SHOULD buy each drive on a **different date**, never all on one date. |
| **R-SET-4** | You SHOULD use **different models**. |
| **R-SET-5** | You SHOULD prefer capacity of at least **twice** your current photo total, and more where the price gap is small, so that age rather than fullness decides replacement. |

- Why hard disks for backups, what diversity is worth, capacity and prices:
  [storage hardware decision](../../docs/decisions/2026-08-10-storage-hardware-decision.md).

## 3. Prepare

| ID | Do this |
|---|---|
| **R-SET-6** | Format all three drives as **exFAT**. |
| **R-SET-7** | Write **purchase date** and **role** on the outside of each drive, using the roles named in Section 1. |
| **R-SET-8** | Put your collection on the **solid-state drive**. |
| **R-SET-9** | Use the two hard disk drives as **backup 1** and **backup 2**. |

> **Why exFAT.** It is the one format Windows and macOS both read and write with no extra software.
> The alternatives each need paid kernel-level drivers on one of the two, which the project's
> simplicity filter rejects.

## 4. Fill

| ID | Do this |
|---|---|
| **R-SET-10** | Copy your collection to backup 1, then verify backup 1 against its own manifest. |
| **R-SET-11** | Copy your collection to backup 2, then verify backup 2 against its own manifest. |
| **R-SET-12** | Take backup 2 **off-site**. |

## 5. Done when

| ID | Do this |
|---|---|
| **R-SET-13** | Confirm **three copies exist on three drives, one of them off-site**, before treating any source copy as releasable. |

`turbo-collection-backup-procedure.md` takes over from here, and its release gate depends on
R-SET-13 holding.

---

## Not yet stated

Drive replacement on age, retiring a drive to a cold spare, and what to do when a drive dies. All
need a replacement cadence, which is undecided.

**How often each copy is read and verified**, which is what establishes that a copy is still intact
on any medium. This is the obligation that replaced the withdrawn solid-state prohibitions, and it
has no number yet.

## Bump test

Required by `version-requirement.md` R-PUB-1.

| Level | Test |
|---|---|
| **MAJOR** | An obligation here is withdrawn or narrowed, so an operator conforming before no longer conforms. |
| **MINOR** | Additions only. |
| **PATCH** | Prose, or a refreshed price or capacity, which binds nothing. |

## Change ledger

Required by `version-requirement.md` R-PUB-6. Nothing published yet (R-PUB-3), so these entries are
informal.

| Version | Date | Change |
|---|---|---|
| 0.1.0-draft | 2026-08-08 | First draft, R-SET-1 to R-SET-11. Split out of `turbo-collection-procedure.md`, which held setup and recurring work together. Former R-OP-7 to R-OP-10 land here as R-SET-1 to R-SET-7 and R-SET-11. |
| 0.1.0-draft | 2026-08-10 | Drive acquisition split into **Required** and **Recommended**, which is the RFC 2119 MUST and SHOULD distinction made visible to an operator deciding what to spend. Only the media split stays required; purchase-date separation, model diversity and capacity headroom became SHOULD, because each improves the odds without being a condition of a working setup, and stating them as MUST turned a cost figure into a barrier to having any backup at all. Every acquisition requirement gained an explicit obligation keyword; each had stated its obligation as a bare imperative, which `language-requirement.md` R-LANG-3 says carries no obligation. The media requirement now says *have* rather than *buy*, so drives already owned satisfy it. Manufacturer diversity left this document, having been advice sharing a row with a rule and being something an operator usually cannot check in a store. New Section 1 states the Windows or macOS computer every later procedure assumed without ever naming, names the three drive roles before an operator is asked to write a role on a drive, and defines **off-site** as a different building from every other copy, so that one concept has one name (R-LANG-6). New in Section 3: format all three drives as exFAT, which no procedure previously stated at all. The six-month solid-state prohibition was **withdrawn**: it halved a JEDEC retention floor that its own rationale described as measured on a fully worn drive, and applied the result to drives at a small fraction of their rated writes. Verification cadence replaces it and is listed as not yet stated. Capacity and price detail moved to the storage hardware decision, keeping this document short enough to read while standing in a store. **Every `R-SET-*` ID was renumbered** into reading order, which R-LANG-20 permits because no version is published (R-PUB-3); references in the backup and release procedures and in `design-record.md` were updated with it. |
