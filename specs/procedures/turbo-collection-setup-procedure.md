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
names a drive by that role:

| Role | What it is | Label |
|---|---|---|
| **collection drive** | a solid-state drive, holding the collection | `TC-COLL` |
| **target drive** | a hard disk, kept with you | `TC-TGT` |
| **offsite target drive** | a hard disk, kept in another building | `TC-TGT-OFF` |

**Off-site** means in a different building from every other copy.

> **Why these names and not "backup".** *Target* is what `turbo-collection-spec.md` Section 3 calls a
> backup copy, and running a second word for one concept is what `../language-requirement.md` R-LANG-6
> forbids. *Origin* was considered for the collection drive and rejected: R-SRC-7 already uses it for
> the device a photograph comes **from**, and one word cannot mean both ends of an import.

> **Why placement appears in a label here.** A label may state a role that changes only by deliberate
> re-designation, never one that changes by routine work. The off-site drive never travels
> (`turbo-collection-offsite-procedure.md`), so its placement is permanent and safe to write on it. Had
> the two target drives swapped places on a schedule, neither could carry `OFF` on its label, because a
> drive labeled off-site while sitting on your desk misstates the one fact a release depends on.

## 2. Get three drives

Drives you already own count. Nothing here requires a purchase, and a smaller drive today beats a
better one you have not bought yet.

### 2.1 Required

| ID | Do this |
|---|---|
| **R-SET-2** | You MUST have **two hard disk drives** and **one solid-state drive**. |
| **R-SET-14** | Every drive MUST be **external and removable**, and its data MUST be readable after moving the drive to a different enclosure or dock. You MUST NOT keep the collection on storage built into a computer. |

> **Why R-SET-14 is a rule and not advice.** Storage built into a modern computer usually cannot be
> removed from it. Laptop storage is commonly soldered, and on some machines it is also tied
> cryptographically to that machine's processor, so a dead computer is a dead collection no matter how
> healthy the storage chips are. The same trap exists one step out: many consumer external drives
> encrypt in hardware on the enclosure's own chip, whether or not you ever set a password, so a
> healthy disk reads as blank in any other enclosure once that chip fails. A bare drive in a plain
> dock avoids both. This is the project's rule about vendors, applied to hardware: **a vendor may be a
> route, never a custodian.** Silicon in the path can never be removed entirely, only kept standard
> and replaceable, so the goal is the least dependency you can arrange rather than none.

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
| **R-SET-6** | Format all three drives as **exFAT**, and set each one's volume label to the label named in Section 1. |
| **R-SET-7** | Write **purchase date** and **role** on the outside of each drive, using the roles named in Section 1. |
| **R-SET-8** | Put your collection on the **solid-state drive**, which is the collection drive. |
| **R-SET-9** | Use the two hard disk drives as the **target drive** and the **offsite target drive**. |

> **Why exFAT.** It is the one format Windows and macOS both read and write with no extra software.
> The alternatives each need paid kernel-level drivers on one of the two, which the project's
> simplicity filter rejects.

## 4. Fill

| ID | Do this |
|---|---|
| **R-SET-10** | Copy your collection to the target drive, then verify the target drive against its own manifests. |
| **R-SET-11** | Copy your collection to the offsite target drive, then verify it against its own manifests. |
| **R-SET-12** | Take the offsite target drive **off-site**, and leave it there. |

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
| 0.1.0-draft | 2026-08-15 | **Drive roles renamed, and removable storage required.** The three roles were **collection**, **backup 1** and **backup 2**; they are now **collection drive**, **target drive** and **offsite target drive**, each with a volume label. *Backup* was a second word for what `turbo-collection-spec.md` Section 3 calls a **Target**, which `../language-requirement.md` R-LANG-6 forbids; *origin*, considered for the collection drive, collides with R-SRC-7's use of it for the device a photograph comes from. Section 1 gained the rule that a label may state a role changing only by deliberate re-designation, which is why placement appears on the off-site drive's label and would not have if the two targets rotated. R-SET-14 added: every drive MUST be external and removable and readable in a different enclosure, and the collection MUST NOT live on storage built into a computer. This answers where the collection lives, open since the first draft, and adds the hardware counterpart of R-TGT-11, which addresses software dependency only. R-SET-6 gained the volume label; R-SET-8, R-SET-9, R-SET-10, R-SET-11 and R-SET-12 reworded to the new role names, and R-SET-12 now says the off-site drive stays off-site. Rationale: [`../../docs/decisions/2026-08-15-drive-naming-and-hardware-decision.md`](../../docs/decisions/2026-08-15-drive-naming-and-hardware-decision.md). |
| 0.1.0-draft | 2026-08-10 | Drive acquisition split into **Required** and **Recommended**, which is the RFC 2119 MUST and SHOULD distinction made visible to an operator deciding what to spend. Only the media split stays required; purchase-date separation, model diversity and capacity headroom became SHOULD, because each improves the odds without being a condition of a working setup, and stating them as MUST turned a cost figure into a barrier to having any backup at all. Every acquisition requirement gained an explicit obligation keyword; each had stated its obligation as a bare imperative, which `language-requirement.md` R-LANG-3 says carries no obligation. The media requirement now says *have* rather than *buy*, so drives already owned satisfy it. Manufacturer diversity left this document, having been advice sharing a row with a rule and being something an operator usually cannot check in a store. New Section 1 states the Windows or macOS computer every later procedure assumed without ever naming, names the three drive roles before an operator is asked to write a role on a drive, and defines **off-site** as a different building from every other copy, so that one concept has one name (R-LANG-6). New in Section 3: format all three drives as exFAT, which no procedure previously stated at all. The six-month solid-state prohibition was **withdrawn**: it halved a JEDEC retention floor that its own rationale described as measured on a fully worn drive, and applied the result to drives at a small fraction of their rated writes. Verification cadence replaces it and is listed as not yet stated. Capacity and price detail moved to the storage hardware decision, keeping this document short enough to read while standing in a store. **Every `R-SET-*` ID was renumbered** into reading order, which R-LANG-20 permits because no version is published (R-PUB-3); references in the backup and release procedures and in `design-record.md` were updated with it. |
