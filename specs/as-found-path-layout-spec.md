# Turbo-Collection: As-Found Path Layout Specification

> **Version:** 0.1.0-draft
> **Created:** 2026-10-06
> **Status:** Draft. No implementation exists yet.

This document is normative over one **layout convention**: a content file is stored at the path its
import source supplied for it, so a tree of files enters a copy shaped as it was found. It states
which items that convention is able to place
([`turbo-collection-spec.md`](turbo-collection-spec.md) R-SRC-15), and the path each file receives.

It governs **content files** and nothing else. Where a manifest, a receipt, a configuration file, or
a `README.md` sits is stated by the requirements that define each of those, never here.

Requirement ID prefix: **`R-FOUND-*`**.

> **Rationale.** Why adopted files stay where they sit, and why this convention sits beneath every other as a floor: [the copy-creation decision](../docs/decisions/2026-09-30-copy-creation-decision.md) and [the layout-selection decision](../docs/decisions/2026-10-03-layout-selection-decision.md).

---

## 0. Role and scope

This document binds the implementation. It answers one question: given a file and the path its
import source supplied for it, where in a copy does that file go.

One rule serves each of these roles:

- **Adoption.** Files already in a directory become content of a copy without moving
  (`turbo-collection-spec.md` R-CLI-12).
- **Primary layout.** An import source specification names this convention to govern its items, and
  files are copied in from elsewhere (`turbo-collection-spec.md` R-SRC-15).
- **Floor.** This convention takes an item that another primary layout is not able to place, so no
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

- **Import source.** One way of getting original bytes into the collection, such as a camera card or
  a directory of existing files. An import source is an instance, named by the operator; a leaf
  manifest records which one placed a directory (`meta-file-spec.md` R-MFILE-9).

- **Importer.** The component that brings files into the collection from one import source.

- **Layout convention.** A rule that determines where in a copy a content file is stored, given that
  file's own bytes, the metadata its import source supplied with it, and that import source.

- **Primary layout.** The one layout specification that an import source specification names to
  govern that import source's items.

- **Convention identifier.** The name by which this convention is recorded in a copy:
  **`as-found-path-layout`**.

- **Supplied path.** The path a file has at its import source, relative to a root that import
  source's specification states. An importer supplies it with every file
  (`turbo-collection-spec.md` R-SRC-21).

- **Adoption.** The import that the init operation performs of the files already in a directory as it
  makes that directory a copy. In an adoption, a file's supplied path is its path relative to that
  directory.

- **Collection filename.** The name a content file carries inside a copy.

## 2. What this convention places

**R-FOUND-1.** This convention is able to place every item. Turbo-Collection MUST NOT decline to place an item under this convention on account of that item's bytes, its kind, or its filename extension.

> **Example.** A spreadsheet, a PDF, and a file with no extension are all placed, each at its supplied path.

## 3. The path

**R-FOUND-2.** In an adoption, Turbo-Collection MUST record every adopted file at that file's supplied path, relative to a copy's root, and MUST NOT add a directory to that path. An adopted file therefore stays at the path it had (`turbo-collection-spec.md` R-CLI-12).

**R-FOUND-3.** In every import other than an adoption, Turbo-Collection MUST store every content file it places under this convention at `<import source>/<supplied path>`, relative to a copy's root, where `<import source>` is the import source's identifier, recorded as `importSource.specId` in each manifest beneath that directory (`meta-file-spec.md` R-MFILE-9), and `<supplied path>` is that file's supplied path. This rule applies alike to an item whose import source names this convention as its primary layout, and to an item this convention takes as the floor.

> **Example.** `Taxes/2024/return.pdf` imported from an import source named `old-laptop` is stored at `old-laptop/Taxes/2024/return.pdf`, so two import sources' trees never merge into one directory.

**R-FOUND-4.** An importer MUST supply a relative path, and Turbo-Collection MUST write that path with segments joined by `/`. Turbo-Collection MUST NOT store a file outside the directory R-FOUND-2 or R-FOUND-3 names for it. Turbo-Collection MUST refuse an item holding a file whose supplied path is absolute, is empty, or contains a segment that is `.` or `..`, and MUST report every item refused this way.

> **Example.** A supplied path of `../../Windows/notes.txt` is refused and reported, never resolved to a place outside the copy.

## 4. Filenames

**R-FOUND-5.** Turbo-Collection MUST preserve every segment of a supplied path exactly as supplied, including its letter case. This convention MUST NOT alter a collection filename, which is governed by the `R-NAME-*` family in [`turbo-collection-spec.md`](turbo-collection-spec.md).

## 5. Recording this convention

**R-FOUND-6.** Turbo-Collection MUST record the convention identifier `as-found-path-layout`, together with this document's version, for every directory it fills under this convention. Which file carries that record, and under which field name, is stated by the requirements that define that file.

## 6. This document's bump test

Required of every normative document by `version-requirement.md` R-PUB-1. This test is measured on
**paths**, because a path is what this document gives a file in a copy.

| Level     | Test                                                                                                                                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | A file this convention places would receive a different path than it received under the previous version; or this convention stops placing an item it placed; or an obligation is withdrawn or narrowed; or the document language or obligation vocabulary changes (`version-requirement.md` R-PUB-9). |
| **MINOR** | Additions only. Every file placed under the previous version keeps its path, and every file already placed stays validly placed.                                                                                                                                                       |
| **PATCH** | Prose improvement that changes no obligation and moves no file.                                                                                                                                                                                                                         |
