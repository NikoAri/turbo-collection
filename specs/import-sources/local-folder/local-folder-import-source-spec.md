# Turbo-Collection: Import Source Specification, Local Folder

> **Version:** 0.1.0-draft
> **Created:** 2026-10-06
> **Status:** Draft. No implementation exists yet.
> **Primary Layout:** [`as-found-path-layout-spec.md`](../../as-found-path-layout-spec.md)

This document is normative over the **Local-folder Import Source**: a directory of ordinary files
outside the Copy being imported into, reachable as files from the computer performing a Run. It
covers an old archive on a drive, a download directory, and a directory copied off a retired
computer. Files already inside a Copy belong to the In-place Import Source
([`in-place-import-source-spec.md`](../in-place/in-place-import-source-spec.md)).

Requirement ID prefix: **`R-LOCALFOLDER-*`**.

> **Rationale.** Why this Import Source names the As-found Layout: [the layout-selection decision](../../../docs/decisions/2026-10-03-layout-selection-decision.md). Why every file is an Item of its own: [the one-file-one-item decision](../../../docs/decisions/2026-10-06-one-file-one-item-decision.md). Why a Supplied path starts with the Imported directory's own name: [the local-folder path decision](../../../docs/decisions/2026-10-06-local-folder-path-decision.md).

---

## 0. Role and scope

This document binds the implementation. It answers one question: which files in a directory outside
a Copy does an Import take in, and what path does each one carry into the Collection.

No vendor controls this Import Source, so unlike a specification for a vendor's service it needs no
dated evidence and no expiry: a directory of files is read through the operating system's ordinary
file operations.

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

- **Import Source.** One way of getting files into the Collection, such as a camera card or a
  directory of existing files.

- **Local-folder Import Source.** The Import Source this document specifies: directories of
  ordinary files outside a Copy, read as files by the computer performing a Run.

- **In-place Import Source.** The Import Source whose Items are the files already inside a Copy that
  no Manifest of that Copy lists, identified as `in-place`.

- **Imported directory.** The directory, outside the Copy being imported into, that one Import from
  the Local-folder Import Source reads, together with every directory beneath it.

- **Importer.** The component that brings files into the Collection from one Import Source.

- **Import.** Bringing files into the Collection from an Import Source, performed by an Importer.

- **Item.** One logical thing supplied by an Import Source, which may comprise several files.

- **Layout.** A rule that determines where in a Copy a Content file is stored.

- **Primary Layout.** The one Layout that an Import Source specification names to govern that
  Import Source's Items.

- **As-found Layout.** The Layout that stores a file at the path its Import Source supplied for it.

- **Supplied path.** The path a file has at its Import Source, relative to a root that Import
  Source's specification states.

- **Run.** A single invocation of Turbo-Collection, which performs its work once and exits.

## 2. Identity

**R-LOCALFOLDER-1.** Turbo-Collection MUST identify the Local-folder Import Source as `local-folder` wherever a Meta file records an Import Source (`meta-file-spec.md` R-MFILE-9). Turbo-Collection MUST treat every Imported directory as belonging to that one Import Source, and MUST NOT give an Imported directory an identifier of its own.

> **Example.** Two directories imported on two days are both recorded with `"specId": "local-folder"`. Each is stored under its own name (R-LOCALFOLDER-6), and neither is an Import Source of its own.

**R-LOCALFOLDER-2.** Turbo-Collection MUST take the Imported directory of an Import from a setting of that Run (`turbo-collection-spec.md` R-SRC-3). Turbo-Collection MUST refuse an Imported directory that is inside the Copy being imported into, that contains that Copy, or that has no name of its own, such as the root of a drive.

> **Example.** Files already inside a Copy belong to the In-place Import Source, which records them where they sit. Importing them as a local folder would store each one a second time, under `local-folder/`.

## 3. Items

**R-LOCALFOLDER-3.** In an Import from the Local-folder Import Source, Turbo-Collection MUST take as an Item every file in the Imported directory, at any depth, other than a file whose path in the Copy being imported into would match a pattern in that Copy's ignore file (`meta-file-spec.md` R-MFILE-21).

> **Example.** A `.DS_Store` in an old archive, matching the Copy's ignore file, is not taken in, and the Run counts it under the pattern it matched.

**R-LOCALFOLDER-4.** **One file, one Item.** Turbo-Collection MUST take each file that R-LOCALFOLDER-3 names as an Item of its own, and MUST NOT take two or more files as one Item.

> **Example.** `IMG_0412.HEIC` and `IMG_0412.MOV` in one directory are two Items, each stored at its own Supplied path, so `turbo-collection-spec.md` R-SRC-9 has no Item of several files to keep whole.

## 4. Placement and Supplied path

**R-LOCALFOLDER-5.** Turbo-Collection MUST place every Item of the Local-folder Import Source under the As-found Layout ([`as-found-path-layout-spec.md`](../../as-found-path-layout-spec.md)), which is this Import Source's Primary Layout (`turbo-collection-spec.md` R-SRC-15).

**R-LOCALFOLDER-6.** An Importer for the Local-folder Import Source MUST supply, as each file's Supplied path (`turbo-collection-spec.md` R-SRC-21), that file's path relative to the parent of the Imported directory, so that the Imported directory's own name is the first segment of every Supplied path.

> **Example.** An Imported directory named `old-laptop` is stored as `local-folder/old-laptop/`, with its own shape beneath. Its file `Woodwork/birdhouse/drawing.pdf` has the Supplied path `old-laptop/Woodwork/birdhouse/drawing.pdf` and is stored at `local-folder/old-laptop/Woodwork/birdhouse/drawing.pdf` (`as-found-path-layout-spec.md` R-FOUND-3).

> **Example.** Two Imported directories that share a name share a place in a Copy. A file with one path and one content in both is one file. A file whose path already holds different content stays out of the Collection and is reported, and the Run exits non-zero (`turbo-collection-spec.md` R-SRC-23).

## 5. Fidelity

**R-LOCALFOLDER-7.** An Importer for the Local-folder Import Source MUST supply every file with the bytes that file has in the Imported directory, unaltered.

> **Example.** Nothing stands between a file and the Importer that could alter it, so the best effort `turbo-collection-spec.md` R-SRC-5 asks of every Importer is met in full here.

## 6. This document's bump test

Required of every normative document by `version-requirement.md` R-PUB-1. This test is measured on
**what is taken in and the path it is given**, because those are what this document decides for a
file in an Imported directory.

| Level     | Test |
| --------- | ---- |
| **MAJOR** | A file this document made an Item would no longer be one, or would be given a different Supplied path, than under the previous version; or an obligation is withdrawn or narrowed; or the document language or obligation vocabulary changes (`version-requirement.md` R-PUB-9). |
| **MINOR** | Additions only. Every file taken in under the previous version keeps its Supplied path. |
| **PATCH** | Prose improvement that changes no obligation. |
