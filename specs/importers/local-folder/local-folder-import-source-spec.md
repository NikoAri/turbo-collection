# Turbo-Collection: Import Source Specification, Local Folder

> **Version:** 0.1.0-draft  
> **Created:** 2026-10-06  
> **Status:** Draft.  
> **Layout:** [`supplied-path-layout-spec.md`](../../layouts/supplied-path-layout-spec.md)

This document is normative over **Local-folder Import Source**: a directory of
ordinary files outside whichever Copy is being imported into, reachable as files
from a computer performing a Run. It covers an old archive on a drive, a
download directory, and a directory copied off a retired computer.

Requirement ID prefix: **`R-LOCALFOLDER-*`**.

> **Rationale.** Why this Import Source names Supplied-path Layout:
> [layout-selection decision](../../../docs/decisions/2026-10-03-layout-selection-decision.md).
> Why every file is an Item of its own:
> [one-file-one-item decision](../../../docs/decisions/2026-10-06-one-file-one-item-decision.md).
> Why a Supplied path starts with its Imported directory's own name:
> [local-folder path decision](../../../docs/decisions/2026-10-06-local-folder-path-decision.md).

---

## 0. Role and scope

This document binds Turbo-Collection's implementation. It answers one question:
which files in a directory outside a Copy does an Import take in, and what path
does each one carry into its Collection.

No vendor controls this Import Source, so unlike a specification for a vendor's
service it needs no dated evidence and no expiry: a directory of files is read
through an operating system's ordinary file operations.

## 1. Terminology

Per `language-requirement.md` R-LANG-5, this section is self-contained.

- **Collection.** A set of files this project preserves, held as one or more
  peer Copies.

- **Copy.** One physical instance of a Collection, held on one storage medium;
  Copies are peers.

- **Content file.** Any file a Copy holds that is neither a Meta file nor an
  Ignored file.

- **Meta file.** A file that describes a Copy or what happened to it, such as a
  Manifest or a receipt.

- **Ignored file.** A file in a Copy that matches a pattern in that Copy's
  ignore file.

- **Manifest.** A Meta file that records a checksum for each Content file in one
  directory, and names whichever Layout and Import Source placed that
  directory's content.

- **Import Source.** One way of getting files into a Collection, such as a
  camera card or a directory of existing files.

- **Local-folder Import Source.** This document's Import Source: directories of
  ordinary files outside a Copy, read as files by a computer performing a Run.

- **Imported directory.** A directory, outside every Copy, that one Import from
  Local-folder Import Source reads, together with every directory beneath it.

- **Importer.** A component that brings files into a Collection from one Import
  Source.

- **Import.** Bringing files into a Collection from an Import Source, performed
  by an Importer.

- **Item.** One logical thing supplied by an Import Source, which may comprise
  several files.

- **Layout.** A rule that determines where in a Copy a Content file is stored.

- **Primary Layout.** A single Layout that an Import Source specification names
  to govern that Import Source's Items.

- **Supplied-path Layout.** A Layout that stores a file at whichever path its
  Import Source supplied for it.

- **Supplied path.** A path a file has at its Import Source, relative to a root
  that Import Source's specification states.

- **Run.** A single invocation of Turbo-Collection, which performs its work once
  and exits.

## 2. Identity

**R-LOCALFOLDER-1.** Turbo-Collection MUST identify Local-folder Import Source
as `local-folder` wherever a Meta file records an Import Source
(`meta-file-spec.md` R-MFILE-9). Turbo-Collection MUST treat every Imported
directory as belonging to that one Import Source, and MUST NOT give an Imported
directory an identifier of its own.

> **Example.** Two directories imported on two days are both recorded with
> `"specId": "local-folder"`. Each is stored under its own name
> (R-LOCALFOLDER-6), and neither is an Import Source of its own.

**R-LOCALFOLDER-2.** Turbo-Collection MUST take an Import's Imported directory
from a setting of that Run (`import-spec.md` R-SRC-3). Turbo-Collection MUST
refuse an Imported directory that is a Copy, that is inside a Copy, that
contains a Copy, or that has no name of its own, such as a drive's root.

> **Example.** Importing a directory that is inside a Copy being imported into
> would store each of its files a second time, under `local-folder/`. Importing
> a directory that holds a Copy of another Collection would take in that Copy's
> Meta files as Items.

## 3. Items

**R-LOCALFOLDER-3.** In an Import from Local-folder Import Source,
Turbo-Collection MUST take as an Item every file in its Imported directory, at
any depth, other than a file whose path in whichever Copy is being imported into
would match a pattern in that Copy's ignore file (`meta-file-spec.md`
R-MFILE-21), and other than a file in a directory named `.turbo-collection`.
Turbo-Collection MUST report every such directory it passes over.

> **Example.** A `.DS_Store` in an old archive, which a receiving Copy's ignore
> file matches, is not taken in.

> **Example.** A folder copied out of a Copy holds a `.turbo-collection`
> directory beside its photos. An Import passes over it, reports it, and takes
> in those photos.

**R-LOCALFOLDER-4.** **One file, one Item.** Turbo-Collection MUST take each
file that R-LOCALFOLDER-3 names as an Item of its own, and MUST NOT take two or
more files as one Item.

> **Example.** `IMG_0412.HEIC` and `IMG_0412.MOV` in one directory are two
> Items, each stored at its own Supplied path, so `import-spec.md` R-SRC-9 has
> no Item of several files to keep whole.

## 4. Placement and Supplied path

**R-LOCALFOLDER-5.** Turbo-Collection MUST place every Item of Local-folder
Import Source under Supplied-path Layout
([`supplied-path-layout-spec.md`](../../layouts/supplied-path-layout-spec.md)),
which is this Import Source's Primary Layout (`import-spec.md` R-SRC-15).

**R-LOCALFOLDER-6.** An Importer for Local-folder Import Source MUST supply, as
each file's Supplied path (`import-spec.md` R-SRC-21), that file's path relative
to its Imported directory's parent, so that this Imported directory's own name
is every Supplied path's first segment.

> **Example.** An Imported directory named `moon-laptop` is stored as
> `local-folder/moon-laptop/`, with its own shape beneath. Its file
> `Woodwork/birdhouse/drawing.pdf` has
> `moon-laptop/Woodwork/birdhouse/drawing.pdf` as its Supplied path and is
> stored at `local-folder/moon-laptop/Woodwork/birdhouse/drawing.pdf`
> (`supplied-path-layout-spec.md` R-FOUND-3).

> **Example.** Two Imported directories that share a name share a place in a
> Copy. A file with one path and one content in both is one file. A file whose
> path already holds different content stays out of that Copy's Collection and
> is reported, and that Run exits non-zero (`import-spec.md` R-SRC-23).

## 5. Fidelity

**R-LOCALFOLDER-7.** An Importer for Local-folder Import Source MUST supply
every file with whatever bytes that file has in its Imported directory,
unaltered.

> **Example.** Nothing stands between a file and its Importer that could alter
> it, so whatever best effort `import-spec.md` R-SRC-5 asks of every Importer is
> met in full here.

## 6. This document's bump test

Required of every normative document by `version-requirement.md` R-PUB-1. This
test is measured on **what is taken in and which path it is given**, because
those are what this document decides for a file in an Imported directory.

| Level     | Test                                                                                                                                                                                                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | A file this document made an Item would no longer be one, or would be given a different Supplied path, than under this document's previous version; or an obligation is withdrawn or narrowed; or its document language or obligation vocabulary changes (`version-requirement.md` R-PUB-9). |
| **MINOR** | Additions only. Every file taken in under this document's previous version keeps its Supplied path.                                                                                                                                                                                          |
| **PATCH** | Prose improvement that changes no obligation.                                                                                                                                                                                                                                                |
