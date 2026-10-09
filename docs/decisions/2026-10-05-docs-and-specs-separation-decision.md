# Specifications carry precision, `docs/` carries explanation

**Status:** Accepted
**Date:** 2026-10-05

**Replaces the 2026-08-01 record of this name.** Two conclusions reversed since. A specification no
longer carries its own rationale, and the reason is under Rejected. A record is rewritten when its
decision changes and is no longer kept as first written, which [the README](README.md) of this
directory states.

Four homes, one job each:

| Location | Holds | Voice |
|---|---|---|
| `specs/` | what must be true | precise, obliging |
| `docs/spec-guide.md` | where things are, what each part covers | prose, navigation only |
| `docs/design-record.md` | why architecture is what it is | prose, durable essay |
| `docs/decisions/` | why each decision was made, what was rejected | prose, one record per decision |

**A specification states what must be true, and the least that keeps a requirement from being
misread.** A `-spec.md` document holds:

- requirements;
- under a requirement whose misreading could lose data, one short example of the reading meant
  (`R-LANG-13`);
- one rationale pointer per section, or one per document, naming the decision records and the
  design record sections that hold the reasoning;
- pointers from one specification to another, and notes about a document's own structure.

Reasoning and history are not in it. Why a rule is what it is lives in a decision record or in the
design record. What a text used to say lives in version control.

**An example stays because it carries meaning, and rationale goes because it justifies.** An example
is a second channel for what a sentence means: if the English of a requirement has drifted, a worked
case still fixes which reading was intended. That is redundancy applied to meaning, and it is short.
A rationale essay explains why a rule was chosen, which a reader needs less often, and it weighs on
a text that travels on every copy.

**Authoring standards and procedures are left as they are.** A `-requirement.md` document teaches
its own rules, and its reasoning is part of the teaching. A procedure is written as steps, and was
outside this change.

**A decision is a short record of its own, not a paragraph woven into the design record.** Weaving
each new decision into one long narrative was expensive, and that expense kept decisions from being
written down at all. A record names the requirement IDs it touches, extending traceability that
`R-META-2` and `R-META-3` already impose between code and specification.

`docs/design-record.md` was `docs/plan.md` until 2026-08-01. "Plan" meant what is next in one place
and why architecture is what it is in another, and one word for two concepts is what `R-LANG-6`
prevents. No index file sits under `specs/`: `docs/spec-guide.md` holds the registry of
requirement-ID prefixes.

## Rejected

- **Rationale inline in a specification, beside each requirement.** This was the rule until
  2026-10-05, and `R-LANG-13` required it wherever a misreading could lose data. It weighed on the
  text that binds, and most of it already lived in a decision record or in the design record. The
  case for keeping it inline was that a specification travels alone on a drive, and that does not
  hold: a document under `docs/` can be carried too. What that case protected, a second channel for
  meaning, is kept by the example.
- **Moving a text's history into decision records.** Version control already holds what a text used
  to say. A record holds what is true now.
- **A rationale pointer under every requirement.** It clutters, and a pointer at a line goes stale.
  A pointer per section names files, which do not.
- **A living explainer tracking current specification text.** A second text that follows the first
  guarantees drift. A record holds instead what nothing else can: alternatives that lost.
- **A private decision register in the notes repository.** Leaving a conclusion alive only in
  private notes is what promoting a decision exists to prevent.

## Touches

`language-requirement.md`: `R-LANG-13` relaxed, from requiring rationale or an example to
recommending an example and letting rationale live in explanatory documentation. Every `-spec.md`
document: rationale and history asides removed, examples kept short, and a rationale pointer added
per section or per document. `traceability-requirement.md`: `R-META-2` names the design record
among what code may not cite.
