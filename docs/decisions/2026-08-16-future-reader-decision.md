# A future reader has help, so conveniences are not pre-built

**Status:** Accepted
**Date:** 2026-08-16

A person who finds this data, at any point across the decades it is meant to survive, is assumed to
have access to a capable AI assistant and to be able to ask it to act on what they find. So *readable
without Turbo-Collection* means readable by someone holding plain, self-describing data and an
assistant, rather than by someone holding one particular command-line program.

Conventional tooling is the **safety net, not the main mode of operation**. Standard utilities, format
parsers and ordinary programming skill remain a complete fallback, and no decision may close that path
off. The distinction that decides each case: **the fallback must stay possible, and need not be made
convenient.**

The fallback's real condition is weaker than it sounds. It does not require the reader to program,
only that the skill still exists and can be bought. Someone who inherits a drive and cannot program
hires someone who can, and the data is plain enough that the hire needs no familiarity with this
project.

## What this licenses, and what it must never license

**Licensed: removing a pre-computed convenience.** A second copy of a manifest in some tool's format
earns nothing, because anyone able to obtain that conversion is equally able to obtain the
verification directly and skip the intermediate file. This is what withdrew `R-INT-9`.

**Not licensed: anything about self-description.** An assistant can act only on data that states what
it is. Every artifact still carries its format version, names its algorithm, and states the layout
convention that placed it. This principle makes those fields *more* important, not less. It moves work
to the reader's assistant; it must never move work to the reader's guesswork.

## Why adopting it is safe

Being wrong costs inconvenience rather than data. A reader with no help at all still holds plain
files, checksums in documented JSON, and, where carried, the specification beside them. That is the
strongest position available to anyone, so the assumption failing takes away nothing that existed.

It is also self-testing. The annual re-validation ritual in `design-record.md` Section 10 already asks
a then-current AI to re-check this project's dated assumptions. If that ritual can be run, this
assumption holds; if nobody can run it, its failure has been discovered by the only means that would
report it.

## Rejected

- **Keeping the pre-built convenience anyway, on the grounds that it is cheap.** It is cheap, but a
  second file that can disagree with the first is a maintenance obligation and a source of
  contradiction, and the earlier argument for it assumed a reader who holds a checksum utility yet
  cannot obtain a format conversion. That reader is not real.
- **A URL to the project repository as the thing that explains the data.** A link depends on one
  company, one account name and one product's URL scheme surviving together, which is the class of
  dependency this project rejects everywhere else. A pointer in `README.md` is a convenience today and
  must never be load-bearing.

## Touches

`design-record.md` Section 2 gained *a future reader has help*, and the neighboring principle changed
from "AI is an accelerant, not a load-bearing part" to *AI-optional to operate, AI-assumed to recover*,
which it flatly contradicted. `turbo-collection-spec.md` Section 12.3 gained the assumption as a dated
entry. `R-INT-9` withdrawn as the first application.
