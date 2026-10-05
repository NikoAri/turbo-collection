# Turbo-Collection: Traceability Requirements for Normative Documents

> **Version:** 0.1.0-draft
> **Created:** 2026-10-05
> **Status:** Draft.
> **Applies to:** every normative document in this project, and the code and tests, including this document itself.

This document defines how the normative documents of this project, their requirements, and its code
trace to one another: which document binds what, that documents binding the implementation are
jointly sufficient, that code cites only those documents, and that every behavior resolves to a
requirement. Its goal is that any behavior can be followed back to the requirement that authorizes
it, and any requirement to the single document that owns it.

It is a specification-authoring standard, beside
[`language-requirement.md`](language-requirement.md), which governs how a normative document is
written, and [`version-requirement.md`](version-requirement.md), which governs how one is numbered
and published. Those two govern the words and the version of each document; this one governs how
documents and code refer to one another.

---

## 0. Role and scope

### 0.1 Who this document binds

This document is a **specification-authoring standard**. It binds the authors of normative
documents. It does not bind the implementation.

> **Code cites nothing in this document.** R-META-4 restricts code and tests to documents whose
> filename ends in `-spec.md`. This filename does not, so the exclusion is mechanical and needs no
> separate prohibition here.

### 0.2 Conventions

**Requirement keywords** (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY) are used as defined in **RFC
2119**.

**Requirement IDs** in this document carry the prefix `R-META-*`, which no other normative document
in this project uses. Their stability is governed by
[`language-requirement.md`](language-requirement.md) R-LANG-20.

---

## 1. Purpose

A specification is worth only as much as the chain connecting it to running code. If a behavior
cannot be traced to a requirement, no one can say whether it is intended; if a requirement cannot be
traced to a single document, a citation resolves to nothing; and if documents binding the
implementation are not jointly sufficient, an implementer is left to invent a missing fact. Each
failure is silent, and each defeats the purpose of writing a specification at all.

Rules here keep that chain sound in both directions: each document declares by its filename what it
binds, the binding set is complete, code cites only that set, and every behavior resolves to a
requirement within it.

---

## 2. Terminology

Self-contained, per [`language-requirement.md`](language-requirement.md) R-LANG-5.

- **Normative document.** A document in this project that states requirements with stable IDs.

- **Subject.** What a normative document is normative over. For this document the subject is how the
  normative documents of this project, their requirements, and its code cite and trace to one
  another.

- **Specification document.** A normative document that binds the implementation, whose filename
  ends in `-spec.md` (R-META-4). Code and tests cite these and no others (R-META-2).

- **The implementation.** The code and tests that realize Turbo-Collection, and the behavior they
  produce.

---

## 3. The normative document set

**R-META-1.** Normative documents that bind the implementation (R-META-4) MUST, taken together, be sufficient to implement and test Turbo-Collection, with no document outside that set in hand.

- Turbo-Collection specification MUST state how Turbo-Collection behaves, wherever that does not depend on a particular import source. `meta-file-spec.md` states what every meta file contains;
- Layout Specification states where content files go;
- Import Source Specification states only what its own import source adds.

If an implementer needs a fact none of them states, that is a defect, and the fix is to add that fact to whichever one owns its subject.

**R-META-4.** A normative document that binds the implementation MUST have a filename ending in `-spec.md`. A normative document that binds the human operator MUST have a filename ending in `-procedure.md`. Code and tests MUST cite documents whose filename ends in `-spec.md` only.

---

## 4. Code traces to requirements

**R-META-2.** Code and tests MUST cite requirement IDs from a specification document only. They MUST NOT cite the design record, design discussions, or conversation history.

**R-META-3.** Any behavior in the code that is not traceable to a requirement is either a specification gap (add the requirement) or unauthorized behavior (remove the code). There is no third option.

---

## 5. This document's bump test

Required of every normative document by [`version-requirement.md`](version-requirement.md) R-PUB-1.

| Level     | Test                                                                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | An obligation stated here is withdrawn or narrowed, so that code or a document conforming under the previous version no longer conforms; or the document language or obligation vocabulary changes (R-PUB-9). |
| **MINOR** | Additions only. Everything conforming under the previous version still conforms.                                                                                                                              |
| **PATCH** | Prose improvement that changes no obligation.                                                                                                                                                                 |
