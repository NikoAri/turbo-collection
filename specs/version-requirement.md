# Turbo-Collection: Version Requirements for Normative Documents

> **Version:** 0.1.0-draft
> **Created:** 2026-08-01
> **Status:** Draft.
> **Applies to:** every normative document in this project, including this one.

This document defines how a normative document in this project is numbered, published, preserved,
and corrected. Its goal is that a version stamp, once written into an artifact or recorded in a log,
resolves to exactly one text forever, and that the rules governing any copy of the data survive
alongside the data.

It is the companion of [`language-requirement.md`](language-requirement.md), which governs how the
text of a normative document is written. That document governs the words; this one governs the
version.

---

## 0. Role and scope

### 0.1 Who this document binds

This document is a **specification-authoring standard**. It binds the _authors_ of normative
documents. It does not bind the implementation.

| ID           | Requirement                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| **R-PUB-12** | Every normative document in this project MUST conform to this document, including this document itself. |

> **Why self-application.** A versioning standard that does not carry a version of its own invites
> the reader to treat it as timeless, which nothing written by people is. Self-application is also
> the cheapest ongoing test: a rule too burdensome to follow here is too burdensome.

> **Code cites nothing in this document.** `turbo-collection-spec.md` R-META-4 restricts code and
> tests to documents whose filename ends in `-spec.md`. This filename does not, so the exclusion is
> already mechanical and needs no separate prohibition here.

### 0.2 Conventions

**Requirement keywords** (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY) are used as defined in **RFC
2119**.

**Requirement IDs** in this document carry the prefix `R-PUB-*`, which no other normative document
in this project uses. Their stability is governed by `language-requirement.md` R-LANG-20.

---

## 1. Purpose

A version stamp is a promise that a named text can be recovered. The promise is worth nothing if the
text behind the number can change, and it is worth nothing if the number cannot be resolved at all.
Both failures are silent: an artifact stamped with a version that has since been quietly revised
looks exactly like an artifact stamped with a version that has not.

The rules here exist to make that promise keepable at low cost. They are drawn from the discipline
of the RFC series, which has kept forty years of protocol texts resolvable: each document is
immutable once published, and a later document explicitly obsoletes or updates an earlier one, so
the question "which text governed this?" always has one answer.

---

## 2. Terminology

Self-contained, per `language-requirement.md` R-LANG-5.

- **Normative document.** A document in this project that states requirements with stable IDs.

- **Subject.** What a normative document is normative over. For `turbo-collection-spec.md` the
  subject is Turbo-Collection itself; for an import source specification it is one import source;
  for this document it is the normative documents of this project.

- **Published.** Issued under a version number carrying no `-draft` suffix, and stamped into
  something that has left the machine on which it was written (R-PUB-3). A published text is
  thereafter immutable in identity (R-PUB-2).

- **Draft.** A version whose number carries the `-draft` suffix. A draft states no obligations that
  survive it, changes freely, and is never archived.

- **MAJOR line.** All versions of one document that share a MAJOR number, for example the 2.x line.

- **Terminal text.** The last published version of a MAJOR line, at the moment that line is
  superseded by the next MAJOR.

- **Change ledger.** The per-version, per-requirement record of a document's changes, kept inside
  that document (R-PUB-6).

- **Erratum.** A ledger entry declaring that a published version was misclassified, made instead of
  editing the published text (R-PUB-8).

- **Conversion grade.** A standard of precision for a changes-from section: sufficient that anything
  written under the previous MAJOR line can be interpreted in current terms from that section alone,
  by mechanical rule rather than by narrative (R-PUB-7).

- **Document language.** The natural language a normative document is written in. A binding, in the
  same sense that an implementation language is.

- **Obligation vocabulary.** The set of keywords by which the document states obligations. Today:
  the RFC 2119 keyword set.

- **Authentic text.** The one text, in one document language, that a version number resolves to
  (R-PUB-11). A translation is informative and resolves nothing.

---

## 3. Version numbers and publication

| ID           | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-PUB-1**  | Every normative document MUST carry a semantic version, `MAJOR.MINOR.PATCH`, and MUST state in its own text the test that decides its bump. Every such test MUST classify as **MAJOR** any change that makes previously conforming behavior non-conforming, and any change of document language or obligation vocabulary (R-PUB-9); as **MINOR** a change that only adds, so that everything conforming under the previous version still conforms; and as **PATCH** a prose improvement that changes no obligation.                                                                         |
| **R-PUB-2**  | **Version identity MUST be immutable.** A published version number refers to exactly one text, forever: the number MUST NOT be reused for different text, and a published text MUST NOT be edited. A correction is a new version. Retention is deliberately weaker than identity: a published stamp MUST resolve, at minimum, to the archived terminal text of its MAJOR line (R-PUB-5) together with the change ledger (R-PUB-6); retaining every intermediate text as a separate file is not required.                                                                                    |
| **R-PUB-3**  | A version is **published** at the first moment its stamp is written into something that leaves the machine on which the document was written. A stamp carrying the `-draft` suffix MUST NOT be written into such a thing. A draft MAY change freely and is never archived.                                                                                                                                                                                                                                                                                                                  |
| **R-PUB-8**  | If a published version is later found to be misclassified under its own bump test (for example, labeled MINOR when it withdrew an obligation), the correction MUST be an **erratum**: a new ledger entry (R-PUB-6) declaring the misclassification. The published text MUST NOT be edited and its stamp MUST NOT be silently reinterpreted.                                                                                                                                                                                                                                                 |
| **R-PUB-9**  | The document language of a normative document, and its obligation vocabulary, MAY change only at a MAJOR version. All normative documents in this project MUST change document language together, at the same boundary. Across such a change: requirement IDs MUST NOT change; the changes-from section (R-PUB-7) MUST state the previous language and the new language, and MUST map every defined term and every obligation keyword from the old language to the new; and the archived terminal text of the superseded line (R-PUB-5) MUST remain in its original language, untranslated. |
| **R-PUB-11** | Each version of a normative document MUST have exactly one authentic text, in exactly one document language. A translation of any version MAY be published beside it and MUST be marked as informative. Only the authentic text resolves a version stamp (R-PUB-2).                                                                                                                                                                                                                                                                                                                         |

> **Why each document states its own bump test (R-PUB-1).** The rule above sets a floor that every
> document shares, but the surface a bump is measured against differs. `turbo-collection-spec.md`
> measures the effect on artifacts, because artifacts are regenerable from nothing while code is
> regenerable from the document. An import source specification writes no artifacts at all, so it
> measures whether a previously conforming import source has become non-conforming. Forcing one
> surface onto both would make one of the two tests meaningless.

> **Why identity and retention are split (R-PUB-2).** Immutability is two promises, and only one of
> them must be absolute. _Identity_ is the RFC discipline: "written under version 1.2" is worthless
> if 1.2 was quietly revised, and precise if 1.2 can only ever mean one text. _Retention_ of every
> intermediate text is not needed, because MINOR versions are additive (R-PUB-1): the text of any
> intermediate version is derivable from its line's terminal text minus the additions the ledger
> records after it. What a reader of an old log actually needs to reconstruct is _which obligations
> governed that run_, and the ledger answers exactly that. Version control keeps the exact
> intermediate texts as best effort; nothing load-bearing depends on it. The cost is accepted
> knowingly: this scheme is exactly as sound as version classification, which is why publication
> passes through the checklist in Section 5 and why misclassification has an honesty rule (R-PUB-8).

> **Why a document-language change is MAJOR (R-PUB-9).** By an effect-on-artifacts test alone, a
> faithful translation would be a PATCH: nothing written under the document changes meaning. It is
> forced up to MAJOR by R-PUB-2's resolution rule: intermediate versions are derivable from a
> terminal text only within one language, because translation is not a mechanical derivation. A
> language change therefore has to sit at a line boundary, where the outgoing language's text is
> archived whole. The document language and the obligation keywords are bindings in the same sense
> an implementation language is: today's expression of the intent, replaceable. The writing rules in
> `language-requirement.md` are what keep a future translation faithful (one term, one meaning,
> defined in-document), and that document is re-expressed for the new language at the same boundary.

> **Why exactly one authentic text (R-PUB-11).** The alternative, several equally authentic language
> versions, works only with a standing arbiter to resolve divergences between them: a court can
> compare all versions and rule; this project cannot. The changes-from section of a language-switch
> MAJOR is deliberately this project's own Rosetta Stone: the one artifact that carries both
> languages side by side, term by term and keyword by keyword.

---

## 4. Preserving a document across its own changes

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-PUB-4** | Every version of a normative document MUST be fully self-contained for the subject it describes, and MUST describe only that subject. Determining a current obligation MUST NOT require reading any other version of that document, and a document MUST NOT carry a catalog of its own superseded versions. A superseded state of a subject is defined by the archived terminal text of its own line (R-PUB-5).                                                                                               |
| **R-PUB-5** | When a MAJOR line is superseded, its terminal text MUST be archived as a plain Markdown file in the repository's top-level `superseded/` directory, named with the document's own filename and its full version number (for example, `superseded/turbo-collection-spec-1.4.2.md`). The `superseded/` directory MUST contain the terminal text of every superseded MAJOR line of every normative document. Intermediate texts MAY live in version control as best effort; they are not load-bearing (R-PUB-2). |
| **R-PUB-6** | Every normative document MUST carry a change ledger, inside the document, holding one entry per published version: the version stamp; one line per requirement ID added, amended, or withdrawn, stating what changed and why; and one line per normative document whose filename changed, stating the previous filename, the new filename, and the version at which the change took effect. The author of a filename change MUST also update every reference to that document in this project.                |
| **R-PUB-7** | The first published version of a new MAJOR line MUST contain a changes-from section stating its differences from the terminal text of the previous line, at **conversion grade**. The section MUST name the archived terminal text of the previous line by its full version stamp.                                                                                                                                                                                                                            |

> **Why present-tense and self-contained (R-PUB-4).** The alternative is rules reconstructed by
> merging a chain of documents, and the history of protocol standards maintained as amendment chains
> is the argument against it: a reader who must merge a base text with years of scattered updates
> will misread them, and consolidating back into one self-contained text gets more expensive the
> longer it is deferred. Most readers only ever need the current subject. A reader examining an old
> copy of the data loads that generation's own archived text instead.

> **What "conversion grade" means (R-PUB-7).** The standard the Gregorian calendar reform set: it
> stated its break from the Julian calendar as a mechanical rule (which dates to skip, which leap
> years to drop), and that is what keeps Julian dates convertible centuries later. "The layout was
> improved" is narrative; "a path of form X under the previous line maps to form Y" is conversion
> grade. Consecutive changes-from sections are also composable, so a bridge across several lines can
> be assembled from them in turn.

> **Where the texts live.** `specs/` at the head of the repository is the living view; top-level
> `superseded/` holds the frozen terminal texts, deliberately outside the living directory so that
> restructuring a living document never moves a frozen record. The change ledger lives _inside_ each
> document (R-PUB-6) because it is the only in-tree record of intermediate versions, so it must
> travel with every copy of the document. For `turbo-collection-spec.md` this matters most of all,
> because its R-VER-8 scatters stamped copies onto every target, which makes the versions actually
> governing data in the wild the most redundantly stored of all.

---

## 5. The publication checklist

| ID           | Requirement                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| **R-PUB-10** | A version of a normative document MUST be published only by completing the following checklist, in order. |

1. **Classify** the change set under the document's own bump test (R-PUB-1), and draft one ledger
   line per added, amended, or withdrawn requirement ID.
2. **Review** every added or changed passage against `language-requirement.md` (its R-LANG-14 gate).
3. **Sweep** the document mechanically, against every rule in `language-requirement.md` a checker can
   enforce: American spelling throughout (R-LANG-21); no em-dash (U+2014) anywhere and en-dash
   (U+2013) only inside numeric ranges (R-LANG-15); plain text, with diagrams as plain-text source
   (R-LANG-16).
4. **If the version starts a new MAJOR line:** archive the outgoing line's terminal text into
   `superseded/` (R-PUB-5), and write the changes-from section (R-PUB-7). For
   `turbo-collection-spec.md`, if the new line also begins a new format generation, confirm that the
   R-VER-15 migration exists and passes its boundary verification, before anything is stamped.
5. **Enter the ledger lines** into the document's change ledger (R-PUB-6).
6. **Stamp** the document: the new version number with its date, in the form required by
   `turbo-collection-spec.md` R-VER-18, with no `-draft` suffix (R-PUB-3).
7. **Publish:** the first thing written with the new stamp that leaves the machine publishes the
   version (R-PUB-3). From that moment, the text is immutable in identity (R-PUB-2).

> **The checklist is deliberately short, and two steps carry the whole scheme.** Step 1, because the
> archive pruning of R-PUB-2 is exactly as sound as the classification it rests on; and step 4,
> because the migration promise of R-VER-15 is exactly as sound as its boundary verification.
> Everything else is mechanical.

---

## 6. This document's bump test

Required of every normative document by R-PUB-1.

| Level     | Test                                                                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | An obligation stated in this document is withdrawn or narrowed, so that a document conforming under the previous version no longer conforms; or the document language or obligation vocabulary changes (R-PUB-9). |
| **MINOR** | Additions only. Every document conforming under the previous version still conforms.                                                                                                                              |
| **PATCH** | Prose improvement that changes no obligation.                                                                                                                                                                     |

---

## 7. Change ledger

Required by R-PUB-6. No version has been published yet (R-PUB-3), so the entry below is informal; a
draft carries no obligations and receives no per-ID ledger entries.

| Version     | Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.0-draft | 2026-08-01 | First draft. R-PUB-1 to R-PUB-12. Eleven requirements moved here from `turbo-collection-spec.md` Section 9 and renumbered, where they had bound the authors of documents rather than the implementation: R-VER-1 became R-PUB-1, R-VER-2 became R-PUB-2, R-VER-10 became R-PUB-3, R-VER-11 became R-PUB-4, R-VER-12 became R-PUB-5, R-VER-13 became R-PUB-6, R-VER-14 became R-PUB-7, R-VER-17 became R-PUB-8, R-VER-19 became R-PUB-9, R-VER-20 became R-PUB-10, R-VER-21 became R-PUB-11. R-PUB-12 is new, and states the scope this document had no way to state while it was a section of another document. Three of the moved requirements were generalized, because they were written to describe one document and now govern several: R-PUB-1 states a floor and requires each document to state its own bump test, leaving the artifact-driven test in `turbo-collection-spec.md` R-VER-1; R-PUB-4 speaks of a document's subject rather than of Turbo-Collection; R-PUB-6 requires a ledger without fixing its section number. Rationale: [`../docs/decisions/2026-08-01-version-requirement-split-decision.md`](../docs/decisions/2026-08-01-version-requirement-split-decision.md). |
| 0.1.0-draft | 2026-08-16 | The **Subject** term reworded: a normative document about acquisition is now normative over one **acquisition route** rather than over one vendor surface, and the R-PUB-1 commentary calls such a document a route specification. Follows `turbo-collection-spec.md`, which withdrew the vendor surface level on this date and renamed `specs/sources/` to `specs/acquisition-routes/`. No requirement added, amended, or withdrawn.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 0.1.0-draft | 2026-08-22 | The **Subject** term and the R-PUB-1 commentary reworded: a normative document about getting bytes in is normative over one **import source** rather than over one acquisition route, and such a document is now called an import source specification. Follows `turbo-collection-spec.md`, which retired the term _acquisition route_ on this date and renamed `specs/acquisition-routes/` to `specs/import-sources/`. No requirement added, amended, or withdrawn. |
