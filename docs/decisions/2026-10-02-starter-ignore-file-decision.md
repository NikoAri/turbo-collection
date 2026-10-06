# The starter ignore file is described by the specification, shipped by the implementation, and curated for preservation

**Status:** Accepted
**Date:** 2026-10-02

When init makes a directory a copy and finds no `.tcignore`, it writes a starter one before taking in
the files already there (`R-CLI-11`). Without it, files an operating system creates on its own, such
as a folder-view cache, would be taken in as permanent content, and one that its operating system
later rewrites would then read as corrupt.

Three things were settled about that file.

**The specification describes it and does not list it.** `R-MFILE-20` says the starter file holds
patterns for files that an operating system and its file managers create on their own. What a pattern
means is a requirement, pinned to `gitignore(5)`; which patterns ship is not.

**The list is an asset of the reference implementation**, at `scripts/templates/default.tcignore`.
It is an input to a tool rather than recovery data: a person reading a copy reads that copy's own
`.tcignore`, whose syntax the specification already fixes. It also changes as operating systems do,
which is churn a normative document should not carry.

**The specification points at that file anyway**, for transparency, so a reader can see exactly what
a fresh copy starts by ignoring. This runs against the usual direction, in which code cites
specifications and never the reverse, and it is accepted knowingly: the pointer is informative, and
it goes stale if the implementation directory is ever renamed.

## Curation, and why it is not optional

The starting material is the macOS, Windows and Linux global templates kept by the github/gitignore
project. Those lists are written for **source repositories**, so they ignore file types that are
real content in a collection: Windows installers and shortcuts, editor backup files, and a few
others. Shipped unmodified, they would make init silently decline to take in a real file sitting in a
directory, which is the silent loss this project exists to prevent.

So the shipped list is those templates minus two groups: every pattern that can match a file a
person made or keeps, and two macOS patterns whose filenames embed a carriage return, which no
pattern in a file with line-feed endings can match.

## Rejected

- **A verbatim list inside `meta-file-spec.md`.** It would make every change of an operating system's
  habits a change to a normative document.
- **The list under `specs/`, as a template file.** Same churn, and it reverses the dependency
  direction for something that is a tool input.
- **The upstream templates unmodified.** See above.
- **No pointer from the specification to the implementation's file.** Cleaner in principle, and it
  hides from a reader what a new copy ignores from its first moment.

## Touches

`meta-file-spec.md` `R-MFILE-20` (conceptual description and the pointer) and `R-MFILE-21` (an
ignored file never enters a copy by an import). `turbo-collection-spec.md` `R-CLI-11`.
`scripts/templates/default.tcignore` created; `cspell.json` excludes `*.tcignore`, which is data and
not prose. The setup procedure names where fuller lists are kept, with the caution above.
