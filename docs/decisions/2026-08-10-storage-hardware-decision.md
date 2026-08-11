# Three copies on three drives, with media chosen by cost

**Status:** Accepted
**Date:** 2026-08-10

Replaces the 2026-08-08 record of the same name, which chose backup media by an unpowered-retention
interval. That reasoning was wrong, and the section below records why, because the error is the kind
that repeats.

## Three copies, counting the working collection

`R-SET-13`: at least three copies on three independently failing storage devices, at least one
off-site. **Off-site** means in a different building from every other copy.

A working collection counts as one of three, because a collection lives on a dedicated portable
drive rather than on internal storage. That closes a question core specification §14 still lists as
open. Two arguments carry it: internal capacity sits below collection size and falls further behind
each year, and an internal collection has to be migrated at every host refresh.

Two clarifications, both of which would otherwise be misread:

- A cold spare holds no current data, so it is a fourth drive and not a third copy.
- An unverified copy is a hypothesis, which is why `R-SET-13` only means something beside `R-REL-2`.

`R-REL-5` couples the two groups: releasing a source copy is forbidden while copies are below three.
A dead drive therefore stops iCloud deletion until it is replaced, without needing a deadline this
project cannot yet justify.

## Media is chosen by cost, not by charge decay

Hard disks for both backups, solid-state for the collection drive, on price alone: external hard
disk runs about 30 USD/TB against 60 to 80 USD/TB for portable solid-state. Solid-state media is
**permitted in any role**. Nothing here forbids it.

### The retention argument that was withdrawn

The 2026-08-08 record required that a copy expected to sit unpowered longer than six months not be
held on solid-state media. The evidence does not support it.

JEDEC JESD218 sets power-off retention for a **client** class drive at one year at 30 °C. The
qualifier is everything: the standard defines the endurance rating as the terabytes that may be
written "such that ... the SSD retains data with power off for the required time," and its direct
test method stresses drives "to their stated endurance rating (in TBW)" and performs retention
testing **after** that stress. One year is therefore the floor for a drive that has absorbed its
entire rated lifetime of writes. A photo collection is written once and read occasionally, which
leaves a drive at a small percentage of its rating, where retention is far longer. Dell states the
gradient plainly: "a drive which has had more P/E cycles or TBW have less retention capability than
a new drive with few P/E cycles or TBW."

Three further points, each of which the withdrawn rule ignored:

- The widely quoted **three month** figure is the enterprise row of the same table, which is what
  Dell and IBM cite because they sell enterprise hardware. A portable consumer drive is the client
  row.
- The rule **halved** a floor that its own text already described as measured on a worn-out drive,
  compounding conservatism in the wrong direction.
- Retention did not degrade over time the way the rule assumed. Planar scaling to 19 nm and below
  reduced a cell to a few tens of electrons, and 3D NAND reversed that by growing cells back to
  30 to 50 nm instead of shrinking them. Micron reports cell endurance rising "by over an order of
  magnitude" and 3D TLC retention roughly equivalent to the last planar MLC generations.

### What replaces it

Nothing about media. **Verification cadence** is what establishes that a copy is intact, on any
medium, and it is still an open question because the interval is undecided. Recorded honestly as a
gap rather than papered over with a media rule that felt protective and was not.

## Capacity, and why headroom is close to free

`R-SET-5` suggests twice the current photo total, so that age rather than fullness decides when a
drive is replaced, and suggests going further where the price gap is small. The reason is not
obvious: **verification and transfer scale with data stored, not with device size.** One terabyte
takes the same time to verify on a 2 TB drive and on an 8 TB drive. Headroom costs money and no
time, which makes buying one size up the cheaper mistake, since a drive that fills forces an
unplanned migration instead of an age-driven replacement.

Worked example, as of 2026-08-10. A photo library of roughly 1 TB puts the `R-SET-5` suggestion at
2 TB. Three 4 TB drives came to roughly **490 US dollars** with a solid-state collection drive, and
roughly **360 US dollars** all hard disk.

Two cautions. Prices came from retail summaries rather than quotes, so they rank options rather than
setting a budget; re-check by 2027-08-10. And the 1 TB library figure is the owner's own, so the
4 TB choice is four times the current library rather than the two times `R-SET-5` suggests, bought
by the headroom argument rather than by the rule.

**None of this gates getting started.** Capacity and diversity are advice precisely so that a cost
figure never becomes the reason someone has no backup at all, and drives already owned satisfy
`R-SET-2`.

## Diversity is advice, because an operator cannot check it

Batch failures correlate over multi-year periods and per-model failure rates differ by two orders of
magnitude, so diversity is real protection. It is stated as advice (`R-SET-3`, `R-SET-4`) because
an operator usually cannot verify it before buying: three manufacturers remain, retail brands
collapse into them, and an external enclosure rarely discloses the drive inside.

A worked example of how far that reaches. SanDisk's firmware advisory of 2023-05-22, still being
updated on 2026-03-30, covers a defect that causes drives to "unexpectedly disconnect from a
computer" across SanDisk Extreme Portable, SanDisk Extreme PRO Portable **and WD My Passport SSD**,
because Western Digital owns SanDisk. Two retail brands, one firmware platform. Buying a different
brand would not have decorrelated anything, and buying a different model might not have either.

This is also the sharper lesson from the retention error above: the failure that actually reached
this product category was firmware, which no media rule addresses and which reading the drive
detects.

## Runbook corrections

| Was | Now | Why |
|---|---|---|
| Order two matching drives so they rotate in sync | One drive at a time, different model, separated dates | Correlated batch failure |
| Solid-state forbidden for a carried off-site drive | Any medium, chosen on cost | The retention argument above |
| Primary backup always connected, mirroring on a schedule | One deployment among others | `R-CLI-2` and `R-CLI-6` never required it, and it is not the owner's setup |

The third correction has a design consequence worth stating: with no always-connected drive, nothing
automatic protects newly imported photographs, so the backup procedure carries that weight alone,
and `R-REL-2` is what refuses a release until it has run. It also strengthens the offline clause of
3-2-1-1-0, since two air-gapped copies is a better ransomware posture than one.

An advantage this architecture already had, and had never written down: mirrors are independent
plain trees, so recovery is an ordinary file copy and never a RAID rebuild. The mechanism that
usually kills a second drive right after the first, sustained rebuild load on a same-age sibling,
does not exist here.

## Rejected

- **Buy 3 drives stated only as a purchase.** `R-SET-13` states the checkable end state, three
  copies on three drives with one off-site, and `R-SET-2` states what reaches it.
- **APFS or NTFS with third-party drivers** for a drive shared between macOS and Windows. Both need
  paid kernel-level software, which the project's simplicity filter rejects. exFAT is read and
  written natively by both, so `R-SET-6` names it.
- **Naming a drive generation, such as "buy a 2026 model".** `language-requirement.md` R-LANG-11
  forbids a time reference anchored to the moment of writing, and the useful property is cell type
  and wear rather than model year. Cheap portable drives frequently do not publish cell type, so
  this stays advice: prefer TLC over QLC where a listing says which, since QLC packs 16 voltage
  levels against 8 and carries roughly a third of the program/erase cycles.

## Touches

Withdraws `R-OFF-6` and `R-BAK-4`, the two media prohibitions, and drops the six-month clause from
the setup requirement that assigns backup roles, now `R-SET-9`. Adds `R-SET-1` (a Windows or macOS
computer) and `R-SET-6` (format as exFAT). Renumbers every `R-SET-*` into reading order, which
R-LANG-20 permits while no version is published. Leaves verification cadence open, which is now the
only thing standing where a media rule stood.

## Sources

- JEDEC JESD218, as explained by the JC-64.8 chairman:
  `jedec.org/sites/default/files/Alvin_Cox [Compatibility Mode]_0.pdf`
- Dell PowerEdge KB 000198930, SSD data retention when powered off for a prolonged duration
- IBM support, potential SSD data loss after extended shutdown
- Micron, 3D NAND white paper, and TLC 3D NAND for automotive
- Samsung 860 QVO white paper, and Solidigm QLC technology papers
- SanDisk support advisory `a_id/50763`, firmware update for Extreme Portable, Extreme PRO Portable
  and WD My Passport SSD
