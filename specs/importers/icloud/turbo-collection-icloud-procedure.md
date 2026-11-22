# Turbo-Collection: Import Procedure, Apple iCloud Photos

> **Version:** 0.1.0-draft  
> **Created:** 2026-07-25  
> **Status:** Stub. No steps written yet.

This document is a **human execution path** for copying photos out of iCloud
into a folder, each as its unmodified original, through Photos on a Mac. An
import from Local-folder Import Source then takes that folder in
([`../../procedures/turbo-collection-import-procedure.md`](../../procedures/turbo-collection-import-procedure.md)
R-IMP-2). In this version iCloud is not an Import Source of its own. This
procedure binds a human operator, not Turbo-Collection's implementation, and no
code cites it.

Written under [`../../language-requirement.md`](../../language-requirement.md).
Terms: `turbo-collection-spec.md` Section 3. Prefix: `R-ICLOUD-*`.

---

## 0. How to write steps in this document

Each step states **what it must achieve** first, and **how it is currently
achieved** second:

> An export must produce unmodified originals. Today: File > Export > Export
> Unmodified Original.

A bare click path cannot migrate. When a step becomes automatable, its
requirement is already articulated and moves unchanged into whichever Import
Source specification automates it. Expect traffic in both directions: a vendor
removing an interface moves an automated step back out.

## 1. Preconditions

**R-ICLOUD-1.** Have every photo you are about to export on your Mac in full,
not only as a smaller copy whose original iCloud holds. Today: Photos >
Settings > iCloud > Download Originals to this Mac, then wait until Photos
finishes downloading.

## 2. Steps

**R-ICLOUD-2.** Choose a batch small enough to count
(`turbo-collection-import-procedure.md` R-IMP-5), and make a new, empty folder
for it outside every TC Copy, named for where its photos came from and which
batch it holds, such as `icloud-2019`.

**R-ICLOUD-3.** Export that batch into that folder. Each photo should come out
as its unmodified original under its own filename, with no folders inside and no
file Photos writes beside a photo. Today: select the batch, then File > Export >
Export Unmodified Original, with File Name set to Use File Name, Subfolder
Format set to None, and Export IPTC as XMP turned off.

## 3. Verification

**R-ICLOUD-4.** Before importing, confirm the folder holds one file for every
item Photos said it would export, plus a `.mov` for each Live Photo among them.
Import no batch that falls short; export it again. Today: Photos states that
number in its Export Unmodified Original menu item, and a Smart Album that
matches the batch with Photo is Live Photo counts its Live Photos.

## 4. Validity

Not yet executed start to finish.

Observed on a Mac with macOS 26.5.2 (build 25F84) on 2026-07-27: Export
Unmodified Original's File Name and Subfolder Format settings, and each Live
Photo exporting as a still and a `.mov`, so 6 items gave 11 files and 12 items
gave 23.

Taken from Apple's documentation, not observed: Download Originals to this Mac
(R-ICLOUD-1) and Export IPTC as XMP (R-ICLOUD-3). Not checked at all: a Smart
Album matching Photo is Live Photo (R-ICLOUD-4).

Record here the macOS version and date of each execution in full. Execute it
again after every major macOS release.
