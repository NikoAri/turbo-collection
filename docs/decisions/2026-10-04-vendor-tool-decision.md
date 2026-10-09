# A vendor's tool may perform an import, and is never needed to read what is stored

**Status:** Accepted
**Date:** 2026-10-04

A tool from a vendor may be required to get content out of an import source. No such tool may be
required to read a file once it is stored. Where an import source hands content over only inside a
proprietary container, an importer unpacks it to plain files during the import, and refuses where it
cannot (`R-SRC-5`). `R-DUR-1` states the same rule for the whole project.

**This is the custodian rule applied to tools.** A vendor may be an import source and never a
custodian of what it supplied, and a tool that has to be present before stored files can be read is
a custodian. The layers of that rule, a service, a tool and hardware, are set out in
[`design-record.md`](../design-record.md) Section 2.

**The rule already followed from what the specifications said**: stored data is plain, and an
importer supplies plain files. It was written down because a rule that has to be derived is one a
reader can miss.

## Rejected

- **A requirement of its own.** The obligation was already entailed, so a new requirement would have
  been a second statement of one rule. It was folded into the two statements that entail it.

## Touches

`turbo-collection-spec.md`: `R-SRC-5` gained "as plain files", the pair of sentences on a vendor
tool, and the duty to unpack a proprietary container or refuse. `durability-requirement.md`:
`R-DUR-1` carries the same pair for the whole project.
