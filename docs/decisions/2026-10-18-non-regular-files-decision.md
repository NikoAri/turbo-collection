# A symbolic link is not content, and a run that meets one fails

**Status:** Accepted
**Date:** 2026-10-18

Replaces the record of 2026-10-17, under which nothing stopped a run from following a link in the
path it was given. A run given a path that passes through a link now fails, before it writes
anything, and names the directory that path leads to: a check for a copy above the directory a run
is given walks that path as given, so a link in it could lead into a copy without the check seeing
it.

Turbo-Collection takes in regular files and nothing else. Where an import would read a symbolic
link, a junction, a device, a socket or a named pipe, that import fails, adds nothing to the
collection, and names every such entry. Where any run would read one inside a copy, that run fails
and names it. A run given a path that passes through a symbolic link or a junction fails, and names
where that path leads. No run follows one. Handling them is a non-goal for now, listed in Section
1.3 of `turbo-collection-spec.md` with its path in Section 10.

**A link holds no content of its own.** What it points at lives elsewhere, possibly outside the
folder being imported or on a drive that is not connected. Taking one in means choosing what is
preserved, the bytes it points at or a record of where it pointed, and neither choice is needed to
preserve the regular files beside it.

**A failure cannot be missed.** A link may be the only route to files an operator believes were
imported, so an import that stepped over one and finished would look complete.

**The ignore file is the way through.** Turbo-Collection changes nothing at an import source
(`R-SRC-7`), so without an exemption the only cure for a failed import would be deleting or moving
entries in an old archive by hand. An entry that matches a pattern in the copy's ignore file is
passed over instead, and every run reports how many files each pattern matched (`R-MFILE-21`), so
what was passed over stays visible. Inside a copy, a pattern passes over a link the same way.

**Turbo-Collection never writes a link.** So a link inside a copy was put there from outside, and a
run that followed it could read or write another copy's files while holding only its own
collection's lock.

**A link in a given path is refused, not followed.** Refusing it keeps the check for a copy above
whole (`R-CLI-18`) with no second check. A path through a link the operating system made is given
as the path it leads to, which the error names.

## Rejected

- **Following a link and importing what it points at.** A link can point outside the folder an
  operator named, can form a cycle, and can bring one file in under two paths.
- **Recording a link as a small file of its own.** A design not yet made, and not one that
  preserving regular files depends on.
- **Skipping a link and reporting it.** An import that ends in success is read as complete, and a
  line in a long report is easy to miss.
- **Failing on an ignored entry as well.** It would leave editing the import source by hand as the
  only cure.
- **Passing over a link inside a copy.** The rule until 2026-10-17, since a link is in no manifest
  and a backup did not copy it. Links are not supported, so one inside a copy is an error, as one at
  an import source is.
- **Following a link in a given path, and checking both that path and where it leads.** A path
  through a link would work as typed, at the price of a second check in every run, for a case the
  error already answers by naming where the path leads.

## Touches

`turbo-collection-core-spec.md`: `R-SRC-22` (an import), `R-CLI-19` (any run, inside a copy),
`R-CLI-20` (a path given to any run), and one error in the importer contract in Section 11.
`turbo-collection-spec.md`: one non-goal in Section 1.3, with its row in Section 10.
