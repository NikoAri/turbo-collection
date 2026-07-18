# Turbo-Collection: Language Requirements for Normative Documents

> **Version:** 0.1.0-draft
> **Created:** 2026-07-16
> **Status:** Draft.
> **Applies to:** every normative document in this project, including this one.

This document defines how normative documents in this project are written. Its goal is that a
reader decades from now, human or AI, interprets them exactly as they were meant, even after the
English language itself has shifted.

---

## 0. Role and scope

### 0.1 Who this document binds

This document is a **specification-authoring standard**. It binds the *authors* of normative
documents. It does not bind the implementation.

| ID | Requirement |
|---|---|
| **R-LANG-1** | Every normative document in this project MUST conform to this document, including this document itself. |
| **R-LANG-2** | Code and tests MUST NOT cite `R-LANG-*` requirement IDs. These IDs bind documents, not the implementation. (This is the counterpart of `spec.md` R-META-2: code cites specification documents only.) |

> **Why R-LANG-1 includes this document.** A writing standard that violates its own rules invites
> the reader to ignore it. Self-application is also the cheapest ongoing test: if a rule here is
> too strict to follow here, it is too strict.

### 0.2 Conventions

**Requirement keywords** (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY) are used as defined in
**RFC 2119**.

**Requirement IDs** (`R-LANG-1`, `R-LANG-2`, ...) are stable. Once this document is published at
a version, an ID MUST NOT be renumbered and MUST NOT be reused. A withdrawn requirement keeps
its ID and is marked withdrawn.

---

## 1. Purpose and threat model

The specification is the durable layer of this project: code is regenerated from it, and data is
interpreted under it. The specification is written in English, and English is a **binding** in
the same sense that TypeScript is: today's expression of the intent, replaceable later. Natural
languages drift. A reader 400 years after Shakespeare reads him with effort; 600 years after
Chaucer, with training; 1,000 years after Beowulf, not at all. This project plans in decades, at
which scale drift is real but mild, provided the text does not lean on the parts of a language
that drift fastest.

What drifts fastest is exactly what these rules exclude from normative text: idiom, metaphor,
cultural reference, words with many senses, and meaning carried by tone rather than by
statement. What drifts slowest is what these rules require: short declarative sentences, a
small fixed vocabulary of obligation, and terms whose meanings are defined inside the document
itself rather than borrowed from the ambient language.

This approach has a name: a **controlled natural language**, a deliberately restricted subset of
a natural language. The best-known standard is **ASD-STE100 (Simplified Technical English)**,
built for aircraft maintenance manuals. This project borrows STE's principles (one word, one
meaning; short sentences; active voice; no idiom) but not its dictionary, which is fitted to
maintenance procedures rather than to specifications. ASD-STE100 is an inspiration here, not an
obligation.

These rules also make the documents easier to translate, by a human or an AI, into another
language entirely. That is the escape hatch if English itself is ever the wrong binding, and it is
concrete, not rhetorical: `spec.md` (its R-VER-19) permits a new MAJOR version to change the
document language and the obligation vocabulary outright, with every normative document switching
together. At that boundary, this document is re-expressed for the new language in the same
movement: its principles (one term, one meaning; frozen obligation vocabulary; terms defined
in-document) are language-neutral, even though its examples and keyword definitions are not.

---

## 2. Terminology

Self-contained, per R-LANG-5.

- **Normative document.** A document in this project that states requirements with stable IDs.
  As of 2026-07-17: `spec/spec.md`, the planned `spec/spec-sources.md`, and this document.

- **Normative text.** The passages of a normative document that state requirements: requirement
  tables, and any sentence using an RFC 2119 keyword.

- **Commentary.** Explanatory passages in a normative document: rationale blocks, examples,
  section introductions. Commentary has no binding force.

- **Domain term.** A name for a project-specific concept, such as *collection*, *target*, or
  *manifest*, defined in a document's terminology section.

- **Published.** Issued under a version number without a `-draft` suffix, and thereafter
  immutable. A draft may still change.

---

## 3. Language requirements

### 3.1 Obligations (`R-LANG-3`, `R-LANG-4`)

| ID | Requirement |
|---|---|
| **R-LANG-3** | Every obligation MUST be stated with an RFC 2119 keyword. A sentence without such a keyword carries no obligation. |
| **R-LANG-4** | Every obligation MUST appear in normative text. Commentary MUST NOT be the only place an obligation is stated. |

> **Why R-LANG-4 exists.** Commentary is deliberately written in freer language (Section 3.5),
> so it is the part of the document most exposed to drift and to misreading. An obligation that
> lives only in an explanatory aside is an obligation a future reader can miss. Commentary
> explains the rules; the tables *are* the rules.

### 3.2 Terms (`R-LANG-5` to `R-LANG-7`)

| ID | Requirement |
|---|---|
| **R-LANG-5** | A normative document MUST define every domain term it uses, in its own terminology section. It MUST NOT defer a definition to another document. |
| **R-LANG-6** | A domain concept MUST have exactly one name throughout a document. A defined term MUST NOT be replaced by a synonym or a paraphrase. |
| **R-LANG-7** | Within one document, an ordinary word SHOULD keep one meaning and one part of speech throughout. |

> **R-LANG-6 in practice.** `spec.md` already lives by this rule: it says "collection" and never
> "library", "target" and never "destination", and its terminology section records *why* the
> rejected synonyms are rejected. The failure this prevents: a future reader who meets both
> "target" and "destination" must guess whether they are two things or one, and the guess is
> where misinterpretation starts.

> **R-LANG-7 is the core STE rule.** In ASD-STE100, "close" is only a verb; a writer may not
> also use it to mean "near". The rule is SHOULD rather than MUST because English resists it,
> and enforcing it absolutely would cost more than it protects. Apply it to load-bearing words
> first: a word like "copy" (noun and verb, both frequent here) deserves care.

### 3.3 Sentences (`R-LANG-8` to `R-LANG-10`)

| ID | Requirement |
|---|---|
| **R-LANG-8** | A normative statement MUST make clear which actor it binds. A sentence SHOULD state one obligation, and SHOULD use the active voice. |
| **R-LANG-9** | Normative text MUST NOT rely on idiom, metaphor, irony, humor, or cultural reference to carry a requirement's meaning. |
| **R-LANG-10** | In normative text, a pronoun MUST have exactly one plausible antecedent. If more than one antecedent is plausible, the noun MUST be repeated in place of the pronoun. |

> **What R-LANG-9 does and does not forbid.** It does not forbid naming a concrete tool where
> the tool itself is the subject, as the bindings section of `spec.md` does. It forbids meaning
> that only a reader who shares the writer's time and culture can decode: "the engine should
> fail fast", "targets are cattle, not pets". Such phrases may appear in commentary, where a
> plain restatement exists in the normative text beside them.

### 3.4 Time, dates, and units (`R-LANG-11`)

| ID | Requirement |
|---|---|
| **R-LANG-11** | In normative text, a calendar date MUST be absolute and in ISO 8601 form (YYYY-MM-DD), a quantity MUST carry an explicit unit, and a time reference anchored to the moment of writing ("currently", "recently", "modern", "new") MUST NOT appear. |

> **The distinction that matters.** "Every *current* collection file" in `spec.md` is anchored
> to the moment a run executes, and stays correct forever. "The *current* best tool is rclone"
> is anchored to the moment of writing, and rots silently. The first is fine; the second
> belongs in a dated bindings or assumptions section, which is exactly where `spec.md` puts it.

### 3.5 Commentary and redundant encoding (`R-LANG-12`, `R-LANG-13`)

| ID | Requirement |
|---|---|
| **R-LANG-12** | Commentary MAY use vivid or informal language, and MUST be visually distinct from normative text (in this project: block quotes and prose, never requirement tables). |
| **R-LANG-13** | A requirement whose misinterpretation could cause data loss MUST be accompanied by commentary stating its rationale, a concrete example, or both. |

> **Why looseness is permitted at all.** Commentary is the second, redundant channel for
> meaning. A future reader triangulates: if the normative sentence has become ambiguous under
> drifted English, the rationale and example pin down which reading was meant, and the reverse
> also holds. Two imperfect channels beat one polished one. This is the same redundancy
> principle the rest of the project applies to data.

### 3.6 Review gate (`R-LANG-14`)

| ID | Requirement |
|---|---|
| **R-LANG-14** | Before a normative document is published at a new version, every added or changed passage MUST be reviewed against this document. |

> The review fits the project's existing conformance pattern (`spec.md` §13): AI-assisted,
> checklist-driven, and cheap, because these rules are few and mechanical.

---

## 4. Mechanical conventions

These apply to normative documents as MUST. Other project documents SHOULD follow them in new
text; existing non-normative text is not retroactively rewritten.

| ID | Requirement |
|---|---|
| **R-LANG-15** | Prose MUST NOT use the em-dash character (U+2014). An en-dash (U+2013) MAY appear only inside a numeric range. |
| **R-LANG-16** | A normative document MUST be plain text (Markdown), and diagrams MUST be stored as plain-text source (Mermaid), never only as images. |

---

## 5. Change log

Versions are immutable once published. A correction is a new version, never an edit.

| Version | Date | Change |
|---|---|---|
| 0.1.0-draft | 2026-07-16 | First draft: R-LANG-1 to R-LANG-16. |
