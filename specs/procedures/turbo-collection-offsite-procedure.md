# Turbo-Collection: Off-site Procedure

> **Version:** 0.1.0-draft  
> **Created:** 2026-08-08  
> **Status:** Draft. An off-site run is not built yet, so R-OFF-2 names work
> that does not exist. R-OFF-6 was withdrawn on 2026-08-10 and its number is not
> reused.  
> **Applies to:** a human operator, every time your off-site copy is brought up
> to date.  
> **Why any of this:**
> [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md)

Bringing your off-site copy up to date. **Off-site** means in a different
building from every other copy; your off-site copy is one of three copies
`turbo-collection-setup-procedure.md` names.

**Your off-site copy never travels.** You take your working copy to it, and back
up there.

Written under [`../language-requirement.md`](../language-requirement.md). Terms:
`turbo-collection-spec.md` Section 3. Prefix: `R-OFF-*`.

Do these in listed order. Requirement numbers are stable rather than sequential,
because R-OFF-6 was withdrawn and its number is not reused.

---

**R-OFF-7.** Before traveling, back up your working copy with your **home
copy**, and confirm that backup reported no error.

**R-OFF-1.** Take your **working copy** to whichever building keeps your
off-site copy. Do not bring your off-site copy to your working copy.

**R-OFF-2.** Run Turbo-Collection's backup there. Any computer will do,
including one you do not own.

**R-OFF-3.** Read that backup's report.

**R-OFF-4.** Leave your off-site copy **off-site**. Bring home only your working
copy.

**R-OFF-5.** Keep at least one copy off-site at all times.

---

> **Why your off-site copy stays and your working copy travels.** Bringing your
> off-site copy home to be updated puts all three copies in one building for as
> long as it is there, and one fire during that window destroys every copy. That
> is exactly what off-site storage exists to prevent, reintroduced periodically
> by a routine meant to maintain it. Taking your working copy to your off-site
> copy never puts more than two copies under one roof.

> **Why R-OFF-7 comes first.** With your working copy traveling, that copy is
> exposed to a car, a bag, and a journey. Backing up with your home copy before
> leaving means a lost or dropped working copy costs a drive and no photographs,
> because a current copy stayed at home. Without it, a trip is taken with your
> only current copy in hand.

> **Why any computer will do.** Nothing your collection depends on lives on a
> host computer. Configuration travels with your collection and each drive
> states what it is (`turbo-collection-core-spec.md` R-CFG-5,
> `meta-file-spec.md` R-MFILE-19), everything that bears on whether material at
> an import source can be deleted is written into receipts on your drives rather
> than into a log on a computer (R-MFILE-13), and no database is kept anywhere
> (Section 2). So a computer at your off-site building is equipment you borrow,
> not part of Turbo-Collection, and it need not run whichever operating system
> your own computer runs (R-CLI-15). One caution, which is not a rule here: a
> borrowed computer is a machine whose state you do not control, and plugging
> your working copy into it is a judgment you make about that machine.

## Not yet stated

How often to run this, and how often your off-site copy is read and verified.
That second one is what establishes it is still intact, and it replaced a media
rule, since withdrawn, rather than merely outliving it.

## Bump test

Required by `version-requirement.md` R-PUB-1.

| Level     | Test                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| **MAJOR** | An obligation here is withdrawn or narrowed, so an operator conforming before no longer conforms. |
| **MINOR** | Additions only.                                                                                   |
| **PATCH** | Prose that changes no obligation.                                                                 |
