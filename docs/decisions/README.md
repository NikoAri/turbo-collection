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
| 2026-08-01 | [One document per layout convention](2026-08-01-layout-conventions-decision.md) | Accepted |
| 2026-08-01 | [Specifications carry precision, `docs/` carries explanation](2026-08-01-docs-and-specs-separation-decision.md) | Accepted |
| 2026-08-01 | [Obligation keywords appear only in normative documents](2026-08-01-obligation-keywords-decision.md) | Accepted |
| 2026-08-01 | [Four rules added to the authoring standard: language, articles, and identifiers](2026-08-01-language-standard-additions-decision.md) | Accepted |
| 2026-08-08 | [An operator procedure, and the test for what belongs in it](2026-08-08-operator-procedure-decision.md) | Accepted |
| 2026-08-10 | [Three copies on three drives, with media chosen by cost](2026-08-10-storage-hardware-decision.md) | Accepted |
| 2026-08-13 | [Turbo-Collection only ever adds](2026-08-13-append-only-decision.md) | Accepted |
| 2026-08-13 | [The manifest is JSON, with a checksum-utility copy beside it](2026-08-13-manifest-format-decision.md) | Accepted |
