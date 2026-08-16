# Every directory carries a receipt, and manifests become per-directory

**Status:** Accepted
**Date:** 2026-08-16
**Replaces:** the 2026-08-15 record of the same topic, which said a receipt records arrivals and
nothing else. It now records **refusals** as well. That wording generalized past its own rationale;
the correction is below.

Turbo-Collection writes a **receipt** in every directory it puts content into, and in every directory
where content was offered and refused (`R-REC-1`). A receipt records where that content came from,
every **arrival** of it at a copy (the import that brought it into the collection, and each mirror
that carried it to a target), and every **refusal**.

Manifests become per-directory at the same time (`R-INT-1`): each directory carries a manifest of its
own files, covering that directory alone.

## What a receipt is for

It is what lets the owner delete the source material. That is a primary goal of this project, stated
in Section 1 of this document's companion, and until now nothing answered the question it turns on:
*how many copies hold this, and when did they get it?*

A manifest cannot answer it. A manifest is a **state** record, rebuildable by rescanning a tree, and
it describes one copy at a time. A receipt is an **event** record, rebuildable from nothing. The
sharpest illustration: without an event record, an empty directory nobody ever imported into and an
empty directory whose photographs were deleted are indistinguishable, because absence of data and
absence of import look identical to any checksum.

## Which events belong, and which do not

The test is whether an event changes **whether the source material can safely be deleted**.

An import puts content in one copy. Deleting the source at that moment reduces the number of copies
rather than increasing it, which `turbo-collection-release-procedure.md` R-REL-5 forbids. So a
receipt has to record reaching **each** copy, not merely being imported, and an import and a mirror
are therefore the same kind of event with a different copy named.

A **refusal** passes the same test from the other side, and passes it harder. It says something the
source offered is in no copy at all, which is the strongest possible reason not to delete. A refusal
is the negative space of an arrival, and it is the one fact about an import that no manifest and no
checksum can ever recover: an item that never landed leaves no trace to find. A degraded item refused
under `R-SRC-6`, or an item skipped because its name is already taken by different content, would
otherwise exist nowhere but a log.

**Verification is excluded** (`R-REC-2`), and fails both halves of the test. It does not change how
many copies hold a file, and it is the highest-volume event a collection generates, so admitting it
would turn a five-line file into several hundred lines over twenty years. The property being protected
is that a person can read the record at a glance, which is the only reason it gates anything. Refusals
are rare by construction and do not threaten it.

**The 2026-08-15 error worth not repeating.** That record said "arrivals, and only arrivals," and the
requirement said a receipt "MUST NOT record any other event." But the reasoning offered for the
exclusion argued entirely about verification: its volume, and its irrelevance to copy count. Neither
applies to a refusal. The blanket wording swept up a category its own justification never reached, and
it took an owner correction to notice.

## Where a refusal is recorded

In the directory the refused item **would have occupied**, creating that directory if nothing else has
landed there. Its path is known even though the file is not: `R-SRC-10` makes a collection path a
function of the item's bytes, its route-supplied metadata and its route, all in hand at the moment of
refusal.

A directory holding a receipt and no photograph is a strange object, and it is precisely the signal
worth finding: it says something was offered here and is not here. Such a directory mirrors to targets
like any other, so the record is redundant rather than resting on one drive.

A refusal also **outlives the problem it describes** (`R-REC-7`). Deleting it once the item imports
successfully would be tidier and would destroy the audit trail. *Refused 2026-08-14, arrived
2026-09-02* tells you a gap existed and closed; the arrival alone says nothing about the weeks when a
photograph believed safe was in no copy at all.

## What this let logs stop doing

`R-LOG-5` previously required a run's log to be written to the drives, because a backup performed on a
borrowed computer would otherwise report to a machine never seen again. With refusals in receipts,
nothing preservation-relevant lives only in a log, so `R-LOG-5` was inverted: a log may now be
ephemeral and local to the machine performing the run, and is forbidden only from being the sole
record of a deletion-relevant event.

## Why not put this in the manifest

Considered, because one file per directory is simpler than two. Rejected for two reasons.

**Derivability.** A manifest can be rebuilt from the tree, which is what makes `R-INT-10` sensible and
what makes a manifest safe to treat as regenerable. Event history can be rebuilt from nothing. Merged,
the file would inherit the worse half of each: a rebuild would silently destroy irreplaceable history,
and the checksum would churn on every import. `R-INT-10` would need a clause preserving events across
a rebuild, which is the signal that two things are being forced into one container.

**Scope.** Section 3 defines a manifest as belonging to one copy. A receipt states what is on *other*
copies. Putting cross-copy claims inside the artifact defined as single-copy is a category error
rather than a crowding problem.

## Why one writer, and one ordering

Every mirror runs with the collection present, because the off-site drive never travels and the
collection goes to it (`turbo-collection-offsite-procedure.md`). So the collection is party to every
arrival, its receipt is the only complete one, and the target's copy is made by copying it outward
(`R-REC-6`).

Writing at both ends independently was considered and rejected: two receipts appended to separately
would need **merging** at every sync, an operation `R-MIRROR-1` does not describe and that nothing
else here needs. Copying outward keeps one writer per file and keeps the transfer an ordinary file
copy.

The ordering in `R-REC-5` is not free. Recording an arrival before the transfer finishes would let a
failed run claim content reached a copy it never reached. Under-reporting is safe and corrects itself
at the next mirror; over-reporting can talk an operator into deleting the last other copy.

## What a receipt is not allowed to claim

A receipt is the only record here that describes bytes that are not present, so it is the only one
that can become false while nothing local changes. A drive that dies in November does not edit the
claim written in August.

`R-SRC-13` already forbids remembering a source's contents between runs for exactly this reason.
Receipts are permitted the same shape pointed at targets for two differences: an arrival is a fact
Turbo-Collection performed itself rather than an inference about someone else's storage, and it is
recorded with its date. `R-REC-8` therefore forbids treating a receipt as evidence that a copy still
exists, and requires every stated copy count to carry the dates it counted, so that a stale claim
reads as stale. The release procedure, not this record, is what authorizes a deletion.

## Manifests per directory

Owner's decision, and it settles a question open since the first draft (formerly Section 14: one
manifest per collection, or one per top-level directory).

Two consequences that were not the reason for it:

- **A directory verifies itself.** Its manifest names its own algorithm and lists one file per line,
  so that directory can be checked with no collection and no Turbo-Collection. A directory separated
  from everything else stays verifiable, which is what `R-TGT-9` now says.
- **Partial verification becomes a natural unit.** Full verification runs at roughly three hours per
  terabyte, so a complete pass over a multi-terabyte copy is a whole day and cannot be routine.
  "Verify 2025", or "verify everything unchecked for six months", is now an ordinary request rather
  than a feature. This shapes the still-open cadence question without answering it.

The cost is permanent and was accepted knowingly: every leaf directory holds two housekeeping files
beside the photographs, `manifest.json` and `receipt.json`. Browsability of a plain tree is this project's thesis, so this is a real
price, paid to keep each directory independently interpretable.

## The scoping this forced

Four requirements were written before artifacts were a distinct class from content, and each would
have forbidden part of this design as literally worded. Rather than patch them one at a time, Section
3 now defines **content file** and states that every file in a copy is either a content file or an
artifact, and the requirements inherit it: `R-MIRROR-1`, `R-MIRROR-2`, `R-INT-7` and `R-TGT-7`.

`R-REC-7` is the receipt's counterpart to `R-INT-10`. Everything else in a copy can be rebuilt from
somewhere, so an overwrite is expensive; arrival history cannot, so an overwrite is final. A receipt
may therefore be replaced only by one holding every arrival the existing one holds, and Section 13
requires a test asserting no code path can do otherwise.

## Rejected alternatives

| Option | Why not |
|---|---|
| Roll receipts into `manifest.json` | Derivability and scope, above |
| One file per event, rather than appending | The purest reading of *only ever add*, but it puts dozens of files in every leaf directory over the years, against a plain tree meant to be browsed |
| A hash of the manifest, recorded in the receipt | Self-referential: the manifest covers the receipt, so appending changes the manifest, so the recorded value is wrong the moment it is written, under every ordering. Replaced by a digest over that directory's content, which points downward and stays true |
| Recording verification events | `R-REC-2`, above |
| Leaving refusals to the run log | A log is observability only (`R-LOG-2`) and, on a borrowed computer, is left on a machine never seen again. The one class of event a checksum can never recover cannot live only there |
| Excluding receipts from manifest coverage | Unnecessary. `R-INT-10` already permits replacing a checksum for content Turbo-Collection wrote, and it is a receipt's only writer |
| Renaming **mirror** to **propagate**, to name the compound operation | Section 3's definition now says a mirror transfers and records, which buys the clarity without renaming nine requirements, a port, and an operation. Noted for the record: append-only had already made "mirror" slightly inaccurate, since `R-MIRROR-3` makes a target a permanent superset. If it is ever renamed, **replicate** is the better word |

## What this does not settle

Verification cadence is still a number nobody has chosen.
