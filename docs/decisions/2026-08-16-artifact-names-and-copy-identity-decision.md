# Artifacts are named on disk, and every copy declares what it is

**Status:** Accepted
**Date:** 2026-08-16

Every artifact now has a filename, which nothing had stated before:

| File | Where | Requirement |
|---|---|---|
| `README.md` | root of every copy | `R-TGT-10` |
| `turbo-collection-config.json` | root of every copy | `R-CFG-2` |
| `manifest.json` | every directory holding content | `R-INT-1` |
| `receipt.json` | every directory holding content or a refusal | `R-REC-3` |

Root files are self-describing, because a stranger who finds one drive and nothing else has no
context. Files inside the tree are terse, because the root already explains them and repeating a
prefix in every directory for decades buys nothing.

**Every copy declares its own identity** (`R-CFG-6`): its `role`, either `collection` or `target`, and
the `copy` name that receipts refer to it by. Turbo-Collection reads both from the copy itself.

## Why a copy names itself

A receipt records the copy an arrival reached, and a receipt is permanent, so that name must still
resolve decades later after every drive behind it has been replaced. Three tempting sources all fail:
a **volume label** is mutable by anyone in seconds and leaves no trace when changed; a **mount path**
is a drive letter on one operating system and a `/Volumes` entry on another and changes between
sessions; a **command-line argument** puts a permanent record at the mercy of a typo.

Reading the name off the copy buys a safety property none of them offer: connecting the wrong drive
becomes detectable rather than silent. `R-TGT-6` already made a target declare that it is a plain
tree, so this extends an existing pattern rather than inventing one. It also makes the tool
indifferent to where a drive is mounted, which is what lets a backup run on a borrowed computer.

## Rejected

- **A separate marker file at the collection root** (`R-VER-7`, withdrawn). It recorded the
  specification version, which every manifest already carries, and the layout convention, which
  nothing did. Rather than keep a file for half a fact, `layoutConvention` joined `specVersion` in
  `R-INT-4`, so every directory states what governed it and a separated directory stays interpretable.
- **Merging the marker into configuration.** `R-CFG-3` fails a run outright on invalid configuration,
  so a typo in a setting would make the collection unidentifiable as well as unusable. What data *is*
  must not be hostage to whether settings parse. Their mutability is also opposite: configuration
  churns, a marker should not.
- **A separate recovery note on targets.** `R-TGT-10` previously required one, which meant two files
  addressing the same confused stranger under two names. `README.md` does that job with the most
  widely understood filename in computing.
- **Naming a copy after its role by convention alone**, with no `role` field. Inferring role from the
  literal string `collection` is the guessing `R-CFG-4` forbids, and it would prevent the collection
  ever being named anything else.
- **`exclusions` in configuration.** Named in `R-CFG-1` but never specified: no requirement said what
  an exclusion matches, whether it is a glob, or whether it applies at import or at mirror. Dropped
  rather than guessed at, and addable when something actually needs excluding.

## Touches

`R-CFG-6` added. `R-CFG-1` and `R-CFG-2` amended. `R-VER-7` withdrawn, its ID retired. `R-VER-8`
split, so recording the governing version stays a MUST and carrying the text becomes a SHOULD.
`R-TGT-10` reworked to `README.md` on every copy, written where absent, never overwritten, and binding
nothing. `R-INT-1` and `R-INT-4` amended. `R-VER-3`'s artifact list corrected. Section 14's
artifact-naming question removed.
