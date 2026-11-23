# Turbo-Collection: Import Source Specification, iCloud

> **Version:** 0.1.0-draft  
> **Created:** 2026-07-25  
> **Status:** Stub. No requirements stated yet.  
> **Procedure:** [`turbo-collection-icloud-procedure.md`](turbo-collection-icloud-procedure.md)  
> **Layout:**
> [`photo-path-layout-spec.md`](../../layouts/photo-path-layout-spec.md)

This document is normative over **iCloud** as an import source: what
Turbo-Collection may assume about getting original bytes out of it, and what it
must verify. Apple controls this import source and can change it without notice,
so every claim here is a dated observation with an expiry, never a promise
anyone has given.

Requirement ID prefix: **not yet assigned.** It MUST NOT be `R-SRC-*`, which
[`import-spec.md`](../../import-spec.md) already owns for import.

---

## 0. Role and scope

Placeholder. Must state: this document binds **Turbo-Collection**, never Apple.
Every claim here is an observation with a date, not a guarantee anyone has
given.

## 1. Terminology

Placeholder. Per `language-requirement.md` R-LANG-5, this section must be
self-contained and must not defer any definition to another document.

## 2. Ways in, and whether they are one import source or several

Several ways of getting bytes out of iCloud are known: Mac Photos
`Export Unmodified Original`, iCloud for Windows, iCloud web, and iPhone direct
over USB.

**Whether they are one import source or several is undecided, and filling this
document decides it.** They are treated as one here only because nothing is
written yet. Two ways that deliver different bytes cannot share one fidelity
claim, and if that is what filling this document finds, this document splits and
each way becomes its own directory under `specs/importers/`.

Placeholder for a table of properties. One row per way in, each with:

- **Conformant:** does it supply original bytes, and under what preconditions
- **Viable:** measured throughput, with date, vendor version, host, item count,
  and elapsed time
- **Dependency:** none, or a vendor tool required to import, or a vendor tool
  required to read what it delivers (disqualifying)
- **Authoritative:** whether this project uses this way in, and why

## 3. Preconditions

Placeholder. Phone-side and account-side settings that must hold before
originals are delivered, and which of them Turbo-Collection can verify rather
than assume.

## 4. Output facts

Placeholder. Verified properties of what is produced, dated. Includes collision
suffix behavior, structure flattening, and pairing of stills with motion clips.

## 5. Validity and re-validation

Placeholder. What was verified, against which vendor version, on what date, and
when each claim expires.

## 6. Layout and supplied path

This import source names
[`photo-path-layout-spec.md`](../../layouts/photo-path-layout-spec.md) as every
import's primary layout, as [`import-spec.md`](../../import-spec.md) R-SRC-15
requires each import source specification to state one. An item that layout is
not able to place goes to supplied-path layout (R-SRC-20).

Placeholder for a supplied path as R-SRC-21 requires: which root it is relative
to, and whether that path stays unchanged when one item is exported twice. A
path that changes between exports risks a duplicate of an item supplied-path
layout placed, so this must be verified, not assumed.
