# Removable storage, and the off-site copy that never travels

**Status:** Accepted
**Date:** 2026-08-15

These decisions were taken together, because each one constrains the next.

## The three drives

| Copy | What it is | Media |
|---|---|---|
| **working copy** | import into it, and carry it to where the off-site copy is kept | solid-state |
| **home copy** | kept with you, backed up with the working copy | hard disk |
| **off-site copy** | kept in another building; it never travels | hard disk |

How copies are named, and the `collectionName` field that holds a copy's name, are settled in
[the collection-naming decision](2026-09-28-collection-naming-decision.md): a copy is named for where
it permanently rests, and the working copy is `main`. That record also carries the rule that a name
may encode only what changes by deliberate re-designation, which is why `R-SET-7` marks the off-site
copy's placement but no other copy's.

## The off-site copy never travels; the working copy goes to it

`turbo-collection-offsite-procedure.md` R-OFF-1. The alternative, fetching the off-site copy to be
updated and returning it, was rejected.

**Bringing it home puts all three copies in one building** for as long as it is there, and one fire
during that window destroys every copy. That is precisely the event off-site storage exists to
prevent, reintroduced periodically by the routine meant to maintain it. Taking the working copy to
the off-site copy never puts more than two copies under one roof.

The cost was weighed: while the working copy travels, only one current copy is at home, whereas the
other arrangement would leave two. That is a two-simultaneous-failure scenario against a one-event
scenario, and a fire does not need two things to go wrong. R-OFF-7 reduces it further by requiring a
backup to the home copy before leaving, so a lost or dropped working copy costs a drive and no
photographs.

**A consequence worth naming:** the working copy is then present at every backup without exception,
which is what let receipts settle on a single writer. See
[the receipts decision](2026-09-07-receipts-decision.md).

## Every drive is external and removable

`turbo-collection-setup-procedure.md` R-SET-14, which also closes a question open since the first
draft: where the collection lives.

Storage built into a modern computer usually cannot be removed from it. Laptop storage is commonly
soldered, and on Apple Silicon it is also cryptographically paired to that machine's processor, with
keys held in its Secure Enclave, so removing the chips physically yields nothing without the original
processor working. Recovery means board-level repair to revive that chip far enough to complete a
handshake, at a handful of laboratories, for thousands of dollars, without guarantee. A collection on
such storage has a single point of failure that no backup discipline mitigates, because one event
takes that copy and the recovery path together.

The same trap sits one step out. Many consumer external drives encrypt in hardware on the enclosure's
own bridge chip, whether or not the owner ever set a password, so a healthy disk reads as unformatted
in any other enclosure once that chip fails. Recovery needs an identical donor board of matching
firmware revision, or a laboratory.

So the requirement is stated as **readable after moving the drive to a different enclosure**, which
both cases fail and a bare drive in a plain dock passes.

## Minimal silicon dependency, not none

An earlier form of this said *no silicon as custodian*. That cannot be met, and the first person who
tried to apply it would have discovered as much: every drive has a controller running proprietary
firmware, doing wear leveling and sector remapping, with adaptive parameters unique to that unit,
which is why a donor board needs a ROM transplant. Zero silicon dependency does not exist for digital
storage.

Stated as a gradient it is both true and usable:

| Arrangement | Dependency |
|---|---|
| Soldered storage paired to a processor | Worst: the key is in silicon that cannot be replaced |
| External drive encrypting on its bridge chip | Bad, but a donor board exists |
| Bare drive in a generic dock, or a verified non-encrypting enclosure | Controller still proprietary, but the bytes are reachable over a standard documented interface using commodity parts |
| No silicon dependency | Does not exist |

This adds no new principle. **A vendor may be an import source, never a custodian** already covers it
once the gradient is visible: a controller speaking SATA, NVMe or USB mass storage is a way through,
and silicon holding the only key is a *custodian*. The hardware layer differs only in that the
silicon cannot be removed, so the goal is to keep it standard and replaceable. It also satisfies the
project's simplicity filter, which admits documented operations and standard formats: a storage
interface is a documented contract, and a vendor's encryption bridge is not.

`R-TGT-11` requires a copy to be restorable by ordinary file copy using **no Turbo-Collection
software**, and a bridge-encrypted drive satisfies it right up until the enclosure fails. R-SET-14 is
the hardware counterpart that was missing, and it lives in the setup procedure because it binds a
purchasing decision rather than the implementation.

## Sources

Hardware claims here rest on data-recovery practitioners rather than on manufacturer documentation,
which does not describe these failure modes.

- Rossmann Group, M-series soldered NAND recovery
- MDrepairs, M1/M2/M3 soldered SSD recovery, and WD external encryption chips
- SysDev Labs, recovery from encrypted external storage
- Acronis and Commvault, on the 3-2-1 rule
- US National Archives, preservation formats glossary
