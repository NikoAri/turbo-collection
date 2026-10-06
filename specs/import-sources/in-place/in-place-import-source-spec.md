# Turbo-Collection: Import Source Specification, In-Place

> **Version:** 0.1.0-draft
> **Created:** 2026-10-06
> **Status:** Draft. No implementation exists yet.
> **Primary Layout:** [`as-found-path-layout-spec.md`](../../as-found-path-layout-spec.md)

This document is normative over the **In-place Import Source**: the files already inside a Copy that
no Manifest of that Copy lists. It covers the files found in a directory that the Init operation
makes a Copy, and the files a person later adds to a Copy with an ordinary file manager.

Requirement ID prefix: **`R-INPLACE-*`**.

> **Rationale.** Why files already inside a Copy are taken in where they sit, why an operator starts that and a Backup never does, and why a directory has one provenance: [the in-place importer decision](../../../docs/decisions/2026-10-06-in-place-importer-decision.md), [the copy-creation decision](../../../docs/decisions/2026-09-30-copy-creation-decision.md), and [the layout-selection decision](../../../docs/decisions/2026-10-03-layout-selection-decision.md).

---

## 0. Role and scope

This document binds the implementation. It answers one question: which files already inside a Copy
does an In-place Import take in, and how are they recorded.

No vendor controls this Import Source, so unlike a specification for a vendor's service it needs no
dated evidence and no expiry: a Copy is read through the operating system's ordinary file
operations.

A file from outside a Copy belongs to another Import Source, such as the local-folder Import Source
([`local-folder-import-source-spec.md`](../local-folder/local-folder-import-source-spec.md)).

## 1. Terminology

Per `language-requirement.md` R-LANG-5, this section is self-contained.

- **Collection.** The set of files this project preserves, held as one or more peer Copies.

- **Copy.** One physical instance of the Collection, held on one storage medium; Copies are peers.

- **Content file.** Any file a Copy holds that is neither a Meta file nor an Ignored file.

- **Meta file.** A file that describes a Copy or what happened to it, such as a Manifest or a
  receipt.

- **Ignored file.** A file in a Copy that matches a pattern in that Copy's ignore file.

- **Manifest.** The Meta file that records a checksum for each Content file in one directory, and
  names the Layout and the Import Source that placed that directory's content.

- **Arrival.** One recorded event of a directory's content reaching one Copy.

- **Import Source.** One way of getting files into the Collection, such as a camera card or a
  directory of existing files.

- **In-place Import Source.** The Import Source this document specifies: the files already inside a
  Copy that no Manifest of that Copy lists.

- **Importer.** The component that brings files into the Collection from one Import Source.

- **Import.** Bringing files into the Collection from an Import Source, performed by an Importer.

- **In-place Import.** An Import from the In-place Import Source of one Copy.

- **Item.** One logical thing supplied by an Import Source, which may comprise several files.

- **Layout.** A rule that determines where in a Copy a Content file is stored.

- **Primary Layout.** The one Layout that an Import Source specification names to govern that
  Import Source's Items.

- **As-found Layout.** The Layout that stores a file at the path its Import Source supplied for it.

- **Supplied path.** The path a file has at its Import Source, relative to a root that Import
  Source's specification states.

- **Init.** The operation that makes a directory the first Copy of a Collection.

- **Backup.** The operation that brings peer Copies into agreement.

## 2. Identity

**R-INPLACE-1.** Turbo-Collection MUST treat every Copy's own directory as that Copy's In-place Import Source, and MUST NOT require a configuration setting to do so.

**R-INPLACE-2.** Turbo-Collection MUST identify the In-place Import Source as `in-place` wherever a Meta file records an Import Source (`meta-file-spec.md` R-MFILE-9). Turbo-Collection MUST refuse an Import that draws from any other Import Source named `in-place`.

## 3. Items

**R-INPLACE-3.** In an In-place Import of a Copy, Turbo-Collection MUST take as an Item every file inside that Copy, at any depth, that no Manifest of that Copy lists, other than a Meta file, an Ignored file (`meta-file-spec.md` R-MFILE-21), and a file that R-INPLACE-4 excludes.

> **Example.** A spreadsheet a person copied into `Taxes/2025/` with a file manager is an Item at the next In-place Import. A `.DS_Store` that matches the Copy's ignore file is not.

**R-INPLACE-4.** **One directory, one provenance.** Turbo-Collection MUST take a file as an Item only where that file's directory has no Manifest, or has a Manifest that names the In-place Import Source. Where a file's directory has a Manifest that names another Import Source, Turbo-Collection MUST NOT take that file as an Item, MUST leave that file as it is, and MUST report that file.

> **Example.** A file dropped by hand into `2025/2025-06/icloud-personal/`, a directory the photo Layout filled, is reported and left alone. That directory's Manifest names the photo Layout and `icloud-personal` for every file it lists (`meta-file-spec.md` R-MFILE-9), so listing this file there would state something false.

> **Open.** Whether files that are semantically one thing, such as a still image beside its paired motion clip, form one Item here (`turbo-collection-spec.md` R-SRC-9), and how a pairing is recognized without a vendor to state it. Until that is settled, every file is its own Item.

## 4. Placement and recording

**R-INPLACE-5.** Turbo-Collection MUST place every Item of the In-place Import Source under the As-found Layout ([`as-found-path-layout-spec.md`](../../as-found-path-layout-spec.md)), which is this Import Source's Primary Layout (`turbo-collection-spec.md` R-SRC-15).

**R-INPLACE-6.** An Importer for the In-place Import Source MUST supply, as each file's Supplied path, that file's path relative to the Copy's root (`turbo-collection-spec.md` R-SRC-21).

**R-INPLACE-7.** In an In-place Import, Turbo-Collection MUST NOT write, move, rename, modify, or delete a Content file. Turbo-Collection MUST record each Item in the Manifest of that Item's directory, and in an Arrival for that directory (`meta-file-spec.md` R-MFILE-8, R-MFILE-13).

> **Example.** `Taxes/2024/return.pdf` stays at `Taxes/2024/return.pdf` (`as-found-path-layout-spec.md` R-FOUND-2). The only files written are Meta files.

## 5. When an In-place Import runs

**R-INPLACE-8.** Turbo-Collection MUST perform an In-place Import in an Init (`turbo-collection-spec.md` R-CLI-12), and in an Import that an operator starts and that draws from the In-place Import Source. Turbo-Collection MUST NOT perform an In-place Import in any other operation, and MUST NOT perform one as part of a Backup.

> **Example.** A file still being copied into a Copy while a Backup runs is not taken in by that Backup, so no half-written file is recorded with a checksum that a finished file would not match.

## 6. This document's bump test

Required of every normative document by `version-requirement.md` R-PUB-1. This test is measured on
**what is taken in**, because that is what this document decides for a file in a Copy.

| Level     | Test |
| --------- | ---- |
| **MAJOR** | A file this document made an Item would no longer be one, or would be recorded at a different path or under a different identifier, than under the previous version; or an obligation is withdrawn or narrowed; or the document language or obligation vocabulary changes (`version-requirement.md` R-PUB-9). |
| **MINOR** | Additions only. Every file taken in under the previous version stays validly recorded. |
| **PATCH** | Prose improvement that changes no obligation. |
