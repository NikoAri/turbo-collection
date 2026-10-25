# Turbo-Collection: Setup Procedure

> **Version:** 0.1.0-draft  
> **Created:** 2026-08-08  
> **Status:** Draft. Verify is not built yet, so whichever verify R-SET-10 and
> R-SET-11 ask for does not exist.  
> **Applies to:** a human operator, once, before a collection is protected.  
> **Why any of this:**
> [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md)

Do these once. Written under
[`../language-requirement.md`](../language-requirement.md). Terms:
`turbo-collection-spec.md` Section 3. Prefix: `R-SET-*`.

---

## 1. What you need

**R-SET-1.** You MUST have a laptop or desktop computer running **Windows**,
**macOS** or **Linux**, with a port your drives connect to.

You also need three drives, which Section 2 covers. Your three copies are
**peers**: none is a master, each carries its own manifest, and any one can
restore any other (`turbo-collection-spec.md` Section 3). They differ only in
what you do with each and where it sits:

| Copy              | What you do with it                                              | Drive             |
| ----------------- | ---------------------------------------------------------------- | ----------------- |
| **working copy**  | import into it, and carry it to where your off-site copy is kept | solid-state drive |
| **home copy**     | keep it with you, backed up with your working copy               | hard disk         |
| **off-site copy** | keep it in another building; it never travels                    | hard disk         |

**Off-site** means in a different building from every other copy.

> **Why these names.** _Target_ is a word `turbo-collection-spec.md`
> deliberately retired, because it casts one copy as subordinate to another when
> copies are peers. _Working_, _home_ and _off-site_ name what a copy is for and
> where it rests, not a rank. Which drive becomes your working copy is a
> convention you adopt, not a property Turbo-Collection depends on: it
> identifies a copy by its `copyName` in configuration, not by which one you
> import into.

## 2. Get three drives

Drives you already own count. Nothing here requires a purchase, and a smaller
drive today beats a better one you have not bought yet.

### 2.1 Required

**R-SET-2.** You MUST have **two hard disk drives** and **one solid-state
drive**.

**R-SET-14.** Every drive MUST be **external and removable**, and its data MUST
be readable after moving that drive to a different enclosure or dock. You MUST
NOT keep your collection on storage built into a computer.

> **Why R-SET-14 is a rule and not advice.** Storage built into a modern
> computer usually cannot be removed from it. Laptop storage is commonly
> soldered, and on some machines it is also tied cryptographically to that
> machine's processor, so a dead computer is a dead collection no matter how
> healthy its storage chips are. That same trap exists one step out: many
> consumer external drives encrypt in hardware on its enclosure's own chip,
> whether or not you ever set a password, so a healthy disk reads as blank in
> any other enclosure once that chip fails. A bare drive in a plain dock avoids
> both. This is Turbo-Collection's rule about vendors, applied to hardware: **a
> vendor may be an import source, never a custodian.** Silicon in a drive's path
> can never be removed entirely, only kept standard and replaceable, so aim for
> as little dependency as you can arrange rather than none.

### 2.2 Recommended

These make it less likely that your three drives fail together. Skip any of them
and you still have a working setup.

**R-SET-3.** When buying, you SHOULD buy each drive on a **different date**,
never all on one date.

**R-SET-4.** You SHOULD use **different models**.

**R-SET-5.** You SHOULD prefer capacity of at least **twice** your current photo
total, and more where that costs little extra, so that age rather than fullness
decides replacement.

- Why hard disks for backups, what diversity is worth, capacity and prices:
  [storage hardware decision](../../docs/decisions/2026-08-10-storage-hardware-decision.md).

## 3. Prepare

**R-SET-6.** Format all three drives as **exFAT**.

**R-SET-7.** You SHOULD mark each drive on its outside so you can tell it from
your other drives. A useful mark is which copy it is (**working**, **home**, or
**off-site**) and its **purchase date**.

**R-SET-8.** Use your **solid-state drive** for your working copy.

**R-SET-15.** Run Turbo-Collection's **init** on a directory on your solid-state
drive that is empty or does not exist yet. Init makes that directory your
working copy, named `main`. Photographs you already have enter it by an import
(`turbo-collection-import-procedure.md`).

**R-SET-9.** Use your two hard disk drives as your **home copy** and your
**off-site copy**.

> **Why exFAT.** No other format is read and written by every supported
> operating system with no extra software. Each alternative needs paid
> kernel-level drivers on one of them, which this project's simplicity filter
> rejects.

> **Why init comes before anything else.** Until init runs, nothing on a drive
> says it is a copy, and an import or a backup into it is refused
> (`turbo-collection-core-spec.md` R-CLI-14, `backup-spec.md` R-BACKUP-1). Init
> writes what makes a directory a copy, and refuses a directory that already
> holds files, so a folder picked by mistake is left as it was (`init-spec.md`
> R-INIT-1, R-INIT-3). Give init a different name only if another copy you
> connect is already named `main`.

> **Init's starter ignore file.** Init writes a `.tcignore` listing files that
> operating systems create on their own, so an import does not take them in as
> content. Fuller lists are kept by github/gitignore, under `Global` at
> <https://github.com/github/gitignore>. Before adding a pattern from there,
> check that it matches no file you want kept: those lists are written for
> source code, and name file types, such as installers and shortcuts, that are
> real content in a collection.

> **What to write on a drive, and what not to.** Marking is a memory aid, not
> something Turbo-Collection reads, so what you write is yours. Write only what
> stays true through routine work: a purchase date never changes, and your
> off-site copy never travels (`turbo-collection-offsite-procedure.md`), so
> _off-site_ is safe to write on it. Which drive is off-site is decided by where
> you keep it, not by what a case says, and a release depends on that placement.

## 4. Fill

**R-SET-10.** Run Turbo-Collection's **backup** with your working copy and an
empty directory on one hard disk drive, giving that new copy a name for where it
will rest, such as `home`. Then verify your home copy against its own manifests.

**R-SET-11.** Run Turbo-Collection's **backup** with your working copy and an
empty directory on your other hard disk drive, giving that new copy a name for
where it will rest, such as `off-site`. Then verify it against its own
manifests.

**R-SET-12.** Take your off-site copy **off-site**, and leave it there.

> **Why a backup, and why a name.** A backup given an empty directory creates a
> new copy there and fills it, and refuses to do so without a name
> (`backup-spec.md` R-BACKUP-1). A copy is named for where it permanently rests,
> so a drive in a wrong place is plainly wrong. A drive that replaces a dead one
> takes that dead copy's name.

## 5. Done when

**R-SET-13.** Confirm **three copies exist on three drives, one of them
off-site**, before treating anything held at an import source as releasable.

`turbo-collection-backup-procedure.md` takes over from here, and
`turbo-collection-release-procedure.md`'s release gate depends on R-SET-13
holding.

---

## Not yet stated

Drive replacement on age, retiring a drive to a cold spare, and what to do when
a drive dies. All need a replacement cadence, which is undecided.

**How often each copy is read and verified**, which is what establishes that a
copy is still intact on any medium. This obligation replaced solid-state
prohibitions, since withdrawn, and it has no number yet.

## Bump test

Required by `version-requirement.md` R-PUB-1.

| Level     | Test                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| **MAJOR** | An obligation here is withdrawn or narrowed, so an operator conforming before no longer conforms. |
| **MINOR** | Additions only.                                                                                   |
| **PATCH** | Prose, or a refreshed price or capacity, which binds nothing.                                     |
