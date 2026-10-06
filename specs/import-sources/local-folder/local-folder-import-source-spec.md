# Turbo-Collection: Import Source Specification, Local Folder

> **Version:** 0.1.0-draft
> **Created:** 2026-10-06
> **Status:** Stub. States this import source's primary layout and its supplied path. No numbered requirements yet.
> **Primary layout:** [`as-found-path-layout-spec.md`](../../as-found-path-layout-spec.md)

This document is normative over the **local-folder import source**: a directory of ordinary files
outside the Copy being imported into, reachable as files from the computer performing a run. It
covers an old archive on a drive, a download directory, and a directory copied off a retired
computer. Files already inside a Copy belong to the in-place Import Source
([`in-place-import-source-spec.md`](../in-place/in-place-import-source-spec.md)).

Requirement ID prefix: **not yet assigned.** It MUST NOT be `R-SRC-*`, which
[`turbo-collection-spec.md`](../../turbo-collection-spec.md) already owns for import.

> **Rationale.** Why this import source names the as-found layout: [the layout-selection decision](../../../docs/decisions/2026-10-03-layout-selection-decision.md).

---

## 0. Role and scope

This document binds the implementation. No vendor controls this import source, so unlike a
specification for a vendor's service it needs no dated evidence and no expiry: a directory of files
is read through the operating system's ordinary file operations.

This is one Import Source, however many directories are imported through it. Its identifier is
**`local-folder`**: a manifest records it as `importSource.specId` (`meta-file-spec.md` R-MFILE-9),
and it names the directory its files are stored under (`as-found-path-layout-spec.md` R-FOUND-3).
Which directory a run reads is a setting of that run, supplied as data
(`turbo-collection-spec.md` R-SRC-3), and is not a second Import Source.

## 1. Terminology

Placeholder. Per `language-requirement.md` R-LANG-5, this section must be self-contained and must
not defer any definition to another document.

## 2. Items

Every file in the directory imported from, and in each directory beneath it, is one item, apart from
a file the destination copy ignores (`meta-file-spec.md` R-MFILE-21).

Placeholder: whether files that are semantically one thing, such as a still image beside its paired
motion clip, form one item here (`turbo-collection-spec.md` R-SRC-9), and how a pairing is
recognized without a vendor to state it.

## 3. Layout and supplied path

This import source's primary layout is the as-found layout,
[`as-found-path-layout-spec.md`](../../as-found-path-layout-spec.md), as
[`turbo-collection-spec.md`](../../turbo-collection-spec.md) R-SRC-15 requires each import source
specification to name one.

The supplied path R-SRC-21 requires is a file's path relative to the parent of the directory
imported from, so that directory's own name is the first segment of every supplied path. A directory
named `old-laptop` is therefore stored as `local-folder/old-laptop/`, with its own shape beneath.

## 4. Fidelity

An importer for this import source reads each file's bytes unaltered, which is the best effort
R-SRC-5 asks. Nothing stands between a file and the importer that could alter it.

## 5. This document's bump test

Placeholder. Required of every normative document by `version-requirement.md` R-PUB-1.
