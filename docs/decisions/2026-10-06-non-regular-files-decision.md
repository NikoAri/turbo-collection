# A symbolic link is not content, and an import that meets one fails

**Status:** Accepted
**Date:** 2026-10-06

Turbo-Collection takes in regular files and nothing else. Where an import would read a symbolic
link, a junction, a device, a socket or a named pipe, that import fails, adds nothing to the
collection, and names every such entry. Handling them is a non-goal for now, listed in Section 1.3
of the core specification with its path in Section 10.

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
what was passed over stays visible.

A link put into a copy by hand is in no manifest, so a backup does not copy it (`R-MIRROR-9`), and
the next in-place import of that copy fails on it and names it.

## Rejected

- **Following a link and importing what it points at.** A link can point outside the folder an
  operator named, can form a cycle, and can bring one file in under two paths.
- **Recording a link as a small file of its own.** A design not yet made, and not one that
  preserving regular files depends on.
- **Skipping a link and reporting it.** An import that ends in success is read as complete, and a
  line in a long report is easy to miss.
- **Failing on an ignored entry as well.** It would leave editing the import source by hand as the
  only cure.

## Touches

`turbo-collection-spec.md`: `R-SRC-22` added; one non-goal added to Section 1.3, with its row in
Section 10; one error added to the importer contract in Section 11.
