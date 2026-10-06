# Turbo-Collection: Meta File Specification

> **Version:** 0.1.0-draft
> **Created:** 2026-08-27
> **Status:** Draft. No implementation exists yet.

This document is normative over **meta files**: files a copy holds that describe it or what happened
to it, rather than content it preserves. It states what each one is called, where it sits, and what is
inside it.

It governs meta files entirely and content files not at all. Where a content file goes is stated by
a layout specification, such as [`photo-path-layout-spec.md`](photo-path-layout-spec.md) or
[`as-found-path-layout-spec.md`](as-found-path-layout-spec.md).

**This document's version is the format version.** Every meta file states it, and a MAJOR version of
this document is a change of meta file format by construction, because this document contains nothing
else to break.

Requirement ID prefix: **`R-MFILE-*`**.

> **Rationale.** Why meta files are shaped this way, and the alternatives weighed: [the manifest-format decision](../docs/decisions/2026-08-16-manifest-format-decision.md), [the receipts decision](../docs/decisions/2026-09-07-receipts-decision.md), [the location-receipt decision](../docs/decisions/2026-09-10-location-receipt-decision.md), [the config-placement decision](../docs/decisions/2026-09-27-config-placement-decision.md), [the collection-naming decision](../docs/decisions/2026-09-28-collection-naming-decision.md), and [design-record](../docs/design-record.md).

---

## 0. Role and scope

This document binds the implementation. It answers one question: given something Turbo-Collection
must write down, what does that file look like.

It does not state **when** Turbo-Collection writes one, or what it may do afterward. Appending an
arrival only after content is written, refusing to replace a receipt that would lose an arrival, and
refusing to treat a receipt as evidence a copy still exists are behavior, and they stay in
[`turbo-collection-spec.md`](turbo-collection-spec.md).

## 1. Terminology

Per `language-requirement.md` R-LANG-5, this section is self-contained.

- **Collection.** The set of files this project preserves, held as one or more peer copies.

- **Copy.** One physical instance of the collection, held on one storage medium. Copies are peers;
  none is privileged.

- **Content file.** Any file a copy holds that is neither a meta file nor an ignored file, preserved
  untouched.

- **Meta file.** A file that describes a copy or what happened to it: a manifest, a receipt, a
  configuration file, an ignore file, and any copy of a specification carried on a drive.

- **Item.** One logical thing supplied by an import source, which may comprise several content files.

- **Import source.** One way of getting files into the collection, such as iCloud or a
  camera card. An import source is an instance, named by the operator (`icloud-personal`); a leaf
  manifest records which one placed a directory (R-MFILE-9).

- **Layout.** A rule that determines where in a copy a content file is stored. Each layout is defined
  by its own specification, which declares that layout's identifier and carries a version
  (R-MFILE-9).

- **Manifest.** The meta file recording a checksum for each file in one directory (R-MFILE-8).

- **Receipt.** The record of every arrival of a directory's content at a copy and every error
  affecting it, written as one file per run (R-MFILE-13).

- **Arrival.** One event of a directory's content reaching one copy.

- **Error.** One event of content a run handled failing to reach a copy: an item an import source
  offered that Turbo-Collection did not take, or a content file that failed to reach a copy it was
  being mirrored into.

- **Fixity.** Evidence that data has not changed, established by comparing checksums.

- **Content digest.** A checksum over the SHA-256 checksums of a directory's content files, taken in
  ascending order of those checksums (R-MFILE-15).

- **Format version.** The version of this document, which every meta file states (R-MFILE-4).

- **Ignored file.** A file in a copy that matches a pattern in that copy's ignore file (R-MFILE-20).

- **Run.** A single invocation of Turbo-Collection, which performs its work once and exits.

## 2. Naming and placement

**R-MFILE-1.** A meta file's format MUST be determinable from that file's name alone, without reading its content. Turbo-Collection MUST NOT read a meta file whose name it does not recognize, and MUST report such a file instead.

**R-MFILE-2.** Turbo-Collection MUST use these names and places, relative to a copy's root: `.tcignore` at the root; a `.turbo-collection/` subdirectory of the root holding the configuration file named `turbo-collection-config.json` and per-event location receipt files named `receipt-<runId>-<collectionName>.location.json` (R-MFILE-26); and, for each directory holding content, a `.turbo-collection/` subdirectory of that directory holding a manifest named `manifest.json` and per-event receipt files named `receipt-<runId>-<collectionName>.arrival.json` and `receipt-<runId>-<collectionName>.error.json`. A carried copy of a specification MUST be named for the document and the full version of the text it holds.

## 3. Rules for every JSON meta file

**R-MFILE-3.** A JSON meta file MUST be a JSON document as defined by RFC 8259, encoded in UTF-8.

**R-MFILE-4.** A JSON meta file MUST contain a `version` field, stating the version of this document under which that file was written. Turbo-Collection MUST NOT rename that field while meta files are JSON.

**R-MFILE-5.** Turbo-Collection MUST ignore a field it does not recognize, and MUST preserve every such field verbatim when it rewrites a meta file.

> **Example.** Rewriting a manifest, Turbo-Collection keeps fields it does not recognize, so a newer writer's data is not silently dropped.

**R-MFILE-6.** **Self-evidence.** A meta file MUST be intelligible by inspection alone, without the document version that produced it. A version is a disambiguator, and MUST NOT be the only key to decoding a meta file.

> **Example.** A binary or opaque-header format is forbidden: a stranger must be able to figure a meta file out by looking at it.

**R-MFILE-7.** Turbo-Collection MUST NOT reinterpret a meta file whose stated version it does not recognize. An unrecognized version MUST be an explicit failure, never a guess.

**R-MFILE-27.** A JSON meta file MUST be written across multiple lines rather than minified, placing each field and each array element on its own line, so a person can read it by inspection (R-MFILE-6). No other aspect of formatting is constrained: indentation, spacing, and a trailing newline are the writer's choice.

## 4. The manifest

**R-MFILE-8.** Turbo-Collection MUST record a SHA-256 checksum for every content file in a directory, in a manifest stored in that directory's `.turbo-collection/` subdirectory and named `manifest.json`. A manifest MUST cover the content files of the directory it describes, and MUST NOT cover a subdirectory, which excludes both a nested content directory and the `.turbo-collection/` directory the meta files sit in. A directory holding no content file needs no manifest. A manifest MUST NOT cover an ignored file.

**R-MFILE-9.** A manifest's fields MUST be:

- `version` (R-MFILE-4)
- `layout`, an object with:
  - `specId`, the identifier of the layout that placed the directory's content, as that layout's specification declares it
  - `version`, that specification's version
- `importSource`, an object with:
  - `specId`, the identifier the import source's specification declares
  - `version`, the version of that specification that governs the directory
- `checksumAlgorithm`, stating the algorithm the checksums were computed with as `SHA-256` (R-MFILE-8)
- `files`, an array holding one object per covered file

**R-MFILE-10.** Each entry in `files` MUST state, in fields of these names: that file's name (`file`), that file's length in bytes (`size`), and that file's checksum (`checksum`). A `file` field MUST state a name only, MUST NOT state a path, and MUST preserve the name's casing exactly as stored. A `checksum` MUST be lowercase hexadecimal.

**R-MFILE-11.** An entry MAY also state a `date`, a time the import source associates with that file. The import source sets the value and defines its meaning, and Turbo-Collection MUST NOT interpret it. A `date` MUST be an ISO 8601 calendar date and time (`YYYY-MM-DDThh:mm:ss`), carrying a UTC offset when the import source supplies the zone and omitting it, as a bare local date and time, when it does not. An import source MUST NOT set a `date` from a filesystem timestamp. Turbo-Collection MUST omit the field where the import source associates no time with the file.

**R-MFILE-12.** The entries in `files` MUST be ordered by their `file` name using a case-insensitive comparison: compare names with ASCII letters `A` through `Z` folded to lowercase and ordered by Unicode code point, and where two names are equal under that folding, order them by the unfolded name by Unicode code point. This ordering MUST NOT depend on a locale, so that any implementation writes the same manifest.

## 5. The receipt

**R-MFILE-13.** Turbo-Collection MUST maintain a receipt in every directory into which it writes a content file, in every directory where an Import records a content file already present (`in-place-import-source-spec.md` R-INPLACE-7), and in every directory in which it recorded an error affecting that directory's content. A receipt is a set of per-event files, each stored in that directory's `.turbo-collection/` subdirectory: one file per arrival, named `receipt-<runId>-<collectionName>.arrival.json`, and, per run that recorded any error for the directory, one file named `receipt-<runId>-<collectionName>.error.json`. `<runId>` identifies the run and MUST be an ISO 8601 basic-format instant in UTC (for example `20260814T180422Z`) followed by `-` and a short disambiguating suffix, so it contains no character illegal in a filename and orders files by the time the run occurred (`photo-path-layout-spec.md` R-PHOTO-4 uses the same basic format). `<collectionName>` names the copy the run wrote to, or attempted to write to, for that event (R-MFILE-19), and appears in the filename so that files two copies author in one run cannot collide; R-MFILE-19 constrains `collectionName` to a portable filename character set for this reason. The copy an event names is not always the copy its file resides on: propagation places a copy's receipt files on other copies (`turbo-collection-spec.md` R-REC-6), and a mirror error names a destination copy that failed, which often cannot hold the file, so Turbo-Collection MUST record a mirror error in an error file on the copy it is mirroring from, beside the content the failed transfer was driving from. A receipt MUST record every arrival of that directory's content at a copy and every error. Turbo-Collection MUST NOT modify or delete a receipt file after writing it.

**R-MFILE-14.** An arrival file MUST contain one arrival. Its fields MUST be:

- `version` (R-MFILE-4)
- `tcSpecVersion`, stating the version of `turbo-collection-spec.md` the run conformed to
- `runId`, identifying the run that wrote the file
- `collectionName`, the copy the content reached
- `date`, the date and time it was reached
- `fileCount`, the number of content files present in the directory at that moment
- `contentDigest`, a content digest over them (R-MFILE-15)
- where the arrival newly acquired the content from an import source, `layout`, `importSource`, and optionally `importSourceDetails` (R-MFILE-15)

A `date` MUST be a full ISO 8601 calendar date and time (`YYYY-MM-DDThh:mm:ss`) carrying a time-zone offset (`Z` for UTC, or `±hh:mm`); Turbo-Collection records it from the run's own clock, so unlike an import source's `date` (R-MFILE-11) the offset is never omitted.

**R-MFILE-15.** An arrival records how content reached a copy, and the two ways differ. An arrival that newly acquired content from an import source (an import) MUST carry `layout` and `importSource`, and MAY carry `importSourceDetails`. An arrival that propagated content already held by another copy (a mirror) MUST carry neither `layout` nor `importSource`, because it acquired nothing from outside and applied no layout; its provenance is the import arrival that placed the content, which travels to it (`turbo-collection-spec.md` R-REC-6). `layout` MUST be an object stating the layout's identifier (`specId`) and the `version` of that layout's specification; `importSource` MUST be an object stating the import source specification's identifier (`specId`) and the `version` of that specification the run conformed to. An `importSourceDetails` value MUST be a JSON object whose contents that import source's own specification states, and Turbo-Collection MUST NOT depend on its contents. A content digest MUST cover content files only, so that no meta file contributes to it. A `contentDigest` MUST be computed as the SHA-256 of the text formed by taking each content file's SHA-256 checksum as lowercase hexadecimal, ordering those checksums in ascending Unicode code point order, and joining them with a single newline (`U+000A`) between each.

**R-MFILE-16.** An error file MUST contain the errors a run recorded for the directory. Its fields MUST be:

- `version` (R-MFILE-4)
- `tcSpecVersion`
- `runId`
- `collectionName`, the copy the run wrote to or attempted to write to
- `importErrors`, an array holding one object per import error: content the run could not place in the collection
- `mirrorErrors`, an array holding one object per mirror error: content already in the collection that the run could not propagate to another copy

An error file holds at least one error across the two arrays (R-MFILE-13 writes one only when a run recorded an error), and MAY omit an array that holds none. Every error object, of either kind, MUST state a human-readable description of what went wrong (`message`), in plain language and intelligible without the software that produced it (R-MFILE-6); the `message` is best-effort and MAY be incomplete. An error object MAY carry further fields the piece producing it defines; what each kind records beyond `message` is specified later, as real errors show what is needed.

> **Example.** Three per-event files in one directory's `.turbo-collection/`. An import arrival, in `receipt-20260814T180422Z-3f9a-main.arrival.json`, records the specifications that placed the content:
>
> ```json
> {
>   "version": "0.1.0-draft",
>   "tcSpecVersion": "0.1.0-draft",
>   "runId": "20260814T180422Z-3f9a",
>   "collectionName": "main",
>   "date": "2026-08-14T18:04:22Z",
>   "fileCount": 412,
>   "contentDigest": "9f2a1c...",
>   "layout": { "specId": "photo-path-layout", "version": "0.1.0" },
>   "importSource": { "specId": "icloud", "version": "0.1.0" }
> }
> ```
>
> A later mirror arrival of the same content to another copy, in `receipt-20260902T090500Z-b1d2-off-site.arrival.json`, names no `layout` or `importSource`; the matching `contentDigest` proves identical content arrived:
>
> ```json
> {
>   "version": "0.1.0-draft",
>   "tcSpecVersion": "0.1.0-draft",
>   "runId": "20260902T090500Z-b1d2",
>   "collectionName": "off-site",
>   "date": "2026-09-02T09:05:00Z",
>   "fileCount": 412,
>   "contentDigest": "9f2a1c..."
> }
> ```
>
> An error file, `receipt-20260814T180422Z-3f9a-main.error.json`, holds the run's errors for the directory:
>
> ```json
> {
>   "version": "0.1.0-draft",
>   "tcSpecVersion": "0.1.0-draft",
>   "runId": "20260814T180422Z-3f9a",
>   "collectionName": "main",
>   "importErrors": [
>     {
>       "message": "icloud delivered IMG_0001.HEIC only inside a container that could not be unpacked; refused (turbo-collection-spec.md R-SRC-5)"
>     }
>   ]
> }
> ```

**R-MFILE-26.** A location receipt records where a copy is, as a hint for finding it, and states that copy's own location, never another's. Turbo-Collection MUST store it in the `.turbo-collection/` subdirectory of the copy root (R-MFILE-2), one file per observation named `receipt-<runId>-<collectionName>.location.json`, and MUST NOT modify or delete it once written, as with every receipt file (R-MFILE-13). Its fields MUST be:

- `version` (R-MFILE-4)
- `tcSpecVersion`
- `runId`
- `collectionName`, the copy this locates
- `date`, when the location was observed, in the same form an arrival's `date` takes (R-MFILE-14)
- an optional `volumeId`, an identifier the volume the copy is stored on carries across machines, where a `null` value is equivalent to an absent one and both mean the copy is located by `relativePath` alone
- `relativePath`, a path to the copy that MUST be relative and MUST NOT be absolute

When `volumeId` is present, `relativePath` is relative to that volume's root; when it is absent, `relativePath` is relative to the location receipt file's own directory. `relativePath` MUST be written separator-neutral, joining segments with `/` rather than any one filesystem's separator. Turbo-Collection MUST treat `volumeId` as opaque, comparing it only for equality and never parsing or validating its form, because the identifier's shape is whatever that copy's storage reports (`turbo-collection-spec.md` R-REC-9, R-TGT-5).

## 6. Configuration and the ignore file

**R-MFILE-17.** Configuration MUST be plain data in a text format a person can read and edit, and that a tool other than Turbo-Collection can parse. It MUST be named `turbo-collection-config.json` and MUST sit in the `.turbo-collection/` subdirectory of the root of the copy it describes (R-MFILE-2).

**R-MFILE-18.** A configuration file's fields MUST be: `version` (R-MFILE-4); `collectionName`, stating the name receipts use for this copy; and, optionally, `collectionDescription`, human-readable text describing this copy. `collectionName` MUST be non-empty. `collectionDescription` MAY be omitted; where present it MUST be a non-empty string, MAY differ from copy to copy, and is descriptive only, so nothing MUST depend on it. Configuration states a copy's own identity and nothing about other copies: it declares no role and no roster of copies expected to exist, since copies are peers and are discovered at run time.

**R-MFILE-19.** Every copy MUST declare its own identity in its own configuration file. When **init** or **backup** creates a copy, Turbo-Collection MUST set that copy's `collectionName` once, at creation, from a name given on the command line or, where **init** is given none, the default `main` (`turbo-collection-spec.md` R-CLI-11, R-CLI-13), and MUST write it into that copy's configuration file. Thereafter Turbo-Collection MUST determine a copy's name by reading that declaration, and MUST NOT infer it from a volume label, a mount path, a drive letter, or a command-line argument. `collectionName` MUST consist only of characters that are portable across common filesystems, namely ASCII letters `A` through `Z` and `a` through `z`, digits `0` through `9`, hyphen, and underscore, because it appears verbatim in receipt filenames (R-MFILE-13). Turbo-Collection MUST refuse the whole run when two connected copies state one name, comparing names without regard to letter case, since a difference of case alone names a single file on a case-insensitive filesystem (R-MFILE-13).

**R-MFILE-20.** A copy MAY carry an ignore file named `.tcignore` at its root. It MUST be plain text encoded in UTF-8, one pattern per line, with blank lines skipped and a line beginning with `#` treated as a comment. Pattern syntax and matching MUST follow `gitignore(5)`, evaluated relative to the copy root. The starter ignore file Turbo-Collection writes into a copy that has none (`turbo-collection-spec.md` R-CLI-11) holds patterns for files that an operating system and its file managers create on their own; the reference implementation ships that list at `scripts/templates/default.tcignore`.

**R-MFILE-21.** Turbo-Collection MUST exclude an ignored file from every manifest and MUST NOT copy one to another copy. A file that matches a copy's ignore patterns MUST NOT enter that copy by an Import. Every run MUST report, per pattern, how many files that pattern matched. Turbo-Collection MUST report a pattern it cannot evaluate and MUST NOT apply it.

> **Example.** A mistyped `*.mov` shows up as thousands of files matched, not as silently empty video backups.

## 7. This document's bump test

Required of every normative document by `version-requirement.md` R-PUB-1. This test is measured on
**meta files**, which is what this document puts into a copy.

| Level     | Test                                                                                                                                                                                                                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | A meta file written under the previous version would parse differently, change meaning, or become invalid; or a field is removed, renamed, or reinterpreted; or an obligation is withdrawn or narrowed; or the document language or obligation vocabulary changes (`version-requirement.md` R-PUB-9). |
| **MINOR** | Additions only. Every meta file written under the previous version keeps its exact meaning, and every field it carries is still read the same way.                                                                                                                                                    |
| **PATCH** | Prose improvement that changes no obligation and changes no meta file.                                                                                                                                                                                                                                |

