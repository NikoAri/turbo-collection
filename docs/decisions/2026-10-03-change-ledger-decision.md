# A normative document carries no change ledger

**Status:** Accepted
**Date:** 2026-10-03

No normative document lists its own past versions. A document states what is true now, under a
version stamp and a bump test. Its history lives elsewhere: in version control within a MAJOR line,
and across one in the archived terminal text and the changes-from section (`R-PUB-5`, `R-PUB-7`).

**Version control already holds it.** A ledger row restated a commit by hand, inside a text meant to
describe only its present subject (`R-PUB-4`).

**Nothing is published, so every row so far described a draft.** A draft changes freely and is never
archived (`R-PUB-3`), and rows had piled up in every document for changes no stamp had carried out
of the repository.

**History that has to travel has better carriers.** A version stamp travels with data and says which
version governed it. A superseded line's terminal text is archived whole.

**What is given up, knowingly:** rebuilding an exact intermediate version from a carried copy alone.
A MINOR version only adds (`R-PUB-1`), so a line's terminal text holds every obligation any
intermediate version on that line held. It overstates what governed an old run and loses nothing.
Exact intermediate texts stay in version control as best effort, and nothing depends on them
(`R-PUB-2`).

**A misclassified version is corrected by publishing a new version** (`R-PUB-8`), where it was once
corrected by a ledger entry. A published text is still never edited, and its stamp is never silently
reinterpreted.

## Rejected

- **Keep the ledger, because it is the only history that rides inside a carried copy.** This was why
  it existed, and it is true: a specification file placed on a drive (`R-VER-8`) brings no version
  control with it. It lost to those carriers. What a carried copy has to answer is which text
  governed the data beside it, and a stamp and that text answer it.

## Touches

`version-requirement.md`: `R-PUB-6` narrowed to its one rule that was not about history, that a
filename change updates every reference. `R-PUB-2` and `R-PUB-8` amended, neither naming a ledger
any longer. The ledger steps cut from the `R-PUB-10` checklist. The terms _Change ledger_ and
_Erratum_ removed.

Every normative document: its change ledger section removed.
