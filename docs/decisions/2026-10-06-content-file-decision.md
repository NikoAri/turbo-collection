# Every file a copy preserves is a content file, with no derivative and no original

**Status:** Accepted
**Date:** 2026-10-06

A read of the core specification's glossary removed the entries below, and one requirement with
them. What a copy preserves has one name, _Content file_.

**_Derivative_ and `R-COL-5` are removed, because nothing produces a derivative.** The term covered
a file Turbo-Collection itself renders from another, and no operation renders one. A file a person
exported elsewhere and then imported is content like any other. Of the requirement's clauses, one
permitted a step that does not exist, one required a derivative to be identifiable with no means
stated anywhere, and one forbade replacing a stored file, which `R-COL-2` and `R-SRC-12` already
do. Converting a content file to an open format is a stated non-goal, with its path in the core
specification's Section 10.

**_Original_ is retired, because it named the same set as _Content file_.** With no derivative,
every content file was an original. The word also claimed more than a specification promises, since
an importer supplies files unaltered only as a best effort
([the importer best-effort decision](2026-10-06-importer-best-effort-decision.md)). `R-COL-2` says
what is promised: a content file is preserved byte for byte, exactly as an importer supplied it.

**The core's _Published_ entry is deleted, because no core requirement used the word.**
`version-requirement.md` owns that term.

## Rejected

- **Leaving `R-COL-5` in place as a permission.** It permitted a step no operation performs, and
  required an identification no document defined. A conversion step needs a design first, and
  Section 10 names what that design has to settle.
- **Renaming the _Published_ entry instead of deleting it.** The names proposed described a kind of
  file, and the entry's body was a statement about a specification version.

## Touches

`turbo-collection-spec.md`: `R-COL-5` withdrawn, and its number is not reused. Glossary entries
_Derivative_, _Original_ and _Published_ removed, and the _MAJOR Version_ entry trimmed. `R-COL-2`
and the _Plain tree_ entry reworded to say _Content file_. Section 10's row on derivatives became a
row on open-format conversions, and Section 1.3 gained the matching non-goal.
