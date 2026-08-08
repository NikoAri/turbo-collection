# Three copies, and media chosen by unpowered interval

**Status:** Accepted
**Date:** 2026-08-08

Storage decisions behind `R-SET-*`, `R-BAK-4` and `R-OFF-6`, and three corrections to the
`design-record.md` §10 runbook, which recommended the opposite of two of them.

## Three copies, counting the working collection

`R-SET-11`: at least three copies on three independently failing storage devices, at least one
off-site.

A working collection counts as one of three, because a collection now lives on a dedicated portable
drive rather than on internal storage. That closes a question §14 of the core specification still
lists as open, and which `design-record.md` had already answered in three places: grab-and-go
portability in §12, "cattle, not pets" for the host in §9, and plain files on portable drives in §9.
Owner added two arguments on 2026-08-08: internal capacity sits below collection size and falls
further behind each year, and an internal collection has to be migrated at every host refresh.

Two clarifications, both of which would otherwise be misread:

- A cold spare holds no current data, so it is a fourth drive and not a third copy.
- An unverified copy is a hypothesis, which is why `R-SET-11` only means something beside `R-REL-2`.

`R-REL-5` couples the two groups: releasing a source copy is forbidden while copies are below three.
A dead drive therefore stops iCloud deletion until it is replaced, without needing a deadline this
project cannot yet justify.

## Media chosen by how long a copy sits unpowered

`R-SET-7`: a copy expected to remain unpowered longer than six months is not held on solid-state
media.

NAND stores each bit as trapped charge, and charge leaks. JEDEC JESD218 rates a consumer SSD at one
year unpowered at 30 °C, measured on a drive worn to its rated write limit, halving for each 5 to
10 °C warmer. Hard disks have no comparable decay on those timescales.

The rule keys on an unpowered interval rather than on a role, because the real exposure is a
**lapsed** routine. A monthly rotation keeps an SSD powered often enough that none of this bites;
the drive that sits for eighteen months because life happened is the one that loses data. Six months
is half of the JESD218 floor.

Consequence: SSD on the collection drive, which is carried between machines and powered every
session, and hard disks on both backups. This departs from the classic "two different media" reading
of 3-2-1 for backups specifically, and does so knowingly: charge retention outweighs media diversity,
and decorrelation is recovered through `R-SET-2` and `R-SET-3`.

## Brand diversity is a SHOULD, not a MUST

`R-SET-3`. Batch failures correlate over multi-year periods and per-model failure rates differ by two
orders of magnitude, so diversity is real protection. But three manufacturers remain, retail brands
collapse into them, and an external enclosure rarely discloses the drive inside. An obligation an
operator cannot check before purchase cannot be met honestly, so model and purchase-date separation
carry the rule and manufacturer diversity is advice.

## Three runbook corrections

| Was | Now | Why |
|---|---|---|
| Order two matching drives so they rotate in sync | One drive at a time, different model, separated dates | Correlated batch failure |
| SSD for the carried off-site drive | HDD for both backups, SSD for the collection drive | Unpowered charge decay |
| Primary backup always connected, mirroring on a schedule | One deployment among others | `R-CLI-2` and `R-CLI-6` never required it, and it is not the owner's setup |

The third correction has a design consequence worth stating: with no always-connected drive, nothing
automatic protects newly imported photographs, so the backup procedure carries that weight alone,
and `R-REL-2` is what refuses a release until it has run. It also
strengthens the offline clause of 3-2-1-1-0, since two air-gapped copies is a better ransomware
posture than one.

An advantage this architecture already had, and had never written down: mirrors are independent
plain trees, so recovery is an ordinary file copy and never a RAID rebuild. The mechanism that
usually kills a second drive right after the first, sustained rebuild load on a same-age sibling,
does not exist here.

## Rejected

- **Buy 3 drives stated only as a purchase.** `R-SET-11` states the checkable end state, three
  copies on three drives with one off-site, and `R-SET-1` states the purchase that reaches it.
- **APFS or NTFS with third-party drivers** for a drive shared between macOS and Windows. Both need
  paid kernel-level software, which the project's simplicity filter rejects. Staging exports on the
  Mac and importing on Windows removes the cross-platform requirement instead.

## Touches

Adds `R-SET-1` to `R-SET-11`, `R-BAK-4`, `R-OFF-6`. Corrects `design-record.md` §10 in three places.
Closes the collection location question in core specification §14, which needs a matching edit there.
