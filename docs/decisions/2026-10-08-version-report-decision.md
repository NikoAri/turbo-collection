# A version report names every specification the code conforms to

**Status:** Accepted
**Date:** 2026-10-08

Asked for its version, Turbo-Collection reports its own version and one version stamp for each
specification it conforms to, and acts on no copy and no import source while doing so.

**It needed a requirement to exist at all.** Behavior that traces to no requirement is either a gap
in a specification or code to remove (`R-META-3`), so a version flag with no requirement behind it
would be the second. The declaration `R-VER-9` asks of code also had no stated form outside a log.

**A log answers too late.** Every log records these versions (`R-LOG-3`), and a log exists only
after a run. On a borrowed computer the question comes first: whether this program follows the
rules a copy was written under.

**The list is every specification, with no fixed length.** Code conforms to the core specification,
to the meta file specification, and to one specification per layout and per import source, and that
set grows each time an import source is added. A report listing three named numbers would be wrong
in a place far from the edit that made it wrong.

## Rejected

- **Three fixed numbers: the program, the core specification, and the meta file format.** The
  earlier plan, taken from tools that print a client and a server version. It leaves out the layout
  and import source specifications that decide where a file is placed.
- **No version report.** A version in every log is enough only for someone who has already run
  something.

## Touches

`turbo-collection-spec.md`: `R-CLI-16` added.
