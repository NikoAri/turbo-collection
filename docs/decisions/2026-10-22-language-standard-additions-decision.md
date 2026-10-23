# Four rules added to the authoring standard: language, articles, and identifiers

**Status:** Accepted **Date:** 2026-10-22

**Replaces the record of 2026-08-01.** R-LANG-19 then asked only that prose omit
a definite article whose removal changes no meaning; it now asks first for a
more precise word in its place.

Four rules were added to
[`language-requirement.md`](../../specs/language-requirement.md).

**R-LANG-21, in Section 0.2: the document language is American English.** Placed
ahead of every other rule because every other rule presupposes it. Obligation
keywords, defined terms, pronouns and articles are all language-specific, so
naming the language first is what makes the rest of that document mean anything.
`version-requirement.md` R-PUB-11 requires exactly one authentic text in exactly
one document language, and "English" alone does not identify one.

**R-LANG-18 and R-LANG-19, on definite articles.** A definite article marks only
a noun with exactly one identifiable referent. Prose uses no definite article
where a more precise word serves (_each_, _every_, _this_, _its_, a possessive,
or a referent's own name), and omits one whose removal changes no meaning. The
first is binding, the second advisory. This is a precision rule rather than a
matter of taste: "the" promises a reader a specific referent, and most
statements in a specification are general, so the promise is usually false. It
is the failure R-LANG-10 already catches for pronouns, caught one step earlier
in the sentence. Comments in code follow the same practice, stated for them in
[`comments-best-practice.md`](../typescript-best-practice/comments-best-practice.md),
because R-LANG-2 keeps code from citing these rules.

**R-LANG-20, on requirement identifiers.** Stability after publication and
prefix uniqueness, stated once. Three documents had each restated them. Unlike
the RFC 2119 conventions block, that duplication is not required: prefix
uniqueness is a claim about _other_ documents, so no single document can satisfy
it alone.

All four are enforceable rather than aspirational. `cspell.json` declares
`en-US` and carries the British forms in `flagWords` with their American
replacements, and the publication checklist's mechanical sweep now names every
rule a checker can enforce rather than only the em-dash rule.

## Rejected

- **R-LANG-21 in Section 4, with the other mechanically checkable rules.** This
  was the first placement and it was overturned. Section 4 groups rules by _how
  they are checked_; the language declaration belongs where it is placed by
  _what depends on it_, and everything depends on it.
- **R-LANG-19 as binding rather than advisory.** English resists an absolute
  rule here, and enforcing it everywhere would cost more than it protects. Same
  reasoning R-LANG-7 already records for one-word-one-meaning.
- **R-LANG-19 as omission alone**, its wording until 2026-10-22. Nearly every
  "the" before a singular noun passes the test "does removal change meaning",
  because deleting it leaves headline English, so the rule let almost every
  article through. Text written under it used "the" as often as ordinary English
  does. A word that says which referent is meant is what the rule wants, and
  naming that word is what makes the rule bite.
- **Following ASD-STE100 on articles.** Section 1 names it as an inspiration and
  it pushes the opposite way, preferring explicit articles, because a
  maintenance procedure written telegraphically is ambiguous about which
  physical part is meant. A specification has the opposite problem, its subjects
  being classes rather than objects on a bench. Recorded in commentary so a
  later reader cannot cite the inspiration against the rule.
- **A spell-checker directive inside the normative text.** The commentary for
  R-LANG-21 needed to illustrate the forbidden spelling, which the checker then
  flagged. Rewording to describe the `-ise` and `-ize` forms without writing
  either was preferred over embedding tooling instructions in a document meant
  to outlive the tooling.
- **Restating identifier rules in each document**, which is what existed before
  R-LANG-20.

## Touches

Added: R-LANG-18, R-LANG-19, R-LANG-20, R-LANG-21. Section 0.1 gained a sentence
recording that R-LANG-17 reaches beyond normative documents; Section 0.2 stopped
restating identifier stability; Section 1 now names the language variant where
it discusses language as a binding. On 2026-10-22, R-LANG-19 gained its first
sentence, and `comments-best-practice.md` gained its Articles section.

`turbo-collection-spec.md` Section 0.2 declares American English directly rather
than by reference, because R-VER-8 scatters copies of it onto every drive while
`language-requirement.md` does not travel with them. `version-requirement.md`
R-PUB-10 step 3 now names every checker-enforceable rule. `cspell.json` gained
the `flagWords` list.
