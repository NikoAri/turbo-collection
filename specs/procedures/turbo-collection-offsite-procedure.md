# Turbo-Collection: Off-site Procedure

> **Version:** 0.1.0-draft  
> **Created:** 2026-08-08  
> **Status:** Draft. The off-site run is not built yet, so R-OFF-2 names work
> that does not exist. R-OFF-6 was withdrawn on 2026-08-10 and its number is not
> reused.  
> **Applies to:** a human operator, every time the off-site copy is brought up
> to date.  
> **Why any of this:**
> [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md)

Bringing the off-site copy up to date. **Off-site** means in a different
building from every other copy; the off-site copy is one of the three copies
named in `turbo-collection-setup-procedure.md`.

**The off-site copy never travels.** You take the working copy to it, and back
up there.

Written under [`../language-requirement.md`](../language-requirement.md). Terms:
`turbo-collection-spec.md` Section 3. Prefix: `R-OFF-*`.

Do these in the order listed. Requirement numbers are stable rather than
sequential, because R-OFF-6 was withdrawn and its number is not reused.

---

**R-OFF-7.** Before traveling, back up the working copy with the **home copy**,
and confirm the run reported no error.

**R-OFF-1.** Take the **working copy** to the building where the off-site copy
is kept. Do not bring the off-site copy to the working copy.

**R-OFF-2.** Run the Turbo-Collection backup there. Any computer will do,
including one you do not own.

**R-OFF-3.** Read the report.

**R-OFF-4.** Leave the off-site copy **off-site**. Bring home only the working
copy.

**R-OFF-5.** Keep at least one copy off-site at all times.

---

> **Why the off-site copy stays and the working copy travels.** Bringing the
> off-site copy home to be updated puts all three copies in one building for as
> long as it is there, and one fire during that window destroys every copy. That
> is the exact event off-site storage exists to prevent, reintroduced
> periodically by the routine meant to maintain it. Taking the working copy to
> the off-site copy never puts more than two copies under one roof.

> **Why R-OFF-7 comes first.** With the working copy traveling, it is the copy
> exposed to a car, a bag, and a journey. Backing up with the home copy before
> leaving means a lost or dropped working copy costs a drive and no photographs,
> because a current copy stayed at home. Without it, the trip is taken with the
> only current copy in hand.

> **Why any computer will do.** Nothing the collection depends on lives on the
> host. Configuration travels with the collection and each drive states what it
> is (`turbo-collection-spec.md` R-CFG-5, R-MFILE-19), everything that bears on
> whether material at an import source can be deleted is written into receipts
> on the drives rather than into a log on the machine (R-MFILE-13), and no
> database is kept anywhere (Section 2). So the computer at the far end is
> equipment you borrow, not part of the system, and it need not run the
> operating system your own computer runs (R-CLI-15). One caution, which is not
> a rule here: a borrowed computer is a machine whose state you do not control,
> and plugging the working copy into it is a judgment you make about that
> machine.

## Not yet stated

How often to run this, and how often the off-site copy is read and verified. The
second is what establishes it is still intact, and it replaced the withdrawn
media rule rather than merely outliving it.

## Bump test

Required by `version-requirement.md` R-PUB-1.

| Level     | Test                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| **MAJOR** | An obligation here is withdrawn or narrowed, so an operator conforming before no longer conforms. |
| **MINOR** | Additions only.                                                                                   |
| **PATCH** | Prose that changes no obligation.                                                                 |
