# A symbolic link is not content, and a run that meets one fails

**Status:** Accepted
**Date:** 2026-10-17

Replaces the record of 2026-10-06, under which a link put into a copy by hand was passed over by a
backup, being in no manifest. A run that meets one inside a copy now fails, as an import does:
Turbo-Collection does not support links, and a run that followed one could act on another copy's
files.

Turbo-Collection takes in regular files and nothing else. Where an import would read a symbolic
link, a junction, a device, a socket or a named pipe, that import fails, adds nothing to the
collection, and names every such entry. Where any run would read one inside a copy, that run fails
and names it. No run follows one. Handling them is a non-goal for now, listed in Section 1.3 of
`turbo-collection-spec.md` with its path in Section 10.

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

## Touches

`turbo-collection-core-spec.md`: `R-SRC-22` (an import), `R-CLI-19` (any run, inside a copy), and
one error in the importer contract in Section 11. `turbo-collection-spec.md`: one non-goal in
Section 1.3, with its row in Section 10.
