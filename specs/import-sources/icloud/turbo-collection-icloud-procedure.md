# Turbo-Collection: Import Procedure, Apple iCloud Photos

> **Version:** 0.1.0-draft
> **Created:** 2026-07-25
> **Status:** Stub. No steps written yet.
> **Satisfies:** [`turbo-collection-icloud-spec.md`](turbo-collection-icloud-spec.md)
> **Verified against:** nothing yet

This document is the **human execution path** for importing photos from the iCloud import source.
It binds the operator, not the implementation, and no code cites it. It is the iCloud-specific
counterpart of [`../../procedures/turbo-collection-import-procedure.md`](../../procedures/turbo-collection-import-procedure.md),
which states the steps common to every import source.

It is a peer of the specification, not an appendix to it. The specification states what must be
true of the result; this document states one known way to achieve that. Each depends on the
other: the procedure exists to satisfy the specification, and the specification's recorded facts
and measurements were produced by executing this procedure.

---

## 0. How to write steps in this document

Each step states **what it must achieve** first, and **how it is currently achieved** second:

> The export must produce unmodified originals. Today: File > Export > Export Unmodified
> Original.

A bare click path cannot migrate. When a step becomes automatable, the requirement is already
articulated and moves into the specification unchanged. Expect traffic in both directions: a
vendor removing an interface moves an automated step back out.

## 1. Preconditions

Placeholder. Account and device settings that must be confirmed before starting, and how to
confirm each.

## 2. Steps

Placeholder.

## 3. Verification

Placeholder. How the operator confirms the import is complete and intact before treating it
as done.

## 4. Validity

Placeholder. Which vendor version and host this procedure was last executed against, on what
date, and when it should be re-checked.

## 5. Change ledger

Placeholder.
