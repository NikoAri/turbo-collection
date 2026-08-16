# Drive names, removable storage, and the off-site drive that never travels

**Status:** Accepted
**Date:** 2026-08-15

Three decisions taken together, because each one constrains the next.

## The three drives are named for what the specification already calls them

| Role | What it is | Label |
|---|---|---|
| **collection drive** | solid-state, holds the collection | `TC-COLL` |
| **target drive** | hard disk, kept with you | `TC-TGT` |
| **offsite target drive** | hard disk, kept in another building | `TC-TGT-OFF` |

*Collection* and *target* are Section 3 terms. Two alternatives were considered and both collided
with existing vocabulary:

- **"Backup"** for a target drive. `turbo-collection-spec.md` Section 3 already names that concept
  **Target**, and notes that "destination" was avoided so one concept has one name. `R-LANG-6` forbids
  running a second word for it.
- **"Origin"** for the collection drive. `R-SRC-7` already uses *origin* for the device a photograph
  comes **from**. One word cannot mean both ends of an import. It also sits badly against Section 3's
  statement that no copy is privileged: the collection is distinguished operationally, as the only
  copy that receives imports, not as a more trustworthy copy.

Industry vocabulary was surveyed and none of it improved on this. The **3-2-1** wording (primary,
secondary, offsite copy) carries the same privileging problem as "origin". **Digital preservation**
vocabulary (preservation master, intermediate copy, access copy) distinguishes copies by fidelity and
purpose, and these three are byte-identical peers. **Grandfather-father-son** describes rotation
generations, which this project does not keep.

**The rule behind the labels:** a label may state a role that changes only by deliberate
re-designation, never one that changes by routine work. Placement is on the off-site drive's label
only because that drive's placement is permanent. Had the two targets swapped places on a schedule,
neither could carry it, because a drive labeled off-site while sitting on a desk misstates the one
fact a release depends on.

## The off-site drive never travels; the collection goes to it

`turbo-collection-offsite-procedure.md` R-OFF-1. The alternative, fetching the off-site drive to be
updated and returning it, was rejected.

**Bringing it home puts all three copies in one building** for as long as it is there, and one fire
during that window destroys every copy. That is precisely the event off-site storage exists to
prevent, reintroduced periodically by the routine meant to maintain it. Taking the collection to the
drive never puts more than two copies under one roof.

The cost was weighed: while the collection drive travels, only one **current** copy is at home,
whereas the other arrangement would leave two. That is a two-simultaneous-failure scenario against a
one-event scenario, and a fire does not need two things to go wrong. R-OFF-7 reduces it further by
requiring a mirror to the target drive before leaving, so a lost or dropped collection drive costs a
drive and no photographs.

**A consequence worth naming:** the collection is then present at every mirror without exception,
which is what let receipts settle on a single writer. See
[the receipts decision](2026-08-16-receipts-decision.md).

## Every drive is external and removable

`turbo-collection-setup-procedure.md` R-SET-14, which also closes a question open since the first
draft: where the collection lives.

Storage built into a modern computer usually cannot be removed from it. Laptop storage is commonly
soldered, and on Apple Silicon it is also cryptographically paired to that machine's processor, with
keys held in its Secure Enclave, so removing the chips physically yields nothing without the original
processor working. Recovery means board-level repair to revive that chip far enough to complete a
handshake, at a handful of laboratories, for thousands of dollars, without guarantee. A collection on
such storage has a single point of failure that no backup discipline mitigates, because one event
takes the authoritative copy and the recovery path together.

The same trap sits one step out. Many consumer external drives encrypt in hardware on the enclosure's
own bridge chip, whether or not the owner ever set a password, so a healthy disk reads as unformatted
in any other enclosure once that chip fails. Recovery needs an identical donor board of matching
firmware revision, or a laboratory.

So the requirement is stated as **readable after moving the drive to a different enclosure**, which
both cases fail and a bare drive in a plain dock passes.

## Minimal silicon dependency, not none

An earlier form of this said *no silicon as custodian*. That cannot be met, and the first person who
tried to apply it would have discovered as much: every drive has a controller
running proprietary firmware, doing wear leveling and sector remapping, with adaptive parameters
unique to that unit, which is why a donor board needs a ROM transplant. Zero silicon dependency does
not exist for digital storage.

Stated as a gradient it is both true and usable:

| Arrangement | Dependency |
|---|---|
| Soldered storage paired to a processor | Worst: the key is in silicon that cannot be replaced |
| External drive encrypting on its bridge chip | Bad, but a donor board exists |
| Bare drive in a generic dock, or a verified non-encrypting enclosure | Controller still proprietary, but the bytes are reachable over a standard documented interface using commodity parts |
| No silicon dependency | Does not exist |

This adds no new principle. **A vendor may be a route, never a custodian** already covers it once the
gradient is visible: a controller speaking SATA, NVMe or USB mass storage is a *route*, and silicon
holding the only key is a *custodian*. The hardware layer differs only in that the route cannot be
removed, so the goal is to keep it standard and replaceable. It also satisfies the project's
simplicity filter, which admits documented operations and standard formats: a storage interface is a
documented contract, and a vendor's encryption bridge is not.

`R-TGT-11` requires a target to be restorable by ordinary file copy using **no Turbo-Collection
software**, and a bridge-encrypted drive satisfies it right up until the enclosure fails. R-SET-14 is
the hardware counterpart that was missing, and it lives in the setup procedure because it binds a
purchasing decision rather than the implementation.

## Unverified, and load-bearing for the labels

The label strings are short because exFAT volume labels are believed to be limited to eleven
characters. **This was not tested.** If the limit is higher, `TC-COLLECTION`, `TC-TARGET` and
`TC-TARGET-OFFSITE` read better and should replace them.

## Sources

Hardware claims here rest on data-recovery practitioners rather than on manufacturer documentation,
which does not describe these failure modes.

- Rossmann Group, M-series soldered NAND recovery
- MDrepairs, M1/M2/M3 soldered SSD recovery, and WD external encryption chips
- SysDev Labs, recovery from encrypted external storage
- Acronis and Commvault, on the 3-2-1 rule
- US National Archives, preservation formats glossary
