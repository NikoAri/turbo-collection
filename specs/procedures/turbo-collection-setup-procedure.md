# Turbo-Collection: Setup Procedure

> **Version:** 0.1.0-draft
> **Created:** 2026-08-08
> **Status:** Draft. Turbo-Collection is not built yet, so R-SET-15, R-SET-10 and R-SET-11 name work that does not exist.
> **Applies to:** a human operator, once, before a collection is protected.
> **Why any of this:** [`../../docs/decisions/2026-08-10-storage-hardware-decision.md`](../../docs/decisions/2026-08-10-storage-hardware-decision.md)

Do these once. Written under [`../language-requirement.md`](../language-requirement.md). Terms: `turbo-collection-spec.md` Section 3. Prefix: `R-SET-*`.

---

## 1. What you need

**R-SET-1.** You MUST have a laptop or desktop computer running **Windows** or **macOS**, with a port the drives connect to.

You also need three drives, which Section 2 covers. The three copies are **peers**: none is a master,
each carries its own manifest, and any one can restore any other (`turbo-collection-spec.md` Section 3).
They differ only in what you do with each and where it sits:

| Copy | What you do with it | Drive |
|---|---|---|
| **working copy** | import into it, and carry it to where the off-site copy is kept | solid-state drive |
| **home copy** | keep it with you, backed up with the working copy | hard disk |
| **off-site copy** | keep it in another building; it never travels | hard disk |

**Off-site** means in a different building from every other copy.

> **Why these names.** *Target* is a word `turbo-collection-spec.md` deliberately retired, because it
> casts one copy as subordinate to another when the copies are peers. *Working*,
> *home* and *off-site* name what a copy is for and where it rests, not a rank. Which drive becomes the
> working copy is a convention you adopt, not a property Turbo-Collection depends on: it identifies a
> copy by its `collectionName` in configuration, not by which one you import into.

## 2. Get three drives

Drives you already own count. Nothing here requires a purchase, and a smaller drive today beats a
better one you have not bought yet.

### 2.1 Required

**R-SET-2.** You MUST have **two hard disk drives** and **one solid-state drive**.

**R-SET-14.** Every drive MUST be **external and removable**, and its data MUST be readable after moving the drive to a different enclosure or dock. You MUST NOT keep the collection on storage built into a computer.

> **Why R-SET-14 is a rule and not advice.** Storage built into a modern computer usually cannot be
> removed from it. Laptop storage is commonly soldered, and on some machines it is also tied
> cryptographically to that machine's processor, so a dead computer is a dead collection no matter how
> healthy the storage chips are. The same trap exists one step out: many consumer external drives
> encrypt in hardware on the enclosure's own chip, whether or not you ever set a password, so a
> healthy disk reads as blank in any other enclosure once that chip fails. A bare drive in a plain
> dock avoids both. This is the project's rule about vendors, applied to hardware: **a vendor may be
> an import source, never a custodian.** Silicon in the path can never be removed entirely, only kept
> standard and replaceable, so the goal is the least dependency you can arrange rather than none.

### 2.2 Recommended

These improve the odds that your three drives do not fail together. Skip any of them and you still
have a working setup.

**R-SET-3.** When buying, you SHOULD buy each drive on a **different date**, never all on one date.

**R-SET-4.** You SHOULD use **different models**.

**R-SET-5.** You SHOULD prefer capacity of at least **twice** your current photo total, and more where the price gap is small, so that age rather than fullness decides replacement.

- Why hard disks for backups, what diversity is worth, capacity and prices:
  [storage hardware decision](../../docs/decisions/2026-08-10-storage-hardware-decision.md).

## 3. Prepare

**R-SET-6.** Format all three drives as **exFAT**.

**R-SET-7.** You SHOULD mark each drive on the outside so you can tell it from the others. A useful mark is which copy it is (**working**, **home**, or **off-site**) and its **purchase date**.

**R-SET-8.** Put your collection on the **solid-state drive**, and treat it as your working copy.

**R-SET-15.** Run the Turbo-Collection **init** on the directory that holds your collection on the solid-state drive. Init makes that directory your working copy, named `main`, and leaves every file already in it where it is.

**R-SET-9.** Use the two hard disk drives as the **home copy** and the **off-site copy**.

> **Why exFAT.** It is the one format Windows and macOS both read and write with no extra software.
> The alternatives each need paid kernel-level drivers on one of the two, which the project's
> simplicity filter rejects.

> **Why init comes before anything else.** Until init runs, nothing on a drive says it is a copy,
> and an import or a backup into it is refused (`turbo-collection-spec.md` R-CLI-14). Init writes
> what makes a directory a copy, and takes in files already there without moving them
> (R-CLI-11, R-CLI-12). Give init a different name only if `main` is already the name of another copy
> you connect.

> **The starter ignore file.** Where a directory has no `.tcignore`, init writes one listing files
> that operating systems create on their own, so they are not taken in as content. Fuller lists are
> kept by the github/gitignore project, under `Global` at <https://github.com/github/gitignore>.
> Before adding a pattern from there, check that it matches no file you want kept: those lists are
> written for source code, and name file types, such as installers and shortcuts, that are real
> content in a collection.

> **What to write on a drive, and what not to.** Marking is a memory aid, not something
> Turbo-Collection reads, so the words are yours. Write only what stays true through routine work:
> a purchase date never changes, and the off-site copy never travels
> (`turbo-collection-offsite-procedure.md`), so *off-site* is safe to write on it. Which drive is
> off-site is decided by where you keep it, not by what a case says, and a release depends on that
> placement.

## 4. Fill

**R-SET-10.** Run the Turbo-Collection **backup** with the working copy and an empty directory on one hard disk drive, giving the new copy a name for where it will rest, such as `home`. Then verify the home copy against its own manifests.

**R-SET-11.** Run the Turbo-Collection **backup** with the working copy and an empty directory on the other hard disk drive, giving the new copy a name for where it will rest, such as `off-site`. Then verify it against its own manifests.

**R-SET-12.** Take the off-site copy **off-site**, and leave it there.

> **Why a backup, and why a name.** A backup given an empty directory creates a new copy there and
> fills it, and refuses to do so without a name (`turbo-collection-spec.md` R-CLI-13). A copy is
> named for where it permanently rests, so a drive in the wrong place is plainly wrong. A drive that
> replaces a dead one takes the dead copy's name.

## 5. Done when

**R-SET-13.** Confirm **three copies exist on three drives, one of them off-site**, before treating anything held at an import source as releasable.

`turbo-collection-backup-procedure.md` takes over from here, and the release gate in
`turbo-collection-release-procedure.md` depends on R-SET-13 holding.

---

## Not yet stated

Drive replacement on age, retiring a drive to a cold spare, and what to do when a drive dies. All
need a replacement cadence, which is undecided.

**How often each copy is read and verified**, which is what establishes that a copy is still intact
on any medium. This is the obligation that replaced the withdrawn solid-state prohibitions, and it
has no number yet.

## Bump test

Required by `version-requirement.md` R-PUB-1.

| Level | Test |
|---|---|
| **MAJOR** | An obligation here is withdrawn or narrowed, so an operator conforming before no longer conforms. |
| **MINOR** | Additions only. |
| **PATCH** | Prose, or a refreshed price or capacity, which binds nothing. |
