# Turbo-Collection: Off-site Procedure

> **Version:** 0.1.0-draft  
> **Created:** 2026-08-08  
> **Status:** Draft. An off-site run is not built yet, so R-OFF-2 names work
> that does not exist. R-OFF-6 was withdrawn on 2026-08-10 and its number is not
> reused.  
> **Applies to:** a human operator, every time your off-site TC Copy is brought
> up to date.  
> **Why any of this:**
> [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md)

Bringing your off-site TC Copy up to date. **Off-site** means in a different
building from every other TC Copy; your off-site TC Copy is one of three TC
Copies `turbo-collection-setup-procedure.md` names.

**Your off-site TC Copy never travels.** You take your working TC Copy to it,
and back up there.

Written under [`../language-requirement.md`](../language-requirement.md). Terms:
`turbo-collection-spec.md` Section 3. Prefix: `R-OFF-*`.

Do these in listed order. Requirement numbers are stable rather than sequential,
because R-OFF-6 was withdrawn and its number is not reused.

---

**R-OFF-7.** Before traveling, back up your working TC Copy with your **home TC
Copy**, and confirm that backup reported no error.

**R-OFF-1.** Take your **working TC Copy** to whichever building keeps your
off-site TC Copy. Do not bring your off-site TC Copy to your working TC Copy.

**R-OFF-2.** Run Turbo-Collection's backup there. Any computer will do,
including one you do not own.

**R-OFF-3.** Read that backup's report.

**R-OFF-4.** Leave your off-site TC Copy **off-site**. Bring home only your
working TC Copy.

**R-OFF-5.** Keep at least one TC Copy off-site at all times.

---

> **Why your off-site TC Copy stays and your working TC Copy travels.** Bringing
> your off-site TC Copy home to be updated puts all three TC Copies in one
> building for as long as it is there, and one fire during that window destroys
> every TC Copy. That is exactly what off-site storage exists to prevent,
> reintroduced periodically by a routine meant to maintain it. Taking your
> working TC Copy to your off-site TC Copy never puts more than two TC Copies
> under one roof.

> **Why R-OFF-7 comes first.** With your working TC Copy traveling, that TC Copy
> is exposed to a car, a bag, and a journey. Backing up with your home TC Copy
> before leaving means a lost or dropped working TC Copy costs a drive and no
> photographs, because a current TC Copy stayed at home. Without it, a trip is
> taken with your only current TC Copy in hand.

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
> your working TC Copy into it is a judgment you make about that machine.

## Not yet stated

How often to run this, and how often your off-site TC Copy is read and verified.
That second one is what establishes it is still intact, and it replaced a media
rule, since withdrawn, rather than merely outliving it.

## Bump test

Required by `version-requirement.md` R-PUB-1.

| Level     | Test                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| **MAJOR** | An obligation here is withdrawn or narrowed, so an operator conforming before no longer conforms. |
| **MINOR** | Additions only.                                                                                   |
| **PATCH** | Prose that changes no obligation.                                                                 |
