# Turbo-Collection: Meta File Specification

> **Version:** 0.1.0-draft  
> **Created:** 2026-08-27  
> **Status:** Draft.

This document is normative over **meta files**: files a TC Copy holds that
describe it or what happened to it, rather than content it preserves. It states
what each one is called, where it sits, and what is inside it.

It governs meta files entirely and content files not at all. Where a content
file goes is stated by a layout specification, such as
[`photo-path-layout-spec.md`](layouts/photo-path-layout-spec.md) or
[`supplied-path-layout-spec.md`](layouts/supplied-path-layout-spec.md).

**This document's version is meta files' format version.** Every meta file
states it, and a MAJOR version of this document is a change of meta file format
by construction, because this document contains nothing else to break.

Requirement ID prefix: **`R-MFILE-*`**.

> **Rationale.** Why meta files are shaped this way, and alternatives weighed:
> [manifest-format decision](../docs/decisions/2026-08-16-manifest-format-decision.md),
> [receipts decision](../docs/decisions/2026-09-07-receipts-decision.md),
> [location-receipt decision](../docs/decisions/2026-09-10-location-receipt-decision.md),
> [config-placement decision](../docs/decisions/2026-09-27-config-placement-decision.md),
> [collection-naming decision](../docs/decisions/2026-10-25-collection-naming-decision.md),
> and [design-record](../docs/design-record.md).

---

## 0. Role and scope

This document binds Turbo-Collection's implementation. It answers one question:
given something Turbo-Collection must write down, what does that file look like.

It does not state **when** Turbo-Collection writes one, or what it may do
afterward. Writing an arrival only after its content is written, never altering
a receipt file once it is written, and refusing to treat a receipt as evidence a
TC Copy still exists are behavior, and they stay in
[`verify-spec.md`](verify-spec.md).

## 1. Terminology

Per `language-requirement.md` R-LANG-5, this section is self-contained.

- **Collection.** A set of files this project preserves, held as one or more
  peer TC Copies.

- **TC Copy.** One physical instance of a collection, held on one storage
  medium; TC stands for Turbo-Collection. TC Copies are peers; none is
  privileged.

- **TC Directory.** A TC Copy's root directory, which holds every file of that
  TC Copy.

- **Content file.** Any file a TC Copy holds outside its `.turbo-collection/`
  directories that is neither a meta file nor an ignored file, preserved
  untouched.

- **Meta file.** A file that describes a TC Copy or what happened to it: a
  manifest, a receipt, a configuration file, an ignore file, and any copy of a
  specification carried on a drive.

- **Item.** One logical thing supplied by an import source, which may comprise
  several content files.

- **Import source.** One way of getting files into a collection, such as iCloud
  or a camera card. An import source is an instance, named by an operator
  (`icloud-personal`); a leaf manifest records which one placed a directory
  (R-MFILE-9).

- **Layout.** A rule that determines where in a TC Copy a content file is
  stored. Each layout is defined by its own specification, which declares that
  layout's identifier and carries a version (R-MFILE-9).

- **Manifest.** A meta file recording a checksum for each file in one directory
  (R-MFILE-8).

- **Receipt.** A record of every arrival of a directory's content at a TC Copy
  and every error affecting it, written as one file per event (R-MFILE-13).

- **Arrival.** One event of a directory's content reaching one TC Copy.

- **Error.** One event of content a run handled failing to reach a TC Copy: an
  item an import source offered that Turbo-Collection did not take, or a content
  file that failed to reach a TC Copy it was being mirrored into.

- **Fixity.** Evidence that data has not changed, established by comparing
  checksums.

- **Content digest.** A checksum over SHA-256 checksums of a directory's content
  files, taken in ascending order of those checksums (R-MFILE-15).

- **Format version.** This document's version, which every meta file states
  (R-MFILE-4).

- **Ignored file.** A file in a TC Copy that matches a pattern in that TC Copy's
  ignore file (R-MFILE-20).

- **Run.** A single invocation of Turbo-Collection, which performs its work once
  and exits.

## 2. Naming and placement

**R-MFILE-1.** A meta file's format MUST be determinable from that file's name
alone, without reading its content. Turbo-Collection MUST NOT read a meta file
whose name it does not recognize, and MUST report such a file instead.

**R-MFILE-2.** Turbo-Collection MUST use these names and places, relative to a
TC Directory: `.tcignore` in that TC Directory; a `.turbo-collection/`
subdirectory of that TC Directory holding a configuration file named
`turbo-collection-config.json` and per-event location receipt files named
`receipt-<runId>-<tcCopyName>.location.json` (R-MFILE-26); and, for each
directory holding content, a `.turbo-collection/` subdirectory of that directory
holding a manifest named `manifest.json` and per-event receipt files named
`receipt-<runId>-<tcCopyName>.arrival.json` and
`receipt-<runId>-<tcCopyName>.error.json`. A carried copy of a specification
MUST be named for its document and for its text's full version.

## 3. Rules for every JSON meta file

**R-MFILE-3.** A JSON meta file MUST be a JSON document as defined by RFC 8259,
encoded in UTF-8.

**R-MFILE-4.** A JSON meta file MUST contain a `version` field, stating which
version of this document that file was written under. Turbo-Collection MUST NOT
rename that field while meta files are JSON.

**R-MFILE-5.** Turbo-Collection MUST ignore a field it does not recognize, and
MUST preserve every such field verbatim when it rewrites a meta file.

> **Example.** Rewriting a manifest, Turbo-Collection keeps fields it does not
> recognize, so a newer writer's data is not silently dropped.

**R-MFILE-6.** **Self-evidence.** A meta file MUST be intelligible by inspection
alone, without whichever document version produced it. A version is a
disambiguator, and MUST NOT be a meta file's only key to decoding.

> **Example.** A binary or opaque-header format is forbidden: a stranger must be
> able to figure a meta file out by looking at it.

**R-MFILE-7.** Turbo-Collection MUST NOT reinterpret a meta file whose stated
version it does not recognize, a JSON meta file that is not a JSON document
(R-MFILE-3), or a meta file that lacks a field this document requires of it. A
Run that reads such a meta file MUST end with an error, and MUST NOT guess.

> **Example.** A manifest cut short by a drive pulled out mid-write is not JSON,
> so whichever run next reads it ends with an error naming it.

**R-MFILE-27.** A JSON meta file MUST be written across multiple lines rather
than minified, placing each field and each array element on its own line, so a
person can read it by inspection (R-MFILE-6). No other aspect of formatting is
constrained: indentation, spacing, and a trailing newline are for its writer to
choose.

## 4. Manifest

**R-MFILE-8.** Turbo-Collection MUST record a SHA-256 checksum for every content
file in a directory, in a manifest stored in that directory's
`.turbo-collection/` subdirectory and named `manifest.json`. A manifest MUST
cover content files of whichever directory it describes, and MUST NOT cover a
subdirectory, which excludes both a nested content directory and a
`.turbo-collection/` directory where meta files sit. A directory holding no
content file needs no manifest. A manifest MUST NOT cover an ignored file.

**R-MFILE-9.** A manifest's fields MUST be:

- `version` (R-MFILE-4)
- `layout`, an object with:
  - `specId`, an identifier of whichever layout placed that directory's content,
    as that layout's specification declares it
  - `version`, that specification's version
- `importSource`, an object with:
  - `specId`, whatever identifier its import source's specification declares
  - `version`, whichever version of that specification governs that directory
- `checksumAlgorithm`, stating which algorithm its checksums were computed with,
  as `SHA-256` (R-MFILE-8)
- `files`, an array holding one object per covered file

**R-MFILE-10.** Each entry in `files` MUST state, in fields of these names: that
file's name (`file`), that file's length in bytes (`size`), and that file's
checksum (`checksum`). A `file` field MUST state a name only, MUST NOT state a
path, and MUST preserve that name's casing exactly as stored. A `checksum` MUST
be lowercase hexadecimal.

**R-MFILE-11.** An entry MAY also state a `date`, a time its import source
associates with that file. That import source sets that value and defines its
meaning, and Turbo-Collection MUST NOT interpret it. A `date` MUST be an ISO
8601 calendar date and time (`YYYY-MM-DDThh:mm:ss`), carrying a UTC offset when
that import source supplies a time zone and omitting it, as a bare local date
and time, when it does not. An import source MUST NOT set a `date` from a
filesystem timestamp. Turbo-Collection MUST omit that field where that import
source associates no time with that file.

**R-MFILE-12.** Entries in `files` MUST be ordered by their `file` name using a
case-insensitive comparison: compare names with ASCII letters `A` through `Z`
folded to lowercase and ordered by Unicode code point, and where two names are
equal under that folding, order them by their unfolded names, by Unicode code
point. This ordering MUST NOT depend on a locale, so that every implementation
writes an identical manifest.

## 5. Receipt

**R-MFILE-13.** Turbo-Collection MUST maintain a receipt in every directory into
which it writes a content file, and in every directory in which it recorded an
error affecting that directory's content. A receipt is a set of per-event files,
each stored in that directory's `.turbo-collection/` subdirectory: one file per
arrival, named `receipt-<runId>-<tcCopyName>.arrival.json`, and, per run that
recorded any error for that directory, one file named
`receipt-<runId>-<tcCopyName>.error.json`. `<runId>` identifies its run and MUST
be an ISO 8601 basic-format instant in UTC and whole seconds (for example
`20260814T180422Z`), followed by `-` and four lower-case hexadecimal digits
chosen at random, so it contains no character illegal in a filename and orders
files by when their run occurred (`photo-path-layout-spec.md` R-PHOTO-4 uses
that basic format too). `<tcCopyName>` names whichever TC Copy its run wrote to,
or attempted to write to, for that event (R-MFILE-19), and appears in a receipt
file's name so that files two TC Copies author in one run cannot collide;
R-MFILE-19 limits `tcCopyName`, for this reason, to characters that common
filesystems accept in a filename. An event's named TC Copy is not always where
its file resides: propagation places a TC Copy's receipt files on other TC
Copies (`verify-spec.md` R-REC-6), and a mirror error names a destination TC
Copy that failed, which often cannot hold that file, so Turbo-Collection MUST
record a mirror error in an error file on whichever TC Copy it is mirroring
from, beside whatever content that failed transfer was driving from. A receipt
MUST record every arrival of that directory's content at a TC Copy and every
error. Turbo-Collection MUST NOT modify or delete a receipt file after writing
it.

**R-MFILE-14.** An arrival file MUST contain one arrival. Its fields MUST be:

- `version` (R-MFILE-4)
- `tcSpecVersion`, stating which version of `turbo-collection-spec.md` its run
  conformed to
- `runId`, identifying whichever run wrote that file
- `tcCopyName`, naming whichever TC Copy that content reached
- `date`, a date and time at which it was reached
- `fileCount`, how many content files were present in that directory at that
  moment
- `contentDigest`, a content digest over them (R-MFILE-15)
- where that arrival newly acquired its content from an import source, `layout`,
  `importSource`, and optionally `importSourceDetails` (R-MFILE-15)

A `date` MUST be a full ISO 8601 calendar date and time (`YYYY-MM-DDThh:mm:ss`)
carrying a time-zone offset (`Z` for UTC, or `±hh:mm`); Turbo-Collection records
it from its run's own clock, so unlike an import source's `date` (R-MFILE-11)
its offset is never omitted.

**R-MFILE-15.** An arrival records how content reached a TC Copy, and its two
ways differ. An arrival that newly acquired content from an import source (an
import) MUST carry `layout` and `importSource`, and MAY carry
`importSourceDetails`. An arrival that propagated content already held by
another TC Copy (a mirror) MUST carry neither `layout` nor `importSource`,
because it acquired nothing from outside and applied no layout; its provenance
is whichever import arrival placed that content, which travels to it
(`verify-spec.md` R-REC-6). `layout` MUST be an object stating that layout's
identifier (`specId`) and its specification's `version`; `importSource` MUST be
an object stating its import source specification's identifier (`specId`) and
whichever `version` of that specification its run conformed to. An
`importSourceDetails` value MUST be a JSON object whose contents that import
source's own specification states, and Turbo-Collection MUST NOT depend on its
contents. A content digest MUST cover content files only, so that no meta file
contributes to it. A `contentDigest` MUST be computed as SHA-256 of a text
formed by taking each content file's SHA-256 checksum as lowercase hexadecimal,
ordering those checksums in ascending Unicode code point order, and joining them
with a single newline (`U+000A`) between each.

**R-MFILE-16.** An error file MUST contain every error a run recorded for its
directory. Its fields MUST be:

- `version` (R-MFILE-4)
- `tcSpecVersion`
- `runId`
- `tcCopyName`, naming whichever TC Copy its run wrote to or attempted to write
  to
- `importErrors`, an array holding one object per import error: content that run
  could not place in its collection
- `mirrorErrors`, an array holding one object per mirror error: content already
  in its collection that run could not propagate to another TC Copy

An error file holds at least one error across both arrays (R-MFILE-13 writes one
only when a run recorded an error), and MAY omit an array that holds none. Every
error object, of either kind, MUST state a human-readable description of what
went wrong (`message`), in plain language and intelligible without whichever
software produced it (R-MFILE-6); that `message` is best-effort and MAY be
incomplete. An error object MAY carry further fields that whichever piece
produces it defines; what each kind records beyond `message` is specified later,
as real errors show what is needed.

> **Example.** Three per-event files in one directory's `.turbo-collection/`. An
> import arrival, in `receipt-20260814T180422Z-3f9a-main.arrival.json`, records
> which specifications placed that content:
>
> ```json
> {
>   "version": "0.1.0-draft",
>   "tcSpecVersion": "0.1.0-draft",
>   "runId": "20260814T180422Z-3f9a",
>   "tcCopyName": "main",
>   "date": "2026-08-14T18:04:22Z",
>   "fileCount": 412,
>   "contentDigest": "9f2a1c...",
>   "layout": { "specId": "photo-path-layout", "version": "0.1.0" },
>   "importSource": { "specId": "icloud", "version": "0.1.0" }
> }
> ```
>
> A later mirror arrival of that content to another TC Copy, in
> `receipt-20260902T090500Z-b1d2-off-site.arrival.json`, names no `layout` or
> `importSource`; its matching `contentDigest` proves identical content arrived:
>
> ```json
> {
>   "version": "0.1.0-draft",
>   "tcSpecVersion": "0.1.0-draft",
>   "runId": "20260902T090500Z-b1d2",
>   "tcCopyName": "off-site",
>   "date": "2026-09-02T09:05:00Z",
>   "fileCount": 412,
>   "contentDigest": "9f2a1c..."
> }
> ```
>
> An error file, `receipt-20260814T180422Z-3f9a-main.error.json`, holds that
> run's errors for that directory:
>
> ```json
> {
>   "version": "0.1.0-draft",
>   "tcSpecVersion": "0.1.0-draft",
>   "runId": "20260814T180422Z-3f9a",
>   "tcCopyName": "main",
>   "importErrors": [
>     {
>       "message": "icloud delivered IMG_0001.HEIC only inside a container that could not be unpacked; refused (import-spec.md R-SRC-5)"
>     }
>   ]
> }
> ```

**R-MFILE-26.** A location receipt records where a TC Copy is, as a hint for
finding it, and states that TC Copy's own location, never another's.
Turbo-Collection MUST store it in its TC Directory's `.turbo-collection/`
subdirectory (R-MFILE-2), one file per observation named
`receipt-<runId>-<tcCopyName>.location.json`, and MUST NOT modify or delete it
once written, as with every receipt file (R-MFILE-13). Its fields MUST be:

- `version` (R-MFILE-4)
- `tcSpecVersion`
- `runId`
- `tcCopyName`, naming whichever TC Copy this locates
- `date`, when that location was observed, written as an arrival's `date` is
  (R-MFILE-14)
- an optional `volumeId`, an identifier that this TC Copy's volume carries
  across machines, where a `null` value is equivalent to an absent one and both
  mean this TC Copy is located by `relativePath` alone
- `relativePath`, a path to this TC Copy's TC Directory that MUST be relative
  and MUST NOT be absolute

When `volumeId` is present, `relativePath` is relative to that volume's root;
when it is absent, `relativePath` is relative to this location receipt file's
own directory. `relativePath` MUST be written separator-neutral, joining
segments with `/` rather than any one filesystem's separator. Turbo-Collection
MUST treat `volumeId` as opaque, comparing it only for equality and never
parsing or validating its form, because its shape differs from one filesystem to
another (`verify-spec.md` R-REC-9).

## 6. Configuration and ignore file

**R-MFILE-17.** Configuration MUST be plain data in a text format a person can
read and edit, and that a tool other than Turbo-Collection can parse. It MUST be
named `turbo-collection-config.json` and MUST sit in its TC Directory's
`.turbo-collection/` subdirectory (R-MFILE-2).

**R-MFILE-18.** A configuration file's fields MUST be: `version` (R-MFILE-4);
`collectionId`, identifying which Collection this TC Copy belongs to;
`collectionName`, stating that Collection's name; and `tcCopyName`, stating what
name Receipts use for this TC Copy. `collectionId` MUST be a version 4 UUID
(RFC 9562) in its text form, with every letter in lower case, because a random
identifier tells two Collections apart where their `collectionName` values
match. `collectionName` and `tcCopyName` MUST be non-empty. Configuration states
a TC Copy's own identity and nothing about other TC Copies: it declares no role
and no roster of TC Copies expected to exist, since TC Copies are peers and are
discovered at run time.

> **Example.** A configuration file for a TC Copy named `off-site`, in a
> Collection named `Family Photos`:
>
> ```json
> {
>   "version": "0.1.0-draft",
>   "collectionId": "3f2a9c1e-5b7d-4e8a-9c2f-1d6b8e4a7c30",
>   "collectionName": "Family Photos",
>   "tcCopyName": "off-site"
> }
> ```

**R-MFILE-19.** Every TC Copy MUST declare its own identity in its own
configuration file. When **init** or **backup** creates a TC Copy,
Turbo-Collection MUST set that TC Copy's `collectionId`, `collectionName` and
`tcCopyName` once, at creation, as `init-spec.md` R-INIT-4 and `backup-spec.md`
R-BACKUP-1 state, and MUST write them into that TC Copy's configuration file.
Turbo-Collection MUST give a TC Copy that a backup creates that backup's
existing TC Copy's `collectionId` and `collectionName`, so that all TC Copies of
a Collection hold one `collectionId` and one `collectionName`. Thereafter
Turbo-Collection MUST determine a TC Copy's identity by reading that
declaration, and MUST NOT infer it from a volume label, a mount path, a drive
letter, or a command-line argument. `tcCopyName` MUST be in Unicode
Normalization Form C (NFC), and MUST NOT contain a control character (Unicode
general category Cc) or any of `< > : " / \ | ? *`, because it appears verbatim
in Receipt filenames (R-MFILE-13). Turbo-Collection MUST refuse an entire Run
when two connected TC Copies state one `tcCopyName`, comparing names without
regard to letter case, since a difference of case alone names a single file on a
case-insensitive filesystem (R-MFILE-13).

> **Example.** On every computer, whatever its language, `MAIN` and `main` are
> one name, and so are `ΦΩΤΟΣ` and `φωτος`.

**R-MFILE-20.** A TC Copy MAY carry an ignore file named `.tcignore` in its TC
Directory. It MUST be plain text encoded in UTF-8, one pattern per line, with
blank lines skipped and a line beginning with `#` treated as a comment. Pattern
syntax and matching MUST follow `gitignore(5)`, evaluated relative to that TC
Directory. A starter ignore file, which Turbo-Collection writes into a TC Copy
that has none (`init-spec.md` R-INIT-1), holds patterns for files that an
operating system and its file managers create on their own; Turbo-Collection's
reference implementation ships that list at
`scripts/templates/default.tcignore`.

**R-MFILE-21.** Turbo-Collection MUST exclude an ignored file from every
manifest and MUST NOT copy one to another TC Copy. A file that matches a TC
Copy's ignore patterns MUST NOT enter that TC Copy by an Import.
Turbo-Collection MUST report a pattern it cannot evaluate and MUST NOT apply it.

> **Example.** A mistyped `*.mov` shows up as thousands of files matched, not as
> silently empty video backups.

## 7. This document's bump test

Required of every normative document by `version-requirement.md` R-PUB-1. This
test is measured on **meta files**, which is what this document puts into a TC
Copy.

| Level     | Test                                                                                                                                                                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | A meta file written under this document's previous version would parse differently, change meaning, or become invalid; or a field is removed, renamed, or reinterpreted; or an obligation is withdrawn or narrowed; or its document language or obligation vocabulary changes (`version-requirement.md` R-PUB-9). |
| **MINOR** | Additions only. Every meta file written under this document's previous version keeps its exact meaning, and every field it carries is still read as it was.                                                                                                                                                       |
| **PATCH** | Prose improvement that changes no obligation and changes no meta file.                                                                                                                                                                                                                                            |
