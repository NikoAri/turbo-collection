# Decision records

One file per decision. Each record holds the decision, the reasoning behind it, and the
alternatives that lost. The specifications under [`specs/`](../../specs/) state what is true; these
records state why it is true and what else was considered.

These records bind nothing. Obligations live in the specifications, and a record here describes and
cites them rather than restating them. See
[the obligation-keywords decision](2026-08-01-obligation-keywords-decision.md).

## Conventions

**Filename.** `YYYY-MM-DD-topic-decision.md`, matching the dated-note convention used elsewhere in
the project. Sorting the directory gives the order decisions were made, which is worth reading: an
early decision has more built on top of it, so overturning it costs more.

**The date is when the decision was made, not when the record was written.** A decision written up
weeks later carries its original date. Otherwise the ordering records when someone found time to
write, which is the one thing it is not useful for.

**The `-decision` suffix states the kind**, so the classification survives the file being separated
from its directory. This is the same reason a specification is named `-spec.md` and a procedure
`-procedure.md`, and it is what keeps a non-binding document from reading as a binding one.

**A record holds the current decision, not its history** (owner, 2026-08-10). When a decision
changes, the record is rewritten: copy it to a file carrying the new date and the same topic slug,
update it to say what is true now, and delete the old file. Git holds every previous state, so
nothing is lost by cleaning up, and a reader of this directory sees one current answer per topic
instead of a chain to walk backward.

A rewritten record carries a line near the top naming the date it replaces and, when a conclusion
actually reversed, why. That is not history-keeping for its own sake: a reasoning error worth
repeating is worth recording, and the reader who most needs it is the one about to make it again.

**Maintenance.** A record may also be edited in place to stay accurate about the world: fixing a
typo, repairing a link, updating a path that moved, filling in a requirement ID once it exists. Use
a rewrite when the substance changed, an edit when only the world moved around it.

**This is deliberately unlike `plans/` and `progress/` in the private notes repository**, which stay
immutable dated records and are never rewritten. Those log what happened on a day; these state what
is true now.

**Status.** `Accepted`. A record that is no longer accepted is rewritten or deleted rather than
left standing with a status pointing elsewhere.

**Citation.** By filename, which is how every other document in this repository is cited. There are
no record numbers.

**Keep a record short.** A record carries a distilled outcome, not an investigation. Dead ends,
reversals, evidence and dialectic belong in dated private research notes; only what survived belongs
here. A record needing much more than a page is usually two decisions.

## Template

```markdown
# <decision, stated as a sentence>

**Status:** Accepted
**Date:** YYYY-MM-DD

<What was decided, and the shortest defensible reason. Lead with the decision, not with background.>

## Rejected

- **<alternative>.** Why it lost.

## Touches

<Requirement IDs added, amended, or withdrawn. Files created, renamed, or cut.>
```

## Index

The filenames carry chronology, so this index is the topical way in. It gains groupings by area once
there is more than one area to group.

| Date | Decision | Status |
|---|---|---|
| 2026-08-01 | [Document-lifecycle rules move out of the core specification](2026-08-01-version-requirement-split-decision.md) | Accepted |
| 2026-08-01 | [One document per layout](2026-08-01-layout-conventions-decision.md) | Accepted |
| 2026-08-01 | [Specifications carry precision, `docs/` carries explanation](2026-08-01-docs-and-specs-separation-decision.md) | Accepted |
| 2026-08-01 | [Obligation keywords appear only in normative documents](2026-08-01-obligation-keywords-decision.md) | Accepted |
| 2026-08-01 | [Four rules added to the authoring standard: language, articles, and identifiers](2026-08-01-language-standard-additions-decision.md) | Accepted |
| 2026-08-08 | [An operator procedure, and the test for what belongs in it](2026-08-08-operator-procedure-decision.md) | Accepted |
| 2026-08-10 | [Three copies on three drives, with media chosen by cost](2026-08-10-storage-hardware-decision.md) | Accepted |
| 2026-08-13 | [Turbo-Collection only ever adds](2026-08-13-append-only-decision.md) | Accepted |
| 2026-08-15 | [Removable storage, and the off-site copy that never travels](2026-08-15-drive-naming-and-hardware-decision.md) | Accepted |
| 2026-08-16 | [A future reader has help, so conveniences are not pre-built](2026-08-16-future-reader-decision.md) | Accepted |
| 2026-08-16 | [The manifest is JSON, and nothing sits beside it](2026-08-16-manifest-format-decision.md) | Accepted |
| 2026-08-22 | [The import source is a path segment, and the only category above a photo](2026-08-22-import-source-decision.md) | Accepted |
| 2026-09-05 | [Copies are peers, with no privileged collection](2026-09-05-peer-model-decision.md) | Accepted |
| 2026-09-07 | [A receipt is a set of immutable per-event files, and manifests are per-directory](2026-09-07-receipts-decision.md) | Accepted |
| 2026-09-10 | [A copy records its own location as a location receipt](2026-09-10-location-receipt-decision.md) | Accepted |
| 2026-09-26 | [A specification depends on another by naming its MAJOR line in the header](2026-09-26-spec-dependency-decision.md) | Accepted |
| 2026-09-27 | [The operation is backup; its mechanism is a mirror](2026-09-27-backup-naming-decision.md) | Accepted |
| 2026-09-27 | [Configuration lives in the copy root's `.turbo-collection/`, not loose at the root](2026-09-27-config-placement-decision.md) | Accepted |
| 2026-09-28 | [A copy's name is its `collectionName`, chosen for where it permanently rests](2026-09-28-collection-naming-decision.md) | Accepted |
| 2026-09-30 | [Init creates the first copy and takes in what is already there; backup creates every later copy](2026-09-30-copy-creation-decision.md) | Accepted |
| 2026-09-30 | [Three operations write and two read: init, import, backup; verify and status](2026-09-30-operation-taxonomy-decision.md) | Accepted |
| 2026-10-02 | [The starter ignore file is described by the specification, shipped by the implementation, and curated for preservation](2026-10-02-starter-ignore-file-decision.md) | Accepted |
| 2026-10-03 | [An import source names its layout, and the as-found layout is the floor](2026-10-03-layout-selection-decision.md) | Accepted |
| 2026-10-05 | [The specification names concrete things, and has no ports](2026-10-05-spec-vocabulary-decision.md) | Accepted |
| 2026-10-05 | [Traceability and durability are standards of their own, beside the core specification](2026-10-05-requirement-family-decision.md) | Accepted |
| 2026-10-06 | [Files already inside a copy are taken in by an in-place importer](2026-10-06-in-place-importer-decision.md) | Accepted |
| 2026-10-06 | [An importer makes a best effort, and the core guarantees nothing about what an import source delivers](2026-10-06-importer-best-effort-decision.md) | Accepted |
