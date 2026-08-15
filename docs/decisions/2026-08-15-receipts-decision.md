# Every directory carries a receipt, and manifests become per-directory

**Status:** Accepted
**Date:** 2026-08-15

Turbo-Collection writes a **receipt** in every directory it puts content into (`R-REC-1`). A receipt
records where that content came from, and every **arrival** of it at a copy: the import that brought
it into the collection, and each mirror that carried it to a target. It records nothing else.

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

## Why arrivals, and only arrivals

An import puts content in one copy. Deleting the source at that moment reduces the number of copies
rather than increasing it, which `turbo-collection-release-procedure.md` R-REL-5 forbids. So a
receipt has to record reaching **each** copy, not merely being imported, and an import and a mirror
are therefore the same kind of event with a different copy named.

Verification is deliberately excluded (`R-REC-2`). It does not change how many copies hold a file, it
is the highest-volume event a collection generates, and admitting it would turn a five-line file into
several hundred lines over twenty years. The property being protected is that a person can read the
record at a glance, which is the only reason it gates anything.

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

- **A directory verifies itself.** `sha256sum -c` on the companion manifest, run in that directory,
  checks it with no tool, no collection, and no Turbo-Collection. A directory separated from
  everything else stays verifiable, which is what `R-TGT-9` now says.
- **Partial verification becomes a natural unit.** Full verification runs at roughly three hours per
  terabyte, so a complete pass over a multi-terabyte copy is a whole day and cannot be routine.
  "Verify 2025", or "verify everything unchecked for six months", is now an ordinary request rather
  than a feature. This shapes the still-open cadence question without answering it.

The cost is permanent and was accepted knowingly: every leaf directory holds three housekeeping files
beside the photographs. Browsability of a plain tree is this project's thesis, so this is a real
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
| Excluding receipts from manifest coverage | Unnecessary. `R-INT-10` already permits replacing a checksum for content Turbo-Collection wrote, and it is a receipt's only writer |
| Renaming **mirror** to **propagate**, to name the compound operation | Section 3's definition now says a mirror transfers and records, which buys the clarity without renaming nine requirements, a port, and an operation. Noted for the record: append-only had already made "mirror" slightly inaccurate, since `R-MIRROR-3` makes a target a permanent superset. If it is ever renamed, **replicate** is the better word |

## What this does not settle

Filenames for a manifest, a companion manifest and a receipt are still unstated, as is whether a
companion manifest uses the plain or the tagged checksum form. Verification cadence is still a number
nobody has chosen.
