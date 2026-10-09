# Prose names a set and does not count it

**Status:** Accepted
**Date:** 2026-10-04

Where these documents define a set and may change it, prose does not say how many members that set
has. It names the set and lets a list beside it carry the members (`R-LANG-22`).

**A count in prose is a second record of what a list holds.** It is right until a member is added,
and then it is wrong in a place far from the edit that made it wrong. `R-LANG-11` already forbids a
reference anchored to the moment of writing, because such a statement rots afterward. A count of a
set that can grow is the same failure, applied to how many.

**A number that is itself the requirement stays.** The test is subtraction: delete the number, and
see whether the requirement or the fact survives. "Three copies on three drives" does not survive,
so that count stays. A heading that announces five inspections above a table of them loses nothing,
so that count goes. A fixed outside fact, such as the digit width of a date field, also stays.

## Rejected

- **Correcting the count each time the set changes.** This was the question as first put: an
  inspection was joining a table headed with a count, and the heading was to change with it. That
  keeps the second record, and the duty to remember it.

## Touches

`language-requirement.md`: `R-LANG-22` added with its commentary, and the commentary on `R-LANG-20`
brought into line with it. `turbo-collection-spec.md` and the iCloud import source specification:
one counted list each reworded.
