# Three operations write and two read: init, import, backup; verify and status

**Status:** Accepted
**Date:** 2026-09-30

Turbo-Collection has these operations and no others.

**Writers**, which change a copy:

- **`init`** makes the first copy ([the copy-creation decision](2026-09-30-copy-creation-decision.md)).
- **`import`** brings files in from an import source, and never creates a copy.
- **`backup`** mirrors peer copies, and creates every copy after the first.

**Readers**, which write nothing:

- **`verify`** probes live reality and reports discrepancies. Its inspections are `fixity` (bytes
  against a manifest), `access` (import sources and copies reachable, authorized, and still
  declaring what they promised), and `names` (filename hazards).
- **`status`** reads Turbo-Collection's own records and reports them: which copies each directory's
  content reached, when, and what sits on one copy only.

**The line between the two readers is reality against records.** Verify checks something against the
world and can find it wrong. Status checks nothing against the world: it reads receipts, and a
receipt records where content was placed, never that a copy still exists (`R-REC-8`). Filing status
under verify would claim more than a receipt can know, so it is an operation of its own.

**`verify` with no inspection named runs all of them**, against every connected copy (settled
2026-10-04). A copy that receipts name and that is not connected is reported as not connected, and
that alone is not a failure. The reasoning is survey against act: verify and status survey every
copy known, so one that is unplugged is simply not here right now, while backup and import act on
what they are given, where an absent copy is a real error. It also keeps a routine command from
failing every time the off-site copy is away, which is where that copy is meant to be. A command that
always fails teaches an operator to ignore it.

**Modifying a file in place is a non-goal for now**, and that one call removes three candidate
operations. _Restore_ is not an operation: recovery is an ordinary file copy, or init and backup for
a whole lost copy, and a `restore` verb would suggest the tool is needed to get photographs back.
_Repair_ is not an operation: delete the bad file by hand and run backup, which refills it from a
copy it verifies first (`R-MIRROR-1`, `R-MIRROR-9`). _Rebuilding a manifest_ is deferred: its only
trigger is a content file whose bytes changed, which is the non-goal itself.

Dry-run is a mode of each writer, never an operation.

## Rejected

- **Grouping by effect** (does it write?). It put every read-only operation under verify, the
  receipt report included, which is the fault described above.
- **The receipt report as `verify coverage`.** Same fault. It became `status`.
- **"Not connected" as a failure, or as a warning with its own exit signal.** It would make the
  routine check fail by design.
- **A count of inspections in prose** ("three verify inspections"). A count is a second statement of
  a set's membership and goes stale when the set changes, so the text names the set and lets the
  list beside it carry the members (`language-requirement.md` `R-LANG-22`).

## Touches

`turbo-collection-spec.md`: `R-CLI-5` reshaped, and states what a bare verify does; `check` became
**verify access** (`R-CLI-9`), `check-names` became **verify names** (`R-NAME-1`), `propagation`
became **status** (`R-CLI-10`); Section 8.4 lists the inspections; Section 1.3 names in-place
modification as a non-goal and Section 10 states what enabling it would cost. The release
procedure's `R-REL-6` names the status report.
