# Turbo-Collection: As-Found Path Layout Specification

> **Version:** 0.1.0-draft
> **Created:** 2026-10-06
> **Status:** Draft. No implementation exists yet.

This document is normative over one **Layout**: a content file is stored at the path its
import source supplied for it, so a tree of files enters a copy shaped as it was found. It states
which items that Layout is able to place
([`turbo-collection-spec.md`](turbo-collection-spec.md) R-SRC-15), and the path each file receives.

It governs **content files** and nothing else. Where a manifest, a receipt, a configuration file, or
a `README.md` sits is stated by the requirements that define each of those, never here.

Requirement ID prefix: **`R-FOUND-*`**.

> **Rationale.** Why files already inside a Copy stay where they sit, and why this Layout sits beneath every other as a floor: [the copy-creation decision](../docs/decisions/2026-09-30-copy-creation-decision.md) and [the layout-selection decision](../docs/decisions/2026-10-03-layout-selection-decision.md).

---

## 0. Role and scope

This document binds the implementation. It answers one question: given a file and the path its
import source supplied for it, where in a copy does that file go.

One rule serves each of these roles:

- **Primary Layout.** An Import Source specification names this Layout to govern its Items
  (`turbo-collection-spec.md` R-SRC-15). Files from the in-place Import Source are already inside
  the Copy and do not move; files from every other Import Source are copied in from elsewhere.
- **Floor.** This Layout takes an item that another primary layout is not able to place, so no
  item is left out of a collection for want of a place (`turbo-collection-spec.md` R-SRC-20).

It does not decide what a file inside a directory is called, which the `R-NAME-*` family owns, and
it does not decide which files a copy ignores, which an ignore file does (`meta-file-spec.md`
R-MFILE-20).

## 1. Terminology

Per `language-requirement.md` R-LANG-5, this section is self-contained.

- **Collection.** The set of files this project preserves, held as one or more peer copies.

- **Copy.** One physical instance of the collection, held on one storage medium; copies are peers.

- **Content file.** Any file a copy holds that is neither a meta file nor an ignored file.

- **Meta file.** A file that describes a copy or what happened to it, such as a manifest or a
  receipt.

- **Ignored file.** A file in a copy that matches a pattern in that copy's ignore file.

- **Item.** One logical thing supplied by an import source, which may comprise several content
  files.

- **Import Source.** One way of getting files into the collection, such as a camera card or
  a directory of existing files. An import source is an instance, named by the operator; a leaf
  manifest records which one placed a directory (`meta-file-spec.md` R-MFILE-9).

- **In-place Import Source.** The Import Source whose Items are the files already inside a Copy that
  no manifest of that Copy lists, identified as `in-place`
  ([`in-place-import-source-spec.md`](import-sources/in-place/in-place-import-source-spec.md)).

- **Importer.** The component that brings files into the collection from one import source.

- **Layout.** A rule that determines where in a copy a content file is stored, given that
  file's own bytes, the metadata its import source supplied with it, and that import source.

- **Primary Layout.** The one Layout that an Import Source specification names to govern that
  Import Source's Items.

- **Layout identifier.** The name by which this Layout is recorded in a copy:
  **`as-found-path-layout`**.

- **Supplied path.** The path a file has at its import source, relative to a root that import
  source's specification states. An importer supplies it with every file
  (`turbo-collection-spec.md` R-SRC-21).

- **Collection filename.** The name a content file carries inside a copy.

## 2. What this Layout places

**R-FOUND-1.** This Layout is able to place every item. Turbo-Collection MUST NOT decline to place an item under this Layout on account of that item's bytes, its kind, or its filename extension.

> **Example.** A spreadsheet, a PDF, and a file with no extension are all placed, each at its supplied path.

## 3. The path

**R-FOUND-2.** For an Item from the in-place Import Source, Turbo-Collection MUST record every file of that Item at that file's Supplied path, relative to the Copy's root, and MUST NOT add a directory to that path. Such a file therefore stays at the path it has (`turbo-collection-spec.md` R-SRC-7).

> **Example.** `Taxes/2024/return.pdf`, found in a directory that init makes a Copy, is recorded at `Taxes/2024/return.pdf` and is not moved.

**R-FOUND-3.** For an Item from any other Import Source, Turbo-Collection MUST store every Content file it places under this Layout at `<import source>/<supplied path>`, relative to a Copy's root, where `<import source>` is that Import Source's identifier, recorded as `importSource.specId` in each manifest beneath that directory (`meta-file-spec.md` R-MFILE-9), and `<supplied path>` is that file's Supplied path. This rule applies alike to an Item whose Import Source names this Layout as its Primary Layout, and to an Item this Layout takes as the floor.

> **Example.** The local-folder Import Source reads a folder named `old-laptop` and supplies `old-laptop/Taxes/2024/return.pdf` as one file's Supplied path. That file is stored at `local-folder/old-laptop/Taxes/2024/return.pdf`, so the trees of two Import Sources never merge into one directory.

**R-FOUND-4.** An importer MUST supply a relative path, and Turbo-Collection MUST write that path with segments joined by `/`. Turbo-Collection MUST NOT store a file outside the directory R-FOUND-2 or R-FOUND-3 names for it. Turbo-Collection MUST refuse an item holding a file whose supplied path is absolute, is empty, or contains a segment that is `.` or `..`, and MUST report every item refused this way.

> **Example.** A supplied path of `../../Windows/notes.txt` is refused and reported, never resolved to a place outside the copy.

## 4. Filenames

**R-FOUND-5.** Turbo-Collection MUST preserve every segment of a supplied path exactly as supplied, including its letter case. This Layout MUST NOT alter a collection filename, which is governed by the `R-NAME-*` family in [`turbo-collection-spec.md`](turbo-collection-spec.md).

## 5. Recording this Layout

**R-FOUND-6.** Turbo-Collection MUST record the Layout identifier `as-found-path-layout`, together with this document's version, for every directory it fills under this Layout. Which file carries that record, and under which field name, is stated by the requirements that define that file.

## 6. This document's bump test

Required of every normative document by `version-requirement.md` R-PUB-1. This test is measured on
**paths**, because a path is what this document gives a file in a copy.

| Level     | Test                                                                                                                                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | A file this Layout places would receive a different path than it received under the previous version; or this Layout stops placing an item it placed; or an obligation is withdrawn or narrowed; or the document language or obligation vocabulary changes (`version-requirement.md` R-PUB-9). |
| **MINOR** | Additions only. Every file placed under the previous version keeps its path, and every file already placed stays validly placed.                                                                                                                                                       |
| **PATCH** | Prose improvement that changes no obligation and moves no file.                                                                                                                                                                                                                         |
