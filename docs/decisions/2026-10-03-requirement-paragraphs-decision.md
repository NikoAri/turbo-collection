# A requirement is a paragraph led by its ID, not a table row

**Status:** Accepted
**Date:** 2026-10-03

Every requirement in a normative document is a paragraph that opens with its ID in bold, as in
`**R-XXX-N.**`, followed by the requirement. It sits under whichever section heading already groups
it. Commentary stays what it was, a block quote or plain prose.

**A table suits short columnar data, and a requirement is neither.** One requirement ran to about
three hundred words in one cell on one line of source. That form gave a reader a line that could not
be scanned without wrapping, alignment padding that went ragged at every edit, and a diff showing a
whole line changed when one word had. What a table did well, a column of IDs to scan, survives as
the bold ID at the head of each paragraph.

**The table had been the mark of normative text, so the authoring standard changed with it.**
`language-requirement.md` defined normative text as requirement tables, and required commentary to
stay out of them. Obligation keywords already did most of that work, since a sentence carrying one
binds wherever it sits, so the form was renamed and no new distinction was invented. Normative text
is each requirement statement introduced by its bold ID, together with any sentence using an
obligation keyword, and commentary is never labeled with a requirement ID (`R-LANG-12`).

**A requirement that lists fields states them as a list**, under one keyword stem such as
`Its fields MUST be:`, so that the keyword governs every entry. Data that really is tabular, such as
a bump test, stays a table.

## Rejected

- **A heading per requirement.** It would give each requirement an anchor of its own, and it would
  bury every section outline under its requirements, over a hundred of them in the core
  specification. These documents are read in an editor, where a link to a file and a line already
  lands on a requirement.

## Touches

`language-requirement.md`: the definition of _Normative text_, `R-LANG-12`, and the commentary on
`R-LANG-4` reworded. Every normative document: requirement tables converted to paragraphs, with no
requirement's text changed. `meta-file-spec.md`: the field lists of `R-MFILE-9`, `R-MFILE-14`,
`R-MFILE-16` and `R-MFILE-26` became bullet lists.
