# Turbo-Collection: Import Procedure, Apple iCloud Photos

> **Version:** 0.1.0-draft  
> **Created:** 2026-07-25  
> **Status:** Stub. No steps written yet.  
> **Satisfies:** [`turbo-collection-icloud-spec.md`](turbo-collection-icloud-spec.md)

This document is a **human execution path** for importing photos from iCloud, an
import source. It binds a human operator, not Turbo-Collection's implementation,
and no code cites it. It is iCloud's counterpart of
[`../../procedures/turbo-collection-import-procedure.md`](../../procedures/turbo-collection-import-procedure.md),
which states steps common to every import source.

It is a peer of
[`turbo-collection-icloud-spec.md`](turbo-collection-icloud-spec.md), not an
appendix to it. That specification states what must be true of a result; this
document states one known way to achieve that. They depend on each other: this
procedure exists to satisfy that specification, and facts and measurements that
specification records were produced by executing this procedure.

---

## 0. How to write steps in this document

Each step states **what it must achieve** first, and **how it is currently
achieved** second:

> An export must produce unmodified originals. Today: File > Export > Export
> Unmodified Original.

A bare click path cannot migrate. When a step becomes automatable, its
requirement is already articulated and moves into that specification unchanged.
Expect traffic in both directions: a vendor removing an interface moves an
automated step back out.

## 1. Preconditions

Placeholder. Account and device settings that must be confirmed before starting,
and how to confirm each.

## 2. Steps

Placeholder.

## 3. Verification

Placeholder. How an operator confirms an import is complete and intact before
treating it as done.

## 4. Validity

Placeholder. Which vendor version and host this procedure was last executed
against, on what date, and when it should be re-checked.
