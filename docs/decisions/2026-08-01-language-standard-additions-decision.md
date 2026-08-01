# Four rules added to the authoring standard: language, articles, and identifiers

**Status:** Accepted
**Date:** 2026-08-01

Four rules were added to [`language-requirement.md`](../../specs/language-requirement.md).

**R-LANG-21, in Section 0.2: the document language is American English.** Placed ahead of every other
rule because every other rule presupposes it. Obligation keywords, defined terms, pronouns and
articles are all language-specific, so naming the language first is what makes the rest of that
document mean anything. `version-requirement.md` R-PUB-11 requires exactly one authentic text in
exactly one document language, and "English" alone does not identify one.

**R-LANG-18 and R-LANG-19, on definite articles.** A definite article marks only a noun with exactly
one identifiable referent, and prose omits an article whose removal changes no meaning. The first is
binding, the second advisory. This is a precision rule rather than a matter of taste: "the" promises
a reader a specific referent, and most statements in a specification are general, so the promise is
usually false. It is the failure R-LANG-10 already catches for pronouns, caught one step earlier in
the sentence.

**R-LANG-20, on requirement identifiers.** Stability after publication and prefix uniqueness, stated
once. Three documents had each restated them. Unlike the RFC 2119 conventions block, that
duplication is not required: prefix uniqueness is a claim about *other* documents, so no single
document can satisfy it alone.

All four are enforceable rather than aspirational. `cspell.json` declares `en-US` and carries the
British forms in `flagWords` with their American replacements, and the publication checklist's
mechanical sweep now names every rule a checker can enforce rather than only the em-dash rule.

## Rejected

- **R-LANG-21 in Section 4, with the other mechanically checkable rules.** This was the first
  placement and it was overturned. Section 4 groups rules by *how they are checked*; the language
  declaration belongs where it is placed by *what depends on it*, and everything depends on it.
- **R-LANG-19 as binding rather than advisory.** English resists an absolute rule here, and enforcing
  it everywhere would cost more than it protects. Same reasoning R-LANG-7 already records for
  one-word-one-meaning.
- **Following ASD-STE100 on articles.** Section 1 names it as an inspiration and it pushes the
  opposite way, preferring explicit articles, because a maintenance procedure written telegraphically
  is ambiguous about which physical part is meant. A specification has the opposite problem, its
  subjects being classes rather than objects on a bench. Recorded in commentary so a later reader
  cannot cite the inspiration against the rule.
- **A spell-checker directive inside the normative text.** The commentary for R-LANG-21 needed to
  illustrate the forbidden spelling, which the checker then flagged. Rewording to describe the
  `-ise` and `-ize` forms without writing either was preferred over embedding tooling instructions in
  a document meant to outlive the tooling.
- **Restating identifier rules in each document**, which is what existed before R-LANG-20.

## Touches

Added: R-LANG-18, R-LANG-19, R-LANG-20, R-LANG-21. Section 0.1 gained a sentence recording that
R-LANG-17 reaches beyond normative documents; Section 0.2 stopped restating identifier stability;
Section 1 now names the language variant where it discusses language as a binding.

`turbo-collection-spec.md` Section 0.2 declares American English directly rather than by reference,
because R-VER-8 scatters copies of it onto every target while `language-requirement.md` does not
travel with them. `version-requirement.md` R-PUB-10 step 3 now names every checker-enforceable rule.
`cspell.json` gained the `flagWords` list.
