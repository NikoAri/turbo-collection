# Turbo-Collection: Import Source Specification, Local Folder

> **Version:** 0.1.0-draft
> **Created:** 2026-10-06
> **Status:** Stub. States this import source's primary layout and its supplied path. No numbered requirements yet.
> **Primary layout:** [`as-found-path-layout-spec.md`](../../as-found-path-layout-spec.md)

This document is normative over the **local-folder import source**: a directory of ordinary files,
reachable as files from the computer performing a run. It covers an old archive on a drive, a
download directory, a directory copied off a retired computer, and the files already inside a
directory that the init operation makes a copy.

Requirement ID prefix: **not yet assigned.** It MUST NOT be `R-SRC-*`, which
[`turbo-collection-spec.md`](../../turbo-collection-spec.md) already owns for import.

> **Rationale.** Why files already in a directory are taken in where they sit, and why this import source names the as-found layout: [the copy-creation decision](../../../docs/decisions/2026-09-30-copy-creation-decision.md) and [the layout-selection decision](../../../docs/decisions/2026-10-03-layout-selection-decision.md).

---

## 0. Role and scope

This document binds the implementation. No vendor controls this import source, so unlike a
specification for a vendor's service it needs no dated evidence and no expiry: a directory of files
is read through the operating system's ordinary file operations.

An import source is an instance, named by the operator. Two directories imported separately are two
import sources of this kind, each with its own name.

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

The supplied path R-SRC-21 requires is a file's path relative to the directory imported from. In an
adoption (R-CLI-12) that directory is the directory being made a copy, so an adopted file's supplied
path is the path it already has in that copy, and the file does not move.

## 4. Fidelity

Placeholder. An importer for this import source reads each file's bytes unaltered, which is what
R-SRC-5 asks. What remains to state is how R-SRC-6 and R-SRC-19 apply where nothing stands between
the original and the importer that could degrade it, and so nothing separate exists to verify
delivered bytes against.

## 5. This document's bump test

Placeholder. Required of every normative document by `version-requirement.md` R-PUB-1.
