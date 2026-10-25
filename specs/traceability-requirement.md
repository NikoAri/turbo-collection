# Turbo-Collection: Traceability Requirements for Normative Documents

> **Version:** 0.1.0-draft  
> **Created:** 2026-10-05  
> **Status:** Draft. **Applies to:** every normative document in this project,
> and its code and tests, including this document itself.

This document defines how this project's normative documents, their
requirements, and its code trace to one another: which document binds what, that
documents binding Turbo-Collection's implementation are jointly sufficient, that
code cites only those documents, and that every behavior resolves to a
requirement. Its goal is that any behavior can be followed back to whichever
requirement authorizes it, and any requirement to a single document that owns
it.

It is a specification-authoring standard, beside
[`language-requirement.md`](language-requirement.md), which governs how a
normative document is written, and
[`version-requirement.md`](version-requirement.md), which governs how one is
numbered and published. Those two govern each document's words and version; this
one governs how documents and code refer to one another.

---

## 0. Role and scope

### 0.1 Who this document binds

This document is a **specification-authoring standard**. It binds every author
of a normative document. It does not bind Turbo-Collection's Implementation.

> **Code cites nothing in this document.** R-META-4 restricts code and tests to
> documents whose filename ends in `-spec.md`. This filename does not, so this
> exclusion is mechanical and needs no separate prohibition here.

### 0.2 Conventions

**Requirement keywords** (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY) are used as
defined in **RFC 2119**.

**Requirement IDs** in this document carry `R-META-*` as their prefix, which no
other normative document in this project uses. Their stability is governed by
[`language-requirement.md`](language-requirement.md) R-LANG-20.

---

## 1. Purpose

A specification is worth only as much as its chain to running code. If a
behavior cannot be traced to a requirement, no one can say whether it is
intended; if a requirement cannot be traced to a single document, a citation
resolves to nothing; and if documents binding Turbo-Collection's Implementation
are not jointly sufficient, an implementer is left to invent a missing fact.
Each failure is silent, and each defeats a specification's whole purpose.

Rules here keep that chain sound in both directions: each document declares by
its filename what it binds, documents that bind form a complete set, code cites
only that set, and every behavior resolves to a requirement within it.

---

## 2. Terminology

Self-contained, per [`language-requirement.md`](language-requirement.md)
R-LANG-5.

- **Normative document.** A document in this project that states requirements
  with stable IDs.

- **Subject.** What a normative document is normative over. This document's
  subject is how this project's normative documents, their requirements, and its
  code cite and trace to one another.

- **Specification document.** A normative document that binds Turbo-Collection's
  Implementation, whose filename ends in `-spec.md` (R-META-4). Code and tests
  cite these and no others (R-META-2).

- **Implementation.** Code and tests that realize Turbo-Collection, and whatever
  behavior they produce.

---

## 3. Normative documents as a set

**R-META-1.** Normative documents that bind Turbo-Collection's Implementation
(R-META-4) MUST, taken together, be sufficient to implement and test
Turbo-Collection, with no document outside that set in hand.

- Turbo-Collection specification MUST state how Turbo-Collection behaves,
  wherever that does not depend on a particular import source.
  `meta-file-spec.md` states what every meta file contains;
- Layout Specification states where content files go;
- Import Source Specification states only what its own import source adds.

If an implementer needs a fact none of them states, that is a defect, and its
fix is to add that fact to whichever one owns its subject.

**R-META-4.** A normative document that binds Turbo-Collection's Implementation
MUST have a filename ending in `-spec.md`. A normative document that binds a
human operator MUST have a filename ending in `-procedure.md`. Code and tests
MUST cite documents whose filename ends in `-spec.md` only.

---

## 4. Code traces to requirements

**R-META-2.** Code and tests MUST cite requirement IDs from a specification
document only. They MUST NOT cite `docs/design-record.md`, design discussions,
or conversation history.

**R-META-3.** Any behavior in code that is not traceable to a requirement is
either a specification gap (add a requirement) or unauthorized behavior (remove
that code). There is no third option.

---

## 5. This document's bump test

Required of every normative document by
[`version-requirement.md`](version-requirement.md) R-PUB-1.

| Level     | Test                                                                                                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | An obligation stated here is withdrawn or narrowed, so that code or a document conforming under this document's previous version no longer conforms; or its document language or obligation vocabulary changes (R-PUB-9). |
| **MINOR** | Additions only. Everything conforming under this document's previous version still conforms.                                                                                                                              |
| **PATCH** | Prose improvement that changes no obligation.                                                                                                                                                                             |
