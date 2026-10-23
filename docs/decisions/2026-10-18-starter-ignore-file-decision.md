# The starter ignore file is described by the specification, shipped by the implementation, and curated for preservation

**Status:** Accepted **Date:** 2026-10-18

Replaces the record of 2026-10-02. The shipped list now also holds a pattern its
sources lack, `System Volume Information/`, for the folder Windows keeps at the
root of a drive.

When init makes a directory a copy, it writes a starter `.tcignore`
(`R-INIT-1`). Without it, files an operating system creates on its own, such as
a folder-view cache, would be taken in by an import as permanent content, and
one that its operating system later rewrites would then read as corrupt.

Three things were settled about that file.

**The specification describes it and does not list it.** `R-MFILE-20` says the
starter file holds patterns for files that an operating system and its file
managers create on their own. What a pattern means is a requirement, pinned to
`gitignore(5)`; which patterns ship is not.

**The list is an asset of the reference implementation**, at
`scripts/templates/default.tcignore`. It is an input to a tool rather than
recovery data: a person reading a copy reads that copy's own `.tcignore`, whose
syntax the specification already fixes. It also changes as operating systems do,
which is churn a normative document should not carry.

**The specification points at that file anyway**, for transparency, so a reader
can see exactly what a fresh copy starts by ignoring. This runs against the
usual direction, in which code cites specifications and never the reverse, and
it is accepted knowingly: the pointer is informative, and it goes stale if the
implementation directory is ever renamed.

## Curation, and why it is not optional

The starting material is the macOS, Windows and Linux global templates kept by
the github/gitignore project. Those lists are written for **source
repositories**, so they ignore file types that are real content in a collection:
Windows installers and shortcuts, editor backup files, and a few others. Shipped
unmodified, they would make an import silently pass over a real file, which is
the silent loss this project exists to prevent.

So the shipped list is those templates minus two groups: every pattern that can
match a file a person made or keeps, and two macOS patterns whose filenames
embed a carriage return, which no pattern in a file with line-feed endings can
match.

It also holds one pattern the templates lack, `System Volume Information/`.
Windows keeps that folder at the root of a drive, as macOS keeps the folders its
template already lists under _Files and directories that might appear in the
root of a volume_. The Windows template lacks it only because a proposal to add
it, [github/gitignore#1498](https://github.com/github/gitignore/pull/1498) from
2015, was closed for inactivity. Without it, init fails at a drive's root under
Windows, and a copy at a drive's root would hold files Windows wrote there.

## Rejected

- **A verbatim list inside `meta-file-spec.md`.** It would make every change of
  an operating system's habits a change to a normative document.
- **The list under `specs/`, as a template file.** Same churn, and it reverses
  the dependency direction for something that is a tool input.
- **The upstream templates unmodified.** See above.
- **Leaving out `System Volume Information/`, as the Windows template does.**
  Its absence there is a proposal that stalled, not a judgment that the folder
  is content.
- **Keeping copies away from a drive's root instead.** A rule a person must
  remember, where one pattern lets a drive's root be made a copy as any other
  directory can.
- **No pointer from the specification to the implementation's file.** Cleaner in
  principle, and it hides from a reader what a new copy ignores from its first
  moment.

## Touches

`meta-file-spec.md` `R-MFILE-20` (conceptual description and the pointer) and
`R-MFILE-21` (an ignored file never enters a copy by an import). `init-spec.md`
`R-INIT-1`. `scripts/templates/default.tcignore` holds the list, and its header
names its sources and the pattern added to them; `cspell.json` excludes
`*.tcignore`, which is data and not prose. The setup procedure names where
fuller lists are kept, with the caution above.
