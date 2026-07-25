# Turbo-Collection: Source Specification, Apple iCloud Photos

> **Version:** 0.1.0-draft
> **Created:** 2026-07-25
> **Status:** Stub. No requirements stated yet.
> **Procedure:** [`turbo-collection-icloud-procedure.md`](turbo-collection-icloud-procedure.md)

This document is normative over the **Apple photo surface**: what Turbo-Collection may assume
about getting original bytes out of iCloud Photos, and what it must verify. It covers every
route into that surface, because one party (Apple) controls all of them and can change any of
them without notice.

Requirement ID prefix: **not yet assigned.** It MUST NOT be `R-SRC-*`, which
[`turbo-collection-spec.md`](../../turbo-collection-spec.md) already owns for the Source port.

---

## 0. Role and scope

Placeholder. Must state: this document binds the **tool**, never Apple. Every claim here is an
observation with a date, not a guarantee anyone has given.

## 1. Terminology

Placeholder. Per `language-requirement.md` R-LANG-5, this section must be self-contained and
must not defer any definition to another document.

## 2. Routes

Placeholder for the route table. One row per known way of getting bytes out of the surface,
each with:

- **Conformant:** does it supply original bytes, and under what preconditions
- **Viable:** measured throughput, with date, vendor version, host, item count, and elapsed time
- **Dependency:** none, or a vendor tool required to acquire, or a vendor tool required to read
  the result (disqualifying)
- **Authoritative:** whether this is the route the project uses, and why

Known routes to be documented: Mac Photos `Export Unmodified Original`, iCloud for Windows,
iCloud web, iPhone direct over USB.

## 3. Preconditions

Placeholder. The phone-side and account-side settings that must hold before any route delivers
originals, and which of them the tool can verify rather than assume.

## 4. Output facts

Placeholder. Verified properties of what each route produces, dated. Includes the collision
suffix behavior, structure flattening, and pairing of stills with motion clips.

## 5. Validity and re-validation

Placeholder. What was verified, against which vendor version, on what date, and when each claim
expires.

## 6. Change ledger

Placeholder.
