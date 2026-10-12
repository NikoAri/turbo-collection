# Turbo-Collection: Photo Path Layout Specification

> **Version:** 0.1.0-draft  
> **Created:** 2026-08-27  
> **Status:** Draft. No implementation exists yet.

This document is normative over one **Layout**: where a photograph or a video is
stored inside a copy. It states which items that Layout is able to place
([`turbo-collection-spec.md`](turbo-collection-spec.md) R-SRC-15), and the
directory each such item receives.

It governs **content files** and nothing else. Where a manifest, a receipt, or a
configuration file sits is stated by the requirements that define each of those,
never here.

Requirement ID prefix: **`R-PHOTO-*`**.

> **Rationale.** Why items are placed by local-time month and by import source,
> and the alternatives weighed:
> [the import-source decision](../docs/decisions/2026-08-22-import-source-decision.md),
> [the layout-conventions decision](../docs/decisions/2026-08-01-layout-conventions-decision.md),
> and [design-record](../docs/design-record.md). Why an import source, not this
> document, selects which items come here:
> [the layout-selection decision](../docs/decisions/2026-10-03-layout-selection-decision.md).

---

## 0. Role and scope

This document binds the implementation. It answers one question, for one kind of
content: given an item, which directory does it go in.

It does not decide what a collection holds, which is scope
([`turbo-collection-spec.md`](turbo-collection-spec.md) Section 1), and it does
not decide what a file inside a directory is called, which the `R-NAME-*` family
owns. It also does not decide which items are sent to it: an import source
specification names its primary layout (`turbo-collection-spec.md` R-SRC-15),
and this document states only what this Layout is able to place once an item
arrives. A second Layout, for a kind of content this one does not place, is a
second document and changes nothing here.

## 1. Terminology

Per `language-requirement.md` R-LANG-5, this section is self-contained.

- **Collection.** The set of files this project preserves, held as one or more
  peer copies.

- **Copy.** One physical instance of the collection, held on one storage medium;
  copies are peers.

- **Content file.** Any file a copy holds that is neither a meta file nor an
  ignored file. This Layout places photographs and videos (R-PHOTO-1).

- **Meta file.** A file that describes a copy or what happened to it, such as a
  manifest or a receipt.

- **Ignored file.** A file in a copy that matches a pattern in that copy's
  ignore file.

- **Still image.** A content file encoding one photographic image.

- **Motion picture.** A content file encoding a sequence of images for playback
  over time, with or without sound.

- **Item.** One logical thing supplied by an import source, which may comprise
  several content files (a still image and its paired motion clip, for example).

- **Primary file.** The one content file of an item that this document reads to
  place that whole item (R-PHOTO-2).

- **Import source.** One way of getting files into the collection, such as
  iCloud or a camera card. An import source is an instance, named by the
  operator; a leaf manifest records which one placed a directory
  (`meta-file-spec.md` R-MFILE-9).

- **Run.** A single invocation of Turbo-Collection, which performs its work once
  and exits.

- **Layout.** A rule that determines where in a copy a content file is stored,
  given that file's own bytes, the metadata its import source supplied with it,
  and that import source.

- **Layout identifier.** The name by which this Layout is recorded in a copy:
  **`photo-path-layout`**.

- **Governing timestamp.** The single local wall-clock date and time this
  document uses to place an entire item (R-PHOTO-5, R-PHOTO-6).

- **Local wall-clock time.** A date and time as a clock at the place of capture
  showed it, carrying no time zone and no offset.

- **Capture timestamp.** A date and time a content file states for the moment
  its content was recorded.

- **Supplied filename.** The name a file carries at its import source at the
  moment Turbo-Collection reads it.

- **Uncertain date.** The state of an item whose governing timestamp was not
  read from a capture timestamp that item itself states (R-PHOTO-8).

- **Collection filename.** The name a content file carries inside a copy.

## 2. What this Layout places

**R-PHOTO-1.** This Layout is able to place an item whose primary file is a
still image or a motion picture, and no other item. Turbo-Collection MUST decide
whether a file is a still image or a motion picture from that file's own bytes,
and MUST NOT decide it from a filename extension.

> **Example.** A file renamed `.txt` is still placed as the still image its
> bytes show it to be. An item this Layout is not able to place is not skipped:
> it goes to the as-found layout (`turbo-collection-spec.md` R-SRC-20).

**R-PHOTO-2.** Turbo-Collection MUST take as an item's primary file: that item's
only content file, where that item holds one; otherwise that item's still image;
otherwise that item's motion picture of longest duration. Where two motion
pictures are equally long, Turbo-Collection MUST take the one whose SHA-256
checksum is lowest.

## 3. The directory

**R-PHOTO-3.** Turbo-Collection MUST store every content file of an item this
Layout places in `<YYYY>/<YYYY>-<MM>/<import source>/`, relative to a copy's
root, where `<YYYY>` and `<MM>` state the year and month of that item's
governing timestamp, and `<import source>` is the import source's identifier,
recorded as `importSource.specId` in that directory's manifest
(`meta-file-spec.md` R-MFILE-9).

**R-PHOTO-4.** Turbo-Collection MUST write `<YYYY>` as four digits and `<MM>` as
two digits, zero-padded, in the proleptic Gregorian calendar, following ISO 8601
basic format.

**R-PHOTO-5.** Turbo-Collection MUST place every content file of one item in one
directory, under one governing timestamp.

## 4. The governing timestamp

**R-PHOTO-6.** Turbo-Collection MUST determine an item's governing timestamp
from its primary file, taking the first of these that is available: a capture
timestamp stating local wall-clock time; a capture timestamp stating an instant
together with the offset in force at capture, converted to local wall-clock
time; a capture timestamp stating an instant with no stated offset, read as
local wall-clock time; a date stated in the Supplied filename; that file's
modification time at its import source.

**R-PHOTO-7.** Turbo-Collection MUST NOT convert a governing timestamp to UTC,
and MUST NOT shift it to the time zone of a machine performing a run. A day
begins at 00:00:00 local wall-clock time and ends at 23:59:59.999 local
wall-clock time.

> **Example.** A 21:00 Helsinki photo is filed by local time, not shifted to UTC
> where it could fall in a different month.

**R-PHOTO-8.** Turbo-Collection MUST mark an item as having an **uncertain
date** when that item's governing timestamp came from a capture timestamp with
no stated offset, from a date stated in a Supplied filename, or from a file
modification time. Turbo-Collection MUST report every item with an uncertain
date, and MUST place that item under its governing timestamp regardless.

> **Example.** An item dated only from its filename is placed and flagged
> uncertain, never refused, which would leave it unpreserved.

## 5. Filenames

**R-PHOTO-9.** This Layout MUST NOT alter a collection filename. A collection
filename is governed by the `R-NAME-*` family in
[`turbo-collection-spec.md`](turbo-collection-spec.md).

## 6. Recording this Layout

**R-PHOTO-10.** Turbo-Collection MUST record the Layout identifier
`photo-path-layout`, together with this document's version, for every directory
it fills under this Layout. Which file carries that record, and under which
field name, is stated by the requirements that define that file.

## 7. This document's bump test

Required of every normative document by `version-requirement.md` R-PUB-1. This
test is measured on **directories**, because a directory is what this document
puts into a copy.

| Level     | Test                                                                                                                                                                                                                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | An item this Layout places would receive a different directory than it received under the previous version; or this Layout stops placing an item it placed; or an obligation is withdrawn or narrowed; or the document language or obligation vocabulary changes (`version-requirement.md` R-PUB-9). |
| **MINOR** | Additions only. Every item placed under the previous version keeps its directory, and every item already placed stays validly placed.                                                                                                                                                                |
| **PATCH** | Prose improvement that changes no obligation and moves no item.                                                                                                                                                                                                                                      |
