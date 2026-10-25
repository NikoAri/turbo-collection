# Turbo-Collection: Version Requirements for Normative Documents

> **Version:** 0.1.0-draft  
> **Created:** 2026-08-01  
> **Status:** Draft.  
> **Applies to:** every normative document in this project, including this one.

This document defines how a normative document in this project is numbered,
published, preserved, and corrected. Its goal is that a version stamp, once
written into a meta file or recorded in a log, resolves to exactly one text
forever, and that whichever rules govern any copy of data survive alongside that
data.

It is a companion of [`language-requirement.md`](language-requirement.md), which
governs how a normative document's text is written. That document governs words;
this one governs versions.

---

## 0. Role and scope

### 0.1 Who this document binds

This document is a **specification-authoring standard**. It binds every _author_
of a normative document. It does not bind Turbo-Collection's implementation.

**R-PUB-12.** Every normative document in this project MUST conform to this
document, including this document itself.

> **Why self-application.** A versioning standard that does not carry a version
> of its own invites its reader to treat it as timeless, which nothing written
> by people is. Self-application is also an ongoing test, and none is cheaper: a
> rule too burdensome to follow here is too burdensome.

> **Code cites nothing in this document.** `traceability-requirement.md`
> R-META-4 restricts code and tests to documents whose filename ends in
> `-spec.md`. This filename does not, so this exclusion is already mechanical
> and needs no separate prohibition here.

### 0.2 Conventions

**Requirement keywords** (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY) are used as
defined in **RFC 2119**.

**Requirement IDs** in this document carry `R-PUB-*` as their prefix, which no
other normative document in this project uses. Their stability is governed by
`language-requirement.md` R-LANG-20.

---

## 1. Purpose

A version stamp is a promise that a named text can be recovered. That promise is
worth nothing if a text behind its number can change, and it is worth nothing if
that number cannot be resolved at all. Both failures are silent: a meta file
stamped with a version that has since been quietly revised looks exactly like a
meta file stamped with a version that has not.

Rules here exist to make that promise keepable at low cost. They are drawn from
RFCs' discipline, a series that has kept forty years of protocol texts
resolvable: each document is immutable once published, and a later document
explicitly obsoletes or updates an earlier one, so asking "which text governed
this?" always has one answer.

---

## 2. Terminology

Self-contained, per `language-requirement.md` R-LANG-5.

- **Normative document.** A document in this project that states requirements
  with stable IDs.

- **Subject.** What a normative document is normative over.
  `turbo-collection-spec.md`'s subject is Turbo-Collection itself; an import
  source specification's is one import source; this document's is this project's
  normative documents.

- **Normative dependency.** Another normative document that a document relies on
  to determine its own obligations, declared in that depending document's header
  (R-PUB-13). A citation that only directs a reader to related or explanatory
  material is informative, not a normative dependency.

- **Meta file.** A file Turbo-Collection writes into a copy of a collection that
  describes that copy or what happened to it, including any copy of a normative
  document carried there.

- **Published.** Issued under a version number carrying no `-draft` suffix, and
  stamped into a meta file that has left whichever machine holds its collection
  (R-PUB-3). A published text is thereafter immutable in identity (R-PUB-2).

- **Draft.** A version whose number carries a `-draft` suffix. A draft states no
  obligations that survive it, changes freely, and is never archived.

- **MAJOR line.** All versions of one document that share a MAJOR number, for
  example 2.x.

- **Terminal text.** A MAJOR line's last published version, at whichever moment
  that line is superseded by its next MAJOR.

- **Conversion grade.** A standard of precision for a changes-from section:
  sufficient that anything written under its previous MAJOR line can be
  interpreted in current terms from that section alone, by mechanical rule
  rather than by narrative (R-PUB-7).

- **Document language.** A natural language that a normative document is written
  in. A binding, just as an implementation language is.

- **Obligation vocabulary.** A set of keywords by which a document states
  obligations. Today: RFC 2119's keywords.

- **Authentic text.** A single text, in one document language, that a version
  number resolves to (R-PUB-11). A translation is informative and resolves
  nothing.

---

## 3. Version numbers and publication

**R-PUB-1.** Every normative document MUST carry a semantic version,
`MAJOR.MINOR.PATCH`, and MUST state in its own text which test decides its bump.
Every such test MUST classify as **MAJOR** any change that makes previously
conforming behavior non-conforming, and any change of document language or
obligation vocabulary (R-PUB-9); as **MINOR** a change that only adds, so that
everything conforming under its previous version still conforms; and as
**PATCH** a prose improvement that changes no obligation.

**R-PUB-2.** **Version identity MUST be immutable.** A published version number
refers to exactly one text, forever: that number MUST NOT be reused for
different text, and a published text MUST NOT be edited. A correction is a new
version. Retention is deliberately weaker than identity: a published stamp MUST
resolve, at minimum, to its MAJOR line's archived terminal text (R-PUB-5);
retaining every intermediate text as a separate file is not required.

**R-PUB-3.** A version is **published** at whichever moment its stamp is first
written into a meta file that leaves a machine holding its collection. A stamp
carrying a `-draft` suffix MUST NOT be written into such a meta file. A draft
MAY change freely and is never archived.

**R-PUB-8.** If a published version is later found to be misclassified under its
own bump test (for example, labeled MINOR when it withdrew an obligation), its
correction MUST be published as a new version. That published text MUST NOT be
edited and its stamp MUST NOT be silently reinterpreted.

**R-PUB-9.** A normative document's document language, and its obligation
vocabulary, MAY change only at a MAJOR version. All normative documents in this
project MUST change document language together, at one boundary. Across such a
change: requirement IDs MUST NOT change; a changes-from section (R-PUB-7) MUST
state its previous language and its new language, and MUST map every defined
term and every obligation keyword from that old language to that new one; and a
superseded line's archived terminal text (R-PUB-5) MUST remain in its original
language, untranslated.

**R-PUB-11.** Each version of a normative document MUST have exactly one
authentic text, in exactly one document language. A translation of any version
MAY be published beside it and MUST be marked as informative. Only an authentic
text resolves a version stamp (R-PUB-2).

> **Why each document states its own bump test (R-PUB-1).** R-PUB-1 sets a floor
> that every document shares, but whatever surface a bump is measured against
> differs. `meta-file-spec.md` measures its effect on meta files, because a meta
> file already written cannot be regenerated, while code is regenerable from
> that document. An import source specification writes no meta files at all, so
> it measures whether a previously conforming import source has become
> non-conforming. Forcing one surface onto both would make one of those tests
> meaningless.

> **Why "published" is not "public" (R-PUB-3).** A draft pushed to a public
> repository has left its author's machine and is still a draft. Publication is
> when a stamp escapes into data someone will later have to interpret, because
> that is what immutability of identity (R-PUB-2) protects. Until a collection
> carries a stamp, nothing is frozen, so a document can be drafted in public.

> **Why identity and retention are split (R-PUB-2).** Immutability is two
> promises, and only one of them must be absolute. _Identity_ is RFCs'
> discipline: "written under version 1.2" is worthless if 1.2 was quietly
> revised, and precise if 1.2 can only ever mean one text. _Retention_ of every
> intermediate text is not needed, because MINOR versions are additive
> (R-PUB-1): a line's archived terminal text (R-PUB-5) is a superset of every
> intermediate version on that line, so it over-approximates which obligations
> governed an old run rather than losing them. Version control keeps exact
> intermediate texts as best effort; nothing load-bearing depends on it. This
> cost is accepted knowingly: this scheme is exactly as sound as version
> classification, which is why publication passes through Section 5's checklist
> and why a misclassification is corrected by a new version rather than a silent
> edit (R-PUB-8).

> **Why a document-language change is MAJOR (R-PUB-9).** By an
> effect-on-meta-files test alone, a faithful translation would be a PATCH:
> nothing written under that document changes meaning. It is forced up to MAJOR
> by R-PUB-2's resolution rule: intermediate versions are derivable from a
> terminal text only within one language, because translation is not a
> mechanical derivation. A language change therefore has to sit at a line
> boundary, where an outgoing language's text is archived whole. Document
> language and obligation keywords are bindings just as an implementation
> language is: today's expression of an intent, replaceable.
> `language-requirement.md`'s writing rules are what keep a future translation
> faithful (one term, one meaning, defined in-document), and that document is
> re-expressed for a new language at that boundary.

> **Why exactly one authentic text (R-PUB-11).** Its alternative, several
> equally authentic language versions, works only with a standing arbiter to
> resolve divergences between them: a court can compare all versions and rule;
> this project cannot. A language-switch MAJOR's changes-from section is
> deliberately this project's own Rosetta Stone: a single text that carries both
> languages side by side, term by term and keyword by keyword.

---

## 4. Preserving a document across its own changes

**R-PUB-4.** Every version of a normative document MUST be fully self-contained
for whichever subject it describes, and MUST describe only that subject.
Determining a current obligation MUST NOT require reading any other version of
that document, and a document MUST NOT carry a catalog of its own superseded
versions. A superseded state of a subject is defined by its own line's archived
terminal text (R-PUB-5).

**R-PUB-13.** A normative document MAY rely on another normative document to
determine its obligations. Each such reliance is a **normative dependency** and
MUST be declared in a depending document's header, naming that depended-on
document's identifier and which MAJOR line it depends on. A citation that only
directs a reader to related or explanatory material is informative, not a
normative dependency, and MUST NOT be declared as one.

**R-PUB-5.** When a MAJOR line is superseded, its terminal text MUST be archived
as a plain Markdown file in this repository's top-level `superseded/` directory,
named with that document's own filename and its full version number (for
example, `superseded/turbo-collection-spec-1.4.2.md`). `superseded/` MUST
contain every normative document's terminal text for every superseded MAJOR
line. Intermediate texts MAY live in version control as best effort; they are
not load-bearing (R-PUB-2).

**R-PUB-6.** Whoever changes a normative document's filename MUST update every
reference to that document in this project.

**R-PUB-7.** A new MAJOR line's first published version MUST contain a
changes-from section stating its differences from its previous line's terminal
text, at **conversion grade**. That section MUST name that previous line's
archived terminal text by its full version stamp.

> **Why present-tense and self-contained (R-PUB-4).** Its alternative is rules
> reconstructed by merging a chain of documents, and protocol standards'
> history, maintained as amendment chains, argues against it: a reader who must
> merge a base text with years of scattered updates will misread them, and
> consolidating back into one self-contained text gets more expensive for every
> year it is deferred. Most readers only ever need a subject as it stands now. A
> reader examining an old copy of data loads that generation's own archived text
> instead.

> **What "conversion grade" means (R-PUB-7).** A standard set by Gregorian
> calendar reform: it stated its break from Julian reckoning as a mechanical
> rule (which dates to skip, which leap years to drop), and that is what keeps
> Julian dates convertible centuries later. "The layout was improved" is
> narrative; "a path of form X under the previous line maps to form Y" is
> conversion grade. Consecutive changes-from sections are also composable, so a
> bridge across several lines can be assembled from them in turn.

> **Where texts live.** `specs/` at this repository's head is its living view;
> top-level `superseded/` holds frozen terminal texts, deliberately outside that
> living directory so that restructuring a living document never moves a frozen
> record. Intermediate versions live in version control, best effort; nothing
> load-bearing depends on them (R-PUB-2). What travels with a carried copy is
> its document's current text and version stamp, which is what
> `turbo-collection-spec.md` R-VER-8 scatters onto every copy of a collection,
> so whichever version actually governs data on real drives rides with that
> data.

> **Why a normative dependency is declared, and why against a MAJOR line
> (R-PUB-13).** A document is self-contained for its own subject (R-PUB-4),
> never for a subject another document owns, so shared mechanics may live in one
> document that others depend on: an import source specification, for example,
> can factor common mechanics into a base specification and depend on it.
> `traceability-requirement.md` R-META-1 makes documents that bind
> Turbo-Collection's implementation jointly sufficient, but sufficiency is worth
> little if a reader cannot tell which documents are in that set, so a
> dependency is declared where a reader will find it. A dependency names a MAJOR
> line, not an exact version, because a depending document is present-tense: it
> tracks that line's current text and needs no re-issue when a dependency only
> adds to it (R-PUB-1). Whether a dependency's own MAJOR change forces a MAJOR
> here is left to this document's bump test, which every change passes; a
> depending document that has not yet caught up still resolves, because a
> superseded line is archived whole (R-PUB-5), and it may stay behind with no
> time limit. Its counterpart on data's side is different in kind: a meta file
> pins an exact `{specId, version}` naming what governed specific bytes
> (`meta-file-spec.md` R-MFILE-9), a dated claim about earlier events, where
> present-tense tracking would be wrong.

---

## 5. Publication checklist

**R-PUB-10.** A version of a normative document MUST be published only by
completing this checklist, in order.

1. **Classify** a change set under that document's own bump test (R-PUB-1).
2. **Review** every added or changed passage against `language-requirement.md`
   (its R-LANG-14 gate).
3. **Sweep** that document mechanically, against every rule in
   `language-requirement.md` a checker can enforce: American spelling throughout
   (R-LANG-21); no em-dash (U+2014) anywhere and en-dash (U+2013) only inside
   numeric ranges (R-LANG-15); plain text, with diagrams as plain-text source
   (R-LANG-16).
4. **If that version starts a new MAJOR line:** archive its outgoing line's
   terminal text into `superseded/` (R-PUB-5), and write its changes-from
   section (R-PUB-7).
5. **Stamp** that document: its new version number with its date, in a form
   `turbo-collection-spec.md` R-VER-18 requires, with no `-draft` suffix
   (R-PUB-3).
6. **Publish:** whichever meta file, written with that new stamp, first leaves a
   machine holding its collection publishes that version (R-PUB-3). From then
   on, that text is immutable in identity (R-PUB-2).

> **This checklist is deliberately short, and step 1 carries its whole scheme**,
> because R-PUB-2's archive pruning is exactly as sound as whatever
> classification it rests on. Everything else is mechanical.

---

## 6. This document's bump test

Required of every normative document by R-PUB-1.

| Level     | Test                                                                                                                                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | An obligation stated in this document is withdrawn or narrowed, so that a document conforming under this document's previous version no longer conforms; or its document language or obligation vocabulary changes (R-PUB-9). |
| **MINOR** | Additions only. Every document conforming under this document's previous version still conforms.                                                                                                                              |
| **PATCH** | Prose improvement that changes no obligation.                                                                                                                                                                                 |
