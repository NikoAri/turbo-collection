# Turbo-Collection: Release Procedure

> **Version:** 0.1.0-draft  
> **Created:** 2026-08-08  
> **Status:** Draft. The safe-to-delete report is not built yet, so R-REL-2
> names work that does not exist.  
> **Applies to:** a human operator, before destroying any copy held outside a
> collection.  
> **Why any of this:**
> [`../../docs/decisions/2026-08-08-operator-procedure-decision.md`](../../docs/decisions/2026-08-08-operator-procedure-decision.md)

**Release** is any act that destroys a copy held outside your collection, or
ends your access to it: deleting from a cloud account, formatting a memory card,
erasing a phone, selling a device, letting a subscription lapse.

This is the only procedure here that can lose photographs.

Written under [`../language-requirement.md`](../language-requirement.md). Terms:
`turbo-collection-spec.md` Section 3. Prefix: `R-REL-*`.

---

**R-REL-1.** Confirm three copies exist on three drives, one of them off-site
(`turbo-collection-setup-procedure.md` R-SET-13).

**R-REL-2.** Run Turbo-Collection and confirm a report states that **these
specific items** were counted, verified on the working copy, and verified on at
least one other copy.

**R-REL-6.** Run the **status** report (`turbo-collection-spec.md` R-CLI-10) and
read the date of each arrival it lists. Treat an arrival as evidence of where
content was placed, never as evidence that the copy still exists; R-REL-1 and
R-REL-2 are what establish that, and this report only tells you where to look.

**R-REL-3.** Stop on any discrepancy. Import again rather than accepting a
shortfall.

**R-REL-4.** Release only what that report covers.

**R-REL-5.** Do not release anything while fewer than three copies exist, or
while the off-site copy is not off-site.

---

## Bump test

Required by `version-requirement.md` R-PUB-1.

| Level     | Test                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| **MAJOR** | An obligation here is withdrawn or narrowed, so an operator conforming before no longer conforms. |
| **MINOR** | Additions only.                                                                                   |
| **PATCH** | Prose that changes no obligation.                                                                 |
