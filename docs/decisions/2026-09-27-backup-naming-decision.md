# The operation is backup; its mechanism is a mirror

**Status:** Accepted
**Date:** 2026-09-27

**Replaces the naming half of [the peer-model decision](2026-09-05-peer-model-decision.md).** That
pass renamed the operation _mirror_ to _reconcile_. The peer model it established is kept; only the
naming reverses, and it reverses past _mirror_ rather than back to it, because operator and mechanism
are now named separately.

The operation an operator runs is **backup**. Its mechanism is a **non-destructive, symmetric mirror**
across peer copies. Recovering data from a copy is **restore**. _Reconcile_ is retired: with the
operator layer and the mechanism layer each named, it has no layer left to hold.

## Why backup, when the operation is symmetric

Backup is the _what_ and the _why_; peer, symmetric, non-destructive and mirror are the _how_. They
sit at different altitudes and do not compete, so both are kept. The reason this project exists is to
back up photographs; that the backup is realized as a symmetric mirror across peers is an
implementation detail.

The objection was that "back up" implies a direction (back up A _to_ B) a peer model does not have.
It does not. "Back up" foregrounds a single object, the data to protect, and any "to X" is an optional
adjunct; _mirror_, _sync_ and _reconcile_ instead foreground a relationship between two stores, which
is where the two-endpoint, who-is-source baggage lives. Backup is the _least_ directional candidate,
not the most. The directional sense survives only in the noun (a backup _of_ X, the backup drive),
which the peer model already retired.

A second objection, that calling a symmetric operation "backup" would mislead an operator into
expecting one-way protection, also falls: the operation is add-only and never deletes
(`turbo-collection-spec.md` R-MIRROR-2, R-MIRROR-3), so any wrong expectation a familiar word invites
is a _safe_ one. Expect a deletion and none happens; expect one direction and gain files in both.
Safety lives in the mechanism, not the word.

## Where each name appears

- **Operator layer, `backup`:** the operation list and dry-run mode (`R-CLI-5`), the no-network rule
  (`R-CLI-4`), the drift inspection (Section 8.4), and the operator's own steps in the procedures.
- **Mechanism layer, `mirror`:** Section 7.1 (retitled _Mirroring_), the `R-MIRROR-*` requirements
  and their commentary, the glossary, and the mirror engine contract. In `meta-file-spec.md`, an arrival
  or error the mechanism produces is a **mirror arrival** or **mirror error**, against an **import
  arrival** or **import error**.

The `R-MIRROR-*` identifiers are unchanged and now re-align with the restored name.

## Rejected

- **Keep _reconcile_ for the operation.** The earlier recommendation, on the grounds that "back up" is
  directional. Overturned: the directional reading is the noun's, not the verb's, and _reconcile_ was
  itself a relationship word carrying the same baggage it was meant to avoid.
- **_Mirror_ for both the operation and the mechanism** (the state before 2026-09-05). It conflates
  the operator's _what_ with the implementer's _how_, the two altitudes this decision keeps apart.
- **A new CLI verb to signal symmetry** (for example `sync`). It buys accuracy the add-only mechanism
  already guarantees, at the cost of a word no one reaches for when they want their photographs safe.

## Touches

No obligation changes; the renamed command would be a behavior change had any version been published,
but every document is `0.1.0-draft` (`version-requirement.md` R-PUB-3). `turbo-collection-spec.md`:
Section 15 records the pass; `R-CLI-4`, `R-CLI-5`, Section 8.4, Section 7.1 (retitled), the
`R-MIRROR-*` and receipt commentary, the glossary (a **Backup** term added, the **Reconcile** term
replaced by **Mirror**), the `MirrorEngine` port, and Sections 12.1, 12.3 and 14 reworded.
`meta-file-spec.md`: `R-MFILE-13`, `R-MFILE-15`, `R-MFILE-16` and commentary. The five procedures:
`turbo-collection-backup-procedure.md` regains its title (the filename never changed), and operator
prose across all five moves to _back up_. Requirement identifiers are not renumbered. The worked example and fixtures were renamed on
2026-09-28 (`collectionName: "main"` and `"off-site"`, replacing the subordinate `backup1` and
`sample-backup-1`); copy naming is settled in
[the collection-naming decision](2026-09-28-collection-naming-decision.md).
