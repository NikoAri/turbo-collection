# Obligation keywords appear only in normative documents

**Status:** Accepted
**Date:** 2026-08-01

> This record discusses RFC 2119 keywords, so it names them. Naming a keyword is not using one.

A document that is not normative does not state obligations with RFC 2119 keywords, and does not
label paragraphs with identifiers shaped like requirement IDs. It may still describe a rule and cite
it, as in "Turbo-Collection copies every file absent at a target (R-MIRROR-1)". This lands as a new
requirement in `language-requirement.md`, whose section 0.1 gains one sentence extending that single
rule to documents which are not normative.

R-LANG-3 makes RFC 2119 keywords the only way an obligation is stated anywhere here, so a reader
meeting one is entitled to conclude that a sentence binds someone. `docs/plan.md` section 8 uses them
anyway and numbers paragraphs R-1 to R-10, and two of those contradict the specification. Only a
directory separates binding from non-binding, which is the weakness R-META-4 fixed for normative
documents and left standing on the other side.

Cleanup is already scheduled: of fourteen keyword occurrences in `plan.md`, ten form that R-1 to R-10
block, which is being cut anyway, and four are mentions that stay. Root `README.md` has none. So this
costs nothing today and exists to prevent recurrence, most obviously in `docs/decisions/`.

## Rejected

- **Leave keywords in place and let a directory classify.** A file separated from its directory keeps
  its name and loses its path.
- **Mark `plan.md` section 8 historical rather than cutting it.** A superseded requirement list
  sitting beside a live one invites exactly the confusion this removes.
- **Forbid keyword mentions too.** Too strict. A glossary entry defining RFC 2119 has to name them.

## Touches

One requirement added to `language-requirement.md`, plus a scope sentence in its section 0.1.
Identifier assigned when text lands.
