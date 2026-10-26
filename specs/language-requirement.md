# Turbo-Collection: Language Requirements for Normative Documents

> **Version:** 0.1.0-draft  
> **Created:** 2026-07-16  
> **Status:** Draft. **Applies to:** every normative document in this project,
> including this one.

This document defines how normative documents in this project are written. Its
goal is that a reader decades from now, human or AI, interprets them exactly as
they were meant, even after English itself has shifted.

---

## 0. Role and scope

### 0.1 Who this document binds

This document is a **specification-authoring standard**. It binds every _author_
of a normative document. It does not bind Turbo-Collection's implementation.

**R-LANG-1.** Every normative document in this project MUST conform to this
document, including this document itself.

**R-LANG-2.** Code and tests MUST NOT cite `R-LANG-*` requirement IDs. These IDs
bind documents, not Turbo-Collection's implementation. (This is a counterpart of
`traceability-requirement.md` R-META-2: code cites specification documents
only.)

> **Why R-LANG-1 includes this document.** A writing standard that violates its
> own rules invites its reader to ignore it. Self-application is also an ongoing
> test, and none is cheaper: if a rule here is too strict to follow here, it is
> too strict.

R-LANG-17 is a single exception to this scope. It binds an author of any
document in this project, normative or not, because its whole purpose is keeping
a document that binds nobody from reading as though it binds someone.

### 0.2 Conventions

**R-LANG-21.** Every normative document in this project has **American English**
as its document language, and spelling MUST be American throughout. Changing
document language is governed by `version-requirement.md` R-PUB-9, which permits
a change only at a MAJOR version.

> **Why a variant is named, and why here.** `version-requirement.md` R-PUB-11
> requires exactly one authentic text in exactly one document language, and
> "English" alone does not identify one. `-ise` and `-ize` forms of one verb are
> two spellings of a single word, which is a failure R-LANG-6 forbids for terms.
> This rule sits ahead of every other rule in this document because every
> presupposes it. An obligation keyword, a defined term, a pronoun and an
> article are all language-specific, so naming a language first is what makes
> all else in this document mean anything. Naming a variant also makes this rule
> checkable by a spell checker rather than by memory: `cspell.json` in this
> repository declares `en-US` and carries British forms in its `flagWords` list
> with their American replacements.

**Requirement keywords** (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY) are used as
defined in **RFC 2119**.

**Requirement IDs** in this document carry `R-LANG-*` as their prefix, which no
other normative document in this project uses. Their stability is governed by
R-LANG-20.

---

## 1. Purpose and threat model

This project's specifications are its durable layer: code is regenerated from
them, and data is interpreted under them. They are written in English,
specifically American English (R-LANG-21), and English is a **binding** just as
TypeScript is: today's expression of an intent, replaceable later. Natural
languages drift. A reader 400 years after Shakespeare reads him with effort; 600
years after Chaucer, with training; 1,000 years after Beowulf, not at all. This
project plans in decades, at which scale drift is real but mild, provided a text
does not lean on whichever parts of a language drift fastest.

What drifts fastest is exactly what these rules exclude from normative text:
idiom, metaphor, cultural reference, words with many senses, and meaning carried
by tone rather than by statement. What drifts slowest is what these rules
require: short declarative sentences, a small fixed vocabulary of obligation,
and terms whose meanings are defined inside each document itself rather than
borrowed from everyday language.

This approach has a name: a **controlled natural language**, a deliberately
restricted subset of a natural language. Its best-known standard is **ASD-STE100
(Simplified Technical English)**, built for aircraft maintenance manuals. This
project borrows STE's principles (one word, one meaning; short sentences; active
voice; no idiom) but not its dictionary, which is fitted to maintenance
procedures rather than to specifications. ASD-STE100 is an inspiration here, not
an obligation.

These rules also make these documents easier to translate, by a human or an AI,
into another language entirely. That is an escape hatch should English itself
ever prove a poor binding, and it is concrete, not rhetorical:
`version-requirement.md` (its R-PUB-9) permits a new MAJOR version to change
document language and obligation vocabulary outright, with every normative
document switching together. At that boundary, this document is re-expressed for
that new language in one movement: its principles (one term, one meaning; frozen
obligation vocabulary; terms defined in-document) are language-neutral, even
though its examples and keyword definitions are not.

---

## 2. Terminology

Self-contained, per R-LANG-5.

- **Normative document.** A document in this project that states requirements
  with stable IDs. Its filename states its kind: a specification ends in
  `-spec.md`, a procedure in `-procedure.md`, and an authoring or design
  standard, such as this document, in `-requirement.md`. All of them live under
  `specs/`. A normative document is not necessarily a specification: a procedure
  binds an operator, and an authoring standard binds a document author. Only a
  document whose filename ends in `-spec.md` may be cited by code
  (`traceability-requirement.md` R-META-4).

- **Normative text.** Passages of a normative document that state requirements:
  each requirement statement, introduced by its bold ID, and any sentence using
  an RFC 2119 keyword.

- **Commentary.** Explanatory passages in a normative document: rationale
  blocks, examples, section introductions. Commentary has no binding force.

- **Domain term.** A name for a project-specific concept, such as _collection_,
  _TC Copy_, or _manifest_, defined in a document's terminology section.

- **Published.** Issued under a version number without a `-draft` suffix, and
  stamped into a meta file that has left whichever machine holds its collection
  (`version-requirement.md` R-PUB-3); thereafter immutable. A draft may still
  change.

---

## 3. Language requirements

### 3.1 Obligations (`R-LANG-3`, `R-LANG-4`, `R-LANG-17`)

**R-LANG-3.** Every obligation MUST be stated with an RFC 2119 keyword. A
sentence without such a keyword carries no obligation.

**R-LANG-4.** Every obligation MUST appear in normative text. An obligation MUST
NOT be stated in commentary alone.

**R-LANG-17.** A document that is not a normative document MUST NOT state an
obligation with an RFC 2119 keyword, and MUST NOT label a passage with an
identifier in requirement-ID form. Such a document MAY describe a requirement
and cite its ID.

> **Why R-LANG-17 exists.** R-LANG-3 allows no way to state an obligation
> anywhere in this project but an RFC 2119 keyword, so a reader who meets one is
> entitled to conclude that its sentence binds someone and that code may cite
> it. A non-normative document written in that voice defeats this.
> `traceability-requirement.md` R-META-4 already solves half of this, by putting
> a document's kind in its filename so that a binding document announces itself;
> R-LANG-17 solves its other half, by keeping a document that binds nobody from
> sounding as though it binds someone.

> **Why R-LANG-4 exists.** Commentary is deliberately written in freer language
> (Section 3.5), so no part of a document is more exposed to drift and to
> misreading. An obligation that lives only in an explanatory aside is an
> obligation a future reader can miss. Commentary explains these rules;
> requirements _are_ these rules.

### 3.2 Terms (`R-LANG-5` to `R-LANG-7`, `R-LANG-23`)

**R-LANG-5.** A normative document MUST define every domain term it uses, in its
own terminology section. It MUST NOT defer a definition to another document.

**R-LANG-6.** A domain concept MUST have exactly one name throughout a document.
A defined term MUST NOT be replaced by a synonym or a paraphrase.

**R-LANG-7.** Within one document, an ordinary word SHOULD keep one meaning and
one part of speech throughout.

**R-LANG-23.** Wherever a Normative document means one of its Domain terms, that
document MUST write that term exactly as its own terminology section writes that
term, capitals included. Where that document uses one of that term's words in
its ordinary sense, that word MUST NOT take that term's capitals.

> **R-LANG-6 in practice.** `turbo-collection-spec.md` already lives by this
> rule: it says "collection" and never "library", "import source" and never a
> bare "source", and its terminology section records _why_ a rejected synonym is
> rejected. What this prevents: a future reader who meets both "import source"
> and "origin" must guess whether they are two things or one, and that guess is
> where misinterpretation starts.

> **R-LANG-7 is STE's core rule.** In ASD-STE100, "close" is only a verb; a
> writer may not also use it to mean "near". This rule is SHOULD rather than
> MUST because English resists it, and enforcing it absolutely would cost more
> than it protects. Apply it to load-bearing words first: a word like "copy"
> (noun and verb, both frequent here) deserves care.

> **Why R-LANG-23 exists.** A capital marks where a sentence leans on a
> definition, so a reader tells a defined concept from that same word in plain
> English without looking either up. R-LANG-6 gives each concept one name; this
> rule makes that name visible, and a terminology section's entry is the one
> place its form is decided.

> **Example.** `turbo-collection-spec.md` defines **Content File**, so "a TC
> Copy that lacks a Content File" writes that term as its terminology section
> does, and "a TC Copy that lacks a Content file" does not. In "a file a person
> removed", _file_ is an ordinary word and stays lowercase.

### 3.3 Sentences (`R-LANG-8` to `R-LANG-10`, `R-LANG-18`, `R-LANG-19`, `R-LANG-22`)

**R-LANG-8.** A normative statement MUST make clear which actor it binds. A
sentence SHOULD state one obligation, and SHOULD use active voice.

**R-LANG-9.** Normative text MUST NOT rely on idiom, metaphor, irony, humor, or
cultural reference to carry a requirement's meaning.

**R-LANG-10.** In normative text, a pronoun MUST have exactly one plausible
antecedent. If more than one antecedent is plausible, its noun MUST be repeated
in place of that pronoun.

**R-LANG-18.** In normative text, a definite article MUST mark only a noun that
has exactly one identifiable referent in context. A statement about any member
of a class MUST use a bare noun or a plural noun instead.

**R-LANG-19.** Prose SHOULD NOT use a definite article where a more precise word
serves: _each_, _every_, _this_, _its_, a possessive, or a referent's own name.
Prose SHOULD omit a definite article whose removal changes no meaning.

**R-LANG-22.** Prose SHOULD NOT state how many members a set has when these
documents define that set and may change it. Prose SHOULD instead name that set
and let an enumeration beside it carry its members. A number that is itself a
requirement or a fixed external fact, such as a required count of copies or a
date field's digit width, is not a count of this kind and MAY appear.

> **Why definiteness is precision, not style (R-LANG-18).** "The" promises a
> reader that exactly one referent is meant and that this reader can identify
> it. Most statements in a specification are general, so that promise is usually
> false. "The TC Copy MUST carry a manifest" invites a question: _which_ TC
> Copy? "Every TC Copy MUST carry a manifest" does not. This is a failure
> R-LANG-10 addresses for pronouns, caught one step earlier in a sentence.

> **Where this parts company with ASD-STE100.** Section 1 names STE as an
> inspiration, and STE prefers explicit articles, because a maintenance
> procedure written telegraphically becomes ambiguous about which physical part
> is meant. A specification has an opposite problem: its subjects are classes,
> not objects in front of a technician. STE is an inspiration here, not an
> obligation, and this is one place where they disagree. R-LANG-19 is SHOULD
> rather than MUST for a reason R-LANG-7 shares: English resists this rule, and
> absolute enforcement would cost more than it protects.

> **What R-LANG-9 does and does not forbid.** It does not forbid naming a
> concrete tool where that tool itself is a subject, as
> `turbo-collection-spec.md`'s bindings section does. It forbids meaning that
> only a reader who shares its writer's time and culture can decode: "the engine
> should fail fast", "hosts are cattle, not pets". Such phrases may appear in
> commentary, where a plain restatement exists in normative text beside them.

> **Why a bare count rots (R-LANG-22).** A sentence that says "the three verify
> inspections" is correct only until an inspection is added, and then it is
> wrong in a place far from whichever edit made it wrong. This is a failure
> R-LANG-11 names for time references, applied to counts: a tally anchored to a
> set's present membership rots just as "the current best tool" does. Its test
> is subtraction. If deleting a number leaves its requirement or fact intact,
> that number was only counting a list, and SHOULD go. "Three TC Copies on three
> drives" fails that test, because deleting "three" deletes its requirement, so
> that count stays.

### 3.4 Time, dates, and units (`R-LANG-11`)

**R-LANG-11.** In normative text, a calendar date MUST be absolute and in ISO
8601 form (YYYY-MM-DD), a quantity MUST carry an explicit unit, and a time
reference anchored to when it was written ("currently", "recently", "modern",
"new") MUST NOT appear.

> **What distinguishes them.** "That file's _current_ content" in
> `verify-spec.md` is anchored to when a run executes, and stays correct
> forever. "The _current_ best tool is rclone" is anchored to when it was
> written, and rots silently. That first is fine; that second belongs in a dated
> bindings section, which is exactly where `turbo-collection-spec.md` puts it.

### 3.5 Commentary and redundant encoding (`R-LANG-12`, `R-LANG-13`)

**R-LANG-12.** Commentary MAY use vivid or informal language, and MUST be
visually distinct from normative text (in this project: block quotes and plain
prose, never labeled with a requirement ID).

**R-LANG-13.** A requirement whose misinterpretation could cause data loss
SHOULD be accompanied by a concrete example illustrating its intended reading. A
requirement's design rationale, and what implementing it incorrectly would
cause, are explanatory rather than normative, and MAY be placed in explanatory
documentation rather than stated inline.

> **Why an example, and why rationale may leave its document.** A concrete
> example is a second, redundant channel for meaning: if a normative sentence
> has become ambiguous under drifted English, its example fixes which reading
> was meant. Two imperfect channels beat one polished one, a redundancy
> principle this whole project applies to data. Design rationale triangulates
> less and justifies more, so it may live in explanatory documentation instead,
> where it stays available to a reader with help without weighing down normative
> text that travels on every copy.

### 3.6 Review gate (`R-LANG-14`)

**R-LANG-14.** Before a normative document is published at a new version, every
added or changed passage MUST be reviewed against this document.

> This review fits this project's existing conformance pattern
> (`turbo-collection-spec.md` Section 13): AI-assisted, checklist-driven, and
> cheap, because these rules are few and mechanical.

---

## 4. Mechanical conventions

These apply to normative documents as MUST. Other project documents SHOULD
follow them in new text; existing non-normative text is not retroactively
rewritten.

**R-LANG-15.** Prose MUST NOT use an em-dash (U+2014). An en-dash (U+2013) MAY
appear only inside a numeric range.

**R-LANG-16.** A normative document MUST be plain text (Markdown), and diagrams
MUST be stored as plain-text source (Mermaid), never only as images.

**R-LANG-20.** Requirement IDs MUST be stable and domain-prefixed. Once a
normative document is published at a version (`version-requirement.md` R-PUB-3),
an ID in that document MUST NOT be renumbered and MUST NOT be reused; a
withdrawn requirement keeps its ID and is marked withdrawn. Whoever authors a
normative document MUST give it requirement-ID prefixes that no other normative
document in this project uses, so that a cited ID resolves to exactly one
document.

> **Why R-LANG-20 is stated once rather than in each document.** Prefix
> uniqueness is unlike every other rule here: no single document can satisfy it
> alone, since it is a claim about every other document. Stating it separately
> in each would be multiple copies of a rule that has to agree with itself, so
> it lives here and every other document cites it. This is unlike an RFC 2119
> conventions block, which is genuinely required in every normative document by
> R-LANG-5 and by `version-requirement.md` R-PUB-4.

---

## 5. This document's bump test

Required of every normative document by `version-requirement.md` R-PUB-1.

| Level     | Test                                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | A rule stated here is withdrawn or tightened, so that a document conforming under this document's previous version no longer conforms; or document language or obligation vocabulary changes (R-PUB-9). |
| **MINOR** | Additions only. Every document conforming under this document's previous version still conforms.                                                                                                        |
| **PATCH** | Prose improvement that changes no rule.                                                                                                                                                                 |
