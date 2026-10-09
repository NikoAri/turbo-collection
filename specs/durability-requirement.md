# Turbo-Collection: Durability Requirements

> **Version:** 0.1.0-draft
> **Created:** 2026-10-05
> **Status:** Draft.
> **Applies to:** every specification in this project, and the design decisions behind them.

This document states the durability requirements that every specification and design decision in
this project MUST satisfy. They exist because this is a decades-horizon preservation project: a
design that is clever today but rests on a living tool, a silent assumption, or a single copy
becomes a liability the day the tool dies, the assumption lapses, or the copy is lost. Each
requirement trades short-term convenience for long-term recoverability, and is the general rule that
a scattered set of behavioral requirements already follow one case at a time.

It stands beside [`language-requirement.md`](language-requirement.md), which governs how a document
is written, [`version-requirement.md`](version-requirement.md), which governs how one is numbered,
and [`traceability-requirement.md`](traceability-requirement.md), which governs how documents and
code trace to one another. Those three govern the form of this project's documents; this one governs
the substance of its designs.

---

## 0. Role and scope

### 0.1 Who this document binds

This document is a **design standard**. It binds the authors of specifications and the design
decisions behind them. It does not itself specify runtime behavior: the specifications it constrains
do that, and code cites those, not this document.

> **Code cites nothing in this document.** R-META-4 (`traceability-requirement.md`) restricts code
> and tests to documents whose filename ends in `-spec.md`. This filename does not, so the exclusion
> is mechanical and needs no separate prohibition here.

### 0.2 Conventions

**Requirement keywords** (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY) are used as defined in **RFC
2119**.

**Requirement IDs** in this document carry the prefix `R-DUR-*`, which no other normative document
in this project uses. Their stability is governed by
[`language-requirement.md`](language-requirement.md) R-LANG-20.

---

## 1. Purpose

Storage is cheap and reliability is not, and the failure this project most needs to survive is a
quiet one: a format no surviving tool can open, a vendor guarantee withdrawn without notice, a lone
copy lost. None of these announces itself. The requirements here remove each as a possibility at
design time rather than leaving it to be caught at recovery time, when it is too late.

They are the general form of a bias the behavioral requirements already apply case by case. Stating
it once, as a requirement every specification and decision must meet, keeps a later addition from
quietly reintroducing the fragility this project was built to avoid.

---

## 2. Terminology

Self-contained, per [`language-requirement.md`](language-requirement.md) R-LANG-5.

- **Preserved data.** The data this project exists to keep safe, as distinct from an intermediate
  work product that a run creates and is free to discard.

- **Contract.** An interface a specification defines between this project and something outside it,
  such as an origin of data, a place where data is kept, or a tool, stating what that interface
  guarantees.

- **Capability.** A specific guarantee a contract declares it can meet at a given moment, and which
  may change over time.

---

## 3. Durability requirements

**R-DUR-1.** Data this project stores MUST be plain and self-describing, readable by ordinary tools without the software that wrote it, and MUST NOT be locked inside a database, container, or archive format. A tool from the data's origin MAY be required to import data, but MUST NOT be required to read it once stored.

**R-DUR-2.** Given a choice between storing an independent, self-sufficient copy and a space-saving mechanism that makes one datum depend on another (a link, a shared block, an in-place transform), this project MUST store the copy.

**R-DUR-3.** A capability or guarantee this project relies on MUST be re-verified each time it is relied on, and MUST NOT be assumed from an earlier check.

**R-DUR-4.** Every contract this project defines MUST declare what it guarantees, and behavior MUST refuse to proceed on a silently absent guarantee rather than assume it holds.

**R-DUR-5.** Data this project stores MUST stay recoverable without the code that produced it: the data self-describing, and the specification defining its format able to travel beside the data.

**R-DUR-6.** This project MUST NOT define an operation that destroys data it preserves, or a configuration that enables one; destroying preserved data is a human act, performed with ordinary tools. A run MAY remove its own incomplete work product, which is not preserved data.

---

## 4. This document's bump test

Required of every normative document by [`version-requirement.md`](version-requirement.md) R-PUB-1.

| Level     | Test                                                                                                                                                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | An obligation stated here is withdrawn or narrowed, so that a specification or design conforming under the previous version no longer conforms; or the document language or obligation vocabulary changes (R-PUB-9). |
| **MINOR** | Additions only. Everything conforming under the previous version still conforms.                                                                                                                                     |
| **PATCH** | Prose improvement that changes no obligation.                                                                                                                                                                        |
