# Specifications carry precision, `docs/` carries explanation

**Status:** Accepted
**Date:** 2026-08-01

Four homes, one job each:

| Location | Holds | Voice |
|---|---|---|
| `specs/` | what must be true | precise, obliging |
| `docs/spec-guide.md` | where things are, what each part covers | prose, navigation only |
| `docs/design-record.md` | why architecture is what it is | prose, durable essay |
| `docs/decisions/` | why each decision was made, what was rejected | prose, accreted |

`docs/plan.md` becomes `docs/design-record.md`. "Plan" meant "what is next" in one context and "why
architecture is what it is" here, and one word for two concepts is what R-LANG-6 prevents. Sections 8
and 15 are cut as superseded, section 7 partly; section 5's port table gains Source and Target. No
index file is added under `specs/`; a requirement-prefix registry goes into root `README.md`, which
already lists every document.

Written 2026-07-09 before any specification existed, `plan.md` had drifted into contradicting one:
its R-8 requires a distinct exit code per failure class, which spec section 8.5 declines to define.
Weaving each new decision into a 457-line narrative is also expensive, and that expense is much of
why four consecutive plans promoted nothing.

A change-ledger line names a record and a record names requirement IDs, extending traceability that
R-META-2 and R-META-3 already impose between code and specification.

## Rejected

- **A living explainer tracking current specification text.** Specifications already carry rationale
  commentary, required by R-LANG-13 wherever misinterpretation could lose data. A third copy
  guarantees drift. A record holds instead what nothing else can: alternatives that lost.
- **Relying on git history rather than keeping superseded records.** R-VER-2 already states that
  version control is best effort and that nothing load-bearing depends on it, which is why a
  specification copy travels on every target drive. A diff shows that a line changed, never why an
  alternative was worse.
- **Strict immutability for records.** Softened rather than rejected: mechanical maintenance keeps a
  record accurate about the world, and only decision substance and rejected alternatives are
  append-only.
- **A private decision register in the notes repository.** Considered 2026-07-21 and rejected then,
  for the right reason: leaving a conclusion alive only in private notes is what promotion discipline
  exists to prevent.

## Touches

No requirements. R-META-2 names `plan.md` as an example of what code may not cite, so its wording
follows this rename.
