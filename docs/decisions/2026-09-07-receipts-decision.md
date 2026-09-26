# A receipt is a set of immutable per-event files, and manifests are per-directory

**Status:** Accepted
**Date:** 2026-09-07
**Replaces:** the 2026-08-16 record of the same topic. That record described one appended
`receipt.json` per directory, authored by a privileged collection and copied outward to its targets.
The peer model ([the peer-model decision](2026-09-05-peer-model-decision.md)) retired both the single
appended file and the privileged writer: a receipt is now a set of immutable per-event files that
converge between peer copies. What reversed, and why, is under Rejected. The per-directory manifest
decision below is unchanged from 2026-08-16.

## What a receipt is

Turbo-Collection writes a **receipt** in every directory it places a content file into, and in every
directory where it recorded an error affecting that directory's content (`R-MFILE-13`). A receipt is
not one file but a set of immutable per-event files, each in that directory's `.turbo-collection/`
subdirectory:

- one **arrival** file per arrival, `receipt-<runId>-<copyName>.arrival.json` (`R-MFILE-14`);
- one **error** file per run that recorded any error for the directory,
  `receipt-<runId>-<copyName>.error.json` (`R-MFILE-16`).

`<runId>` is a colon-free ISO 8601 basic-format UTC instant plus a suffix, so it is a legal filename
on every platform and sorts by time. `<copyName>` names the copy an event **concerns**, never the
copy its file resides on: propagation places a copy's files onto other copies, and a reconcile error
names a destination that failed and often cannot hold its own error file, so that file is written on
the copy reconciled **from** (`R-MFILE-13`).

## Why per-event files, not one appended file

The 2026-08-16 model appended arrivals to one `receipt.json` and had the collection copy it outward,
because two independently appended files would need **merging** at every sync, which nothing else here
does. The peer model removed the privileged writer, so that escape is gone: any copy can author, and
two copies can author in one run. One immutable file per event dissolves the merge rather than solving
it. A file never changes and has a single author, so reconciling two copies is a plain **union**: copy
in whatever the other holds that you lack, and never overwrite (`R-REC-6`, `R-REC-7`). This is what
lets one connected copy report where content reached every other copy, bounded only by when their
histories last touched.

## Arrivals are honest snapshots; completeness is derived

An arrival is written only after the content it covers is completely written to the copy it names, and
it covers the content present **at that moment**, which may be less than the whole directory
(`R-REC-5`). A partial arrival is therefore a true snapshot of whole files, never a torn one, so
partial success stays a valid stepping stone.

"Complete" is not a stored field. Because a retry re-derives the diff, a run whose newest event left
**no error file** placed everything it attempted, so completeness is read from the newest event's
emptiness, carrying its date (`R-REC-8`). A no-op reconcile writes **no** arrival, because an arrival
records a placement and not a verification; receipt files still converge for every directory a
reconcile covers, not only those it changed (`R-REC-6`).

## Errors, and version provenance

Failures live only in an error file, and the next run corrects by re-deriving the manifest diff, never
by replaying the error file (`R-MFILE-16`). An import arrival carries the full version
trail (`tcSpecVersion`, plus `layout` and `importSource` each as `{specId, version}`), because a
manifest's matching blocks are a current claim a later run may re-stamp, and the receipt is the only
durable record of the version that placed the content. A reconcile arrival carries none of that, having acquired
nothing and applied no layout; that provenance travels to it on the import arrival (`R-MFILE-15`).

## What a receipt may not claim

A receipt is the one record here describing bytes on **other** copies, so it is the one that can turn
false while nothing local changes: a drive that dies in November does not edit an arrival written in
August. A receipt therefore records where content was **placed**, not where it **remains**, MUST NOT
be read as evidence that a copy still exists, and MUST carry the date of every arrival a copy count
rests on (`R-REC-8`). The release procedure, not a receipt, authorizes a deletion.

Hand-edit integrity needs no new field: immutability plus propagation already make an altered file
disagree with its twins on other copies, which a self-checksum (recomputed by any editor) could not
catch.

## Manifests are per-directory (2026-08-16, unchanged)

Each directory holding content carries a manifest of its own files alone. A directory then verifies
itself against its own manifest with no collection and no Turbo-Collection present (`R-TGT-9`), and
"verify 2025" or "verify everything unchecked for six months" becomes an ordinary unit of work, which
matters because a full pass runs at roughly three hours per terabyte. The accepted cost is two
housekeeping files in every leaf directory of a tree whose browsability is this project's thesis.

## Rejected

- **One appended `receipt.json`, copied outward** (the 2026-08-16 model). It rested on a single
  privileged writer, which the peer model removed. Independent appends on peers would need merging;
  immutable per-event files make reconciliation a plain union with no merge.
- **Rolling receipts into the manifest.** A manifest is a **state** record, rebuildable by rescanning
  a tree; a receipt is an **event** record, rebuildable from nothing. Merged, a rebuild would silently
  destroy irreplaceable history and the checksum would churn on every import. A manifest also describes
  one copy, while a receipt describes others: a category error, not merely crowding.
- **No arrival until a directory is complete, errors only.** Proposed at the session open and
  withdrawn: partial success is a real, fully consistent stepping stone worth recording.
- **A self-integrity field on receipts.** It duplicates what cross-copy divergence already reveals and
  cannot catch a deliberate edit.
- **Recording verification events.** The highest-volume event there is, and it changes no copy count;
  admitting it would bury the deletion-relevant events a person must read at a glance. Verification is
  the log's job.

## Touches

Rewritten from the 2026-08-16 receipts model to the current per-event, peer-propagation form. Current
requirements: `R-MFILE-13` (per-event files, `.turbo-collection/` placement, `runId` form,
destination-not-residence), `R-MFILE-14` (arrival fields, `tcSpecVersion`), `R-MFILE-15` (import
versus reconcile field sets, `{specId, version}`, `contentDigest`), `R-MFILE-16` (error file),
`R-MFILE-19` (`copyName` charset and case-folded collision); `R-REC-5` (honest, possibly partial
snapshot), `R-REC-6` (propagation union everywhere; a no-op writes no arrival), `R-REC-7` (never
delete or alter a receipt file), `R-REC-8` (placement, not permanence; dated copy counts). The
2026-08-16 IDs `R-REC-1` to `R-REC-4` and `R-INT-1` moved into the `R-MFILE-*` family on 2026-08-27.
The location receipt (`R-REC-9`, `R-MFILE-26`) is a separate record still owed.
