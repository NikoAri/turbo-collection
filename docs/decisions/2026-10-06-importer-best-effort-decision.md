# An importer makes a best effort, and the core guarantees nothing about what an import source delivers

**Status:** Accepted
**Date:** 2026-10-06

Turbo-Collection's guarantee starts when an importer hands a file over. From that moment the bytes
are preserved exactly (`R-COL-2`), checksummed, and verified. Before it, an importer makes a **best
effort** to supply each file unaltered, and to take the unaltered version where an import source
offers more than one (`R-SRC-5`). Nothing more is promised.

The specification used to promise more: that an importer supplies original bytes; that an import
source unable to do so is declared, and refused by default (`R-SRC-6`); that an import source
beginning to degrade is caught at the next import (`R-SRC-11`); and that an import source whose
degradation cannot be detected is refused outright (`R-SRC-19`). All four rested on knowledge the
core does not have. Whether a vendor delivered its true original is visible only as far as that
vendor exposes evidence. For a folder of files, a camera card, or files already inside a copy,
nothing exists to check against, so `R-SRC-19` read literally refused them all.

What a particular import source delivers, and how an operator gets the best version out of it,
belongs in that import source's own specification and procedure, where the evidence for it is.

**The cost, accepted knowingly.** Nothing in the core stops an import that quietly took lesser
versions of files, and deleting from an import source afterward cannot be undone. That safeguard is
now an importer's care and an operator's procedure, not a guarantee.

## Rejected

- **Keeping the honesty and detectability requirements.** They promised what cannot be known in
  general.
- **Narrowing `R-SRC-5` to a duty an importer can keep, and keeping the rest.** First
  recommendation. It left three requirements about the import source standing.
- **A core requirement that every import source specification state what its source delivers, and on
  what evidence.** Second recommendation, declined: fidelity is up to the importer.

## Touches

`turbo-collection-spec.md`: `R-SRC-5` restated as a best effort; `R-SRC-6`, `R-SRC-11` and
`R-SRC-19` removed; the importer contract loses its capabilities; `R-CFG-4`, `R-LOG-1`, `R-CLI-9`
and `R-TGT-12` no longer mention a degraded import or an importer's capabilities.
`meta-file-spec.md`: the error example. Both file-based import source stubs: their fidelity
sections.
