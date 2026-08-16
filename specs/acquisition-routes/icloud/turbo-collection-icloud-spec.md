# Turbo-Collection: Acquisition Route Specification, iCloud

> **Version:** 0.1.0-draft
> **Created:** 2026-07-25
> **Status:** Stub. No requirements stated yet.
> **Procedure:** [`turbo-collection-icloud-procedure.md`](turbo-collection-icloud-procedure.md)

This document is normative over the **iCloud acquisition route**: what Turbo-Collection may assume
about getting original bytes out of it, and what it must verify. Apple controls this route and can
change it without notice, so every claim here is a dated observation with an expiry, never a promise
anyone has given.

Requirement ID prefix: **not yet assigned.** It MUST NOT be `R-SRC-*`, which
[`turbo-collection-spec.md`](../../turbo-collection-spec.md) already owns for the Source port.

---

## 0. Role and scope

Placeholder. Must state: this document binds the **tool**, never Apple. Every claim here is an
observation with a date, not a guarantee anyone has given.

## 1. Terminology

Placeholder. Per `language-requirement.md` R-LANG-5, this section must be self-contained and
must not defer any definition to another document.

## 2. Ways in, and whether they are one route or several

Four ways of getting bytes out of iCloud are known: Mac Photos `Export Unmodified Original`, iCloud
for Windows, iCloud web, and iPhone direct over USB.

**Whether they are one acquisition route or several is undecided, and filling this document decides
it.** They are treated as one here only because nothing is written yet. Two ways that deliver
different bytes cannot share one fidelity claim, and if that is what filling this document finds,
this document splits and each way becomes its own directory under `specs/acquisition-routes/`.

Placeholder for the properties table. One row per way in, each with:

- **Conformant:** does it supply original bytes, and under what preconditions
- **Viable:** measured throughput, with date, vendor version, host, item count, and elapsed time
- **Dependency:** none, or a vendor tool required to acquire, or a vendor tool required to read
  the result (disqualifying)
- **Authoritative:** whether this is the way the project uses, and why

## 3. Preconditions

Placeholder. The phone-side and account-side settings that must hold before originals are
delivered, and which of them the tool can verify rather than assume.

## 4. Output facts

Placeholder. Verified properties of what is produced, dated. Includes the collision
suffix behavior, structure flattening, and pairing of stills with motion clips.

## 5. Validity and re-validation

Placeholder. What was verified, against which vendor version, on what date, and when each claim
expires.

## 6. Change ledger

Placeholder. This document was created 2026-07-25 as a surface specification, covering every way
into "the Apple photo surface" in one document because one party controls all of them. It was
reframed 2026-08-16 when the surface level was dropped from the project's vocabulary in favor of a
single category, the acquisition route. Nothing normative changed, because nothing normative had
been written.
