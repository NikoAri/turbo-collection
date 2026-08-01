# Document-lifecycle rules move out of the core specification

**Status:** Accepted
**Date:** 2026-08-01

Section 9 of `turbo-collection-spec.md` served two audiences at once, as its own audience note
admitted. Eleven requirements there govern how a document is numbered, published, archived and
corrected, and code has nothing to cite in them. Those move to `specs/version-requirement.md` under
prefix `R-PUB-*`, beside `language-requirement.md`, which already carries authoring obligations. Ten
requirements govern how artifacts declare their version and how a copy crosses a format-generation
boundary; those stay.

| Was | Becomes | Rule |
|---|---|---|
| R-VER-1 | R-PUB-1 | semantic version and bump test |
| R-VER-2 | R-PUB-2 | identity immutable, retention weaker |
| R-VER-10 | R-PUB-3 | what publication is |
| R-VER-11 | R-PUB-4 | self-contained, describes only its own subject |
| R-VER-12 | R-PUB-5 | archiving a superseded line's terminal text |
| R-VER-13 | R-PUB-6 | change ledger |
| R-VER-14 | R-PUB-7 | changes-from, at conversion grade |
| R-VER-17 | R-PUB-8 | errata |
| R-VER-19 | R-PUB-9 | changing document language |
| R-VER-20 | R-PUB-10 | publication checklist |
| R-VER-21 | R-PUB-11 | one authentic text per version |

Renumbering is free only while nothing is published. Afterwards this move would cost a MAJOR bump
and leave eleven withdrawn-ID tombstones in the core specification forever, since a published ID
cannot be renumbered and two documents cannot share a prefix.

Three moved requirements needed generalizing, because each described one document and now governs
several. R-PUB-1 states a floor and requires each document to state its own bump test, leaving
turbo-collection's artifact-driven test behind in an amended R-VER-1. R-PUB-4 speaks of a document's
subject rather than of Turbo-Collection. R-PUB-6 requires a ledger without fixing its section number.

Because "normative document" is broader than "specification", `R-PUB-*` reaches procedures and
authoring standards too. That covers a backlogged question about procedure versioning machinery, and
it obliges `language-requirement.md` and each procedure to state a bump test, which none does yet.

## Rejected

- **Leave section 9 whole.** Mixed audience is a real reading cost, and a clean split stops being
  cheap at first publication.
- **Give the new document `R-VER-*` and renumber the ten that stay.** A staying set of artifact
  stamps plus format-generation migration has no clean collective name, so this trades a good prefix
  for a poor one.
- **Name it `publication-requirement.md`, matching `R-PUB-*`.** Lost to sibling consistency with
  `language-requirement.md`, a noun naming a subject rather than an event. Cost accepted: filename
  and prefix no longer echo each other.

## Touches

Moved and renumbered as tabled: eleven requirements. Amended and stays: R-VER-1. Moved from section
9.2 to 9.3, keeping its number: R-VER-18. Added: R-PUB-12, stating scope this material could not
state while it was a section of another document. Withdrawn: none.

Also core spec section 0.1 table and change ledger; `language-requirement.md` normative-document
list, plus its stale reference to `spec.md` R-VER-19.
