# Turbo-Collection: Photo Path Layout Specification

> **Version:** 0.1.0-draft
> **Created:** 2026-08-27
> **Status:** Draft. No implementation exists yet.

This document is normative over one **layout convention**: where a photograph or a video is stored
inside a copy. It states which items that convention claims
([`turbo-collection-spec.md`](turbo-collection-spec.md) R-SRC-15), and the directory each claimed
item receives.

It governs **content files** and nothing else. Where a manifest, a receipt, a configuration file, or
a `README.md` sits is stated by the requirements that define each of those, never here.

Requirement ID prefix: **`R-PHOTO-*`**.

---

## 0. Role and scope

This document binds the implementation. It answers one question, for one kind of content: given an
item, which directory does it go in.

It does not decide what a collection holds, which is scope
([`turbo-collection-spec.md`](turbo-collection-spec.md) Section 1), and it does not decide what a
file inside a directory is called, which the `R-NAME-*` family owns. A second layout convention, for
a kind of content this one does not claim, is a second document and changes nothing here.

## 1. Terminology

Per `language-requirement.md` R-LANG-5, this section is self-contained.

- **Collection.** The authoritative tree of files this project preserves.

- **Copy.** The collection, or a mirror of it held elsewhere.

- **Content file.** A photograph or a video held in a copy, as distinct from files that describe a
  copy.

- **Still image.** A content file encoding one photographic image.

- **Motion picture.** A content file encoding a sequence of images for playback over time, with
  or without sound.

- **Item.** One logical thing supplied by an import source, which may comprise several content
  files (a still image and its paired motion clip, for example).

- **Primary file.** The one content file of an item that this document reads to place that whole
  item (R-PHOTO-2).

- **Import source.** One way of getting original bytes into the collection, such as iCloud or a
  camera card. Configuration names each one.

- **Configuration.** Settings a copy carries that state how Turbo-Collection runs against it,
  including which import sources are declared and what each one is called.

- **Run.** A single invocation of Turbo-Collection, which performs its work once and exits.

- **Layout convention.** A rule that determines where in a copy a content file is stored, given that
  file's own bytes, the metadata its import source supplied with it, and that import source.

- **Convention identifier.** The name by which this convention is recorded in a copy:
  **`photo-path-layout`**.

- **Governing timestamp.** The single local wall-clock date and time this document uses to place an
  entire item (R-PHOTO-5, R-PHOTO-6).

- **Local wall-clock time.** A date and time as a clock at the place of capture showed it, carrying
  no time zone and no offset.

- **Capture timestamp.** A date and time a content file states for the moment its content was
  recorded.

- **Source filename.** The name a file carries at its import source at the moment
  Turbo-Collection reads it.

- **Uncertain date.** The state of an item whose governing timestamp was not read from a capture
  timestamp that item itself states (R-PHOTO-8).

- **Collection filename.** The name a content file carries inside a copy.

## 2. What this convention claims

| ID            | Requirement                                                                                                                                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-PHOTO-1** | This convention claims an item whose primary file is a still image or a motion picture. Turbo-Collection MUST decide whether a file is a still image or a motion picture from that file's own bytes, and MUST NOT decide it from a filename extension. |
| **R-PHOTO-2** | Turbo-Collection MUST take as an item's primary file: that item's only content file, where that item holds one; otherwise that item's still image; otherwise that item's motion picture of longest duration. Where two motion pictures are equally long, Turbo-Collection MUST take the one whose SHA-256 checksum is lowest. |

> **Why a claim is decided from bytes.** `turbo-collection-spec.md` R-SRC-15 requires a claim to be
> a condition on an item's own bytes, the metadata its import source supplied, and that import
> source, so that no two runs place one item differently. An extension is a hint a person can edit,
> so reading one would make placement editable after the fact. A scanned document is a still image
> and is therefore claimed here, which is correct: a scan is stored as a photograph, and which
> import source produced it is already a segment of its path (R-PHOTO-3).

> **Why an item has a primary file.** `turbo-collection-spec.md` R-SRC-9 requires a still image and
> its paired motion clip to arrive as one item. Reading each file's own timestamp would split such a
> pair across two directories, because a still and a clip record time differently. One file decides
> for a whole item, and a still is that file because its timestamp is the least ambiguous
> (R-PHOTO-6).

## 3. The directory

| ID            | Requirement                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R-PHOTO-3** | Turbo-Collection MUST store every content file of a claimed item in `<YYYY>/<YYYY>-<MM>/<import source>/`, relative to a copy's root, where `<YYYY>` and `<MM>` state the year and month of that item's governing timestamp, and `<import source>` is the name configuration gives that import source. |
| **R-PHOTO-4** | Turbo-Collection MUST write `<YYYY>` as four digits and `<MM>` as two digits, zero-padded, in the proleptic Gregorian calendar, following ISO 8601 basic format.                                                                                                                                                                                                                                             |
| **R-PHOTO-5** | Turbo-Collection MUST place every content file of one item in one directory, under one governing timestamp.                                                                                                                                                                                                                                                                                                  |

> **Why a month leaf repeats its year.** A leaf named `2026-07` states its own month once it is
> separated from its parent, and `07` alone does not. Directories travel: one gets copied to a
> phone, attached to a message, or restored on its own from a drive that lost its tree. Cost is five
> characters, and benefit is that a stray directory still says what it holds. Lexical sort equals
> chronological sort either way, which R-PHOTO-4's zero padding secures.

> **Why a month, and why nothing finer.** This tree is an index over timestamps files already carry,
> not a system of record, so it can be rebuilt from those files at any time. A photograph that lands
> in an adjacent month is a browsing annoyance rather than data loss. A day granularity would
> multiply directories by thirty for no gain in what a person can find, and grouping by event is not
> this tree's job.

> **Why an import source is a path segment.** It is the one thing about an arrival that a file
> cannot state about itself, and `turbo-collection-spec.md` R-SRC-10 admits it into a path for that
> reason. A photograph reaching the collection by two import sources is two files, which the
> duplicate report handles rather than this document.

## 4. The governing timestamp

| ID            | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-PHOTO-6** | Turbo-Collection MUST determine an item's governing timestamp from its primary file, taking the first of these that is available: a capture timestamp stating local wall-clock time; a capture timestamp stating an instant together with the offset in force at capture, converted to local wall-clock time; a capture timestamp stating an instant with no stated offset, read as local wall-clock time; a date stated in the source filename; that file's modification time at its import source. |
| **R-PHOTO-7** | Turbo-Collection MUST NOT convert a governing timestamp to UTC, and MUST NOT shift it to the time zone of a machine performing a run. A day begins at 00:00:00 local wall-clock time and ends at 23:59:59.999 local wall-clock time.                                                                                                                                                                                                                                                              |
| **R-PHOTO-8** | Turbo-Collection MUST mark an item as having an **uncertain date** when that item's governing timestamp came from a capture timestamp with no stated offset, from a date stated in a source filename, or from a file modification time. Turbo-Collection MUST report every item with an uncertain date, and MUST place that item under its governing timestamp regardless. |

> **Why local, and never UTC.** A photograph's date is the date a person remembers taking it. A
> photograph taken at 21:00 in Helsinki is a July evening to whoever took it, and converting that to
> UTC can file it in a different month. Local wall-clock time is also what a still image already
> records, so using it needs no information a file does not carry, and it is stable: a collection
> rebuilt on a machine in another time zone produces identical directories.

> **Why the ladder is ordered by what a timestamp states rather than by which field holds it.** A
> still image records local wall-clock time directly. A motion picture commonly records an instant,
> which is convertible to local time only when an offset is recorded beside it, and some writers
> record an instant while others record local time in one field. Ordering by what a value states
> rather than by field name keeps this document free of any one vendor's tag names, which belong in
> an import source specification.

> **Why an uncertain date is reported rather than hidden or refused.** Reading an instant with no
> stated offset as wall-clock time is a guess, and so is a date lifted from a filename. Both beat no date, because
> an item still lands somewhere a person can browse to. Neither may pass silently, because a person
> deciding whether to delete an original is entitled to know which dates were inferred. Refusing such
> an item instead would leave it unpreserved, which is the worse failure. Recording uncertainty
> durably, rather than only in a run's report, waits on the meta file specification.

## 5. Filenames

| ID            | Requirement                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-PHOTO-9** | This convention MUST NOT alter a collection filename. A collection filename is governed by the `R-NAME-*` family in [`turbo-collection-spec.md`](turbo-collection-spec.md). |

> **Why naming is not layout's business.** A filename is a label for a human reader, and identity is
> a SHA-256 checksum. Those rules hold for every kind of content, so a second layout convention would
> restate them identically. One home keeps two documents from drifting on one answer.

## 6. Recording this convention

| ID             | Requirement                                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R-PHOTO-10** | Turbo-Collection MUST record the convention identifier `photo-path-layout`, together with this document's version, for every directory it fills under this convention. Which file carries that record, and under which field name, is stated by the requirements that define that file. |

> **Why a directory records this.** A directory separated from its tree must still say which rules
> placed its content, or a reader cannot tell an intentional layout from a mistake. Recording an
> identifier beside a version also lets one collection hold directories written under two versions,
> which is what lets a reader check a migration rather than trust it.

## 7. This document's bump test

Required of every normative document by `version-requirement.md` R-PUB-1. This test is measured on
**directories**, because a directory is what this document puts into a copy.

| Level     | Test                                                                                                                                                                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | An item this convention claims would receive a different directory than it received under the previous version; or this convention stops claiming an item it claimed; or an obligation is withdrawn or narrowed; or the document language or obligation vocabulary changes (`version-requirement.md` R-PUB-9). |
| **MINOR** | Additions only. Every item claimed under the previous version keeps its directory, and every item already placed stays validly placed.                                                                                                                                                                            |
| **PATCH** | Prose improvement that changes no obligation and moves no item.                                                                                                                                                                                                                                                   |

> **Why MAJOR is measured on directories rather than on text.** This document's version is recorded
> in every directory it fills (R-PHOTO-10), and a reader uses that version to answer one question:
> were these files placed under rules I am reading now. A change that moves no item cannot make that
> answer wrong, and a change that moves one item makes it wrong for every directory written before
> it. Claiming a new kind of item is additive, because no item already placed moves.

---

## 8. Change ledger

Required by `version-requirement.md` R-PUB-6. No version has been published yet (R-PUB-3), so the
entry below is informal; a draft carries no obligations and receives no per-ID ledger entries.

| Version     | Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.0-draft | 2026-08-27 | First draft, carrying decisions taken between 2026-07-21 and 2026-08-16 and unblocked by `turbo-collection-spec.md` R-SRC-15. States the claim (R-PHOTO-1, R-PHOTO-2), the directory `<YYYY>/<YYYY>-<MM>/<import source>/` (R-PHOTO-3 to R-PHOTO-5), the governing timestamp and its ladder (R-PHOTO-6 to R-PHOTO-8), the filename boundary (R-PHOTO-9), and how a directory records this convention (R-PHOTO-10). Albums are absent deliberately: grouping is a non-goal, and the Source port cannot report one. |
