# Turbo-Collection: Meta File Specification

> **Version:** 0.1.0-draft
> **Created:** 2026-08-27
> **Status:** Draft. No implementation exists yet.

This document is normative over **meta files**: every file Turbo-Collection writes into a copy that
describes that copy rather than being preserved content. It states what each one is called, where it
sits, and what is inside it.

It governs meta files entirely and content files not at all. Where a photograph or a video goes is
stated by a path layout specification, such as
[`photo-path-layout-spec.md`](photo-path-layout-spec.md).

**This document's version is the format version.** Every meta file states it, and a MAJOR version of
this document is a change of meta file format by construction, because this document contains nothing
else to break.

Requirement ID prefix: **`R-MFILE-*`**.

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

- **Content file.** A photograph or a video held in a copy, preserved untouched.

- **Meta file.** A file Turbo-Collection writes into a copy that describes that copy or what happened
  to it: a manifest, a receipt, a configuration file, an ignore file, a `README.md`, and any copy of
  a specification carried on a drive.

- **Item.** One logical thing supplied by an import source, which may comprise several content files.

- **Import source.** One way of getting original bytes into the collection, such as iCloud or a
  camera card. An import source is an instance, named by the operator (`icloud-personal`); a leaf
  manifest records which one placed a directory (R-MFILE-9).

- **Manifest.** The meta file recording a checksum for each file in one directory (R-MFILE-8).

- **Receipt.** The record of every arrival of a directory's content at a copy and every error
  affecting it, written as one file per run (R-MFILE-13).

- **Arrival.** One event of a directory's content reaching one copy.

- **Error.** One event of content a run handled failing to reach a copy: an item an import source
  offered that Turbo-Collection did not take, or a content file that failed to reach a copy it was
  being reconciled into.

- **Fixity.** Evidence that data has not changed, established by comparing checksums.

- **Content digest.** A checksum over the SHA-256 checksums of a directory's content files, taken in
  ascending order of those checksums (R-MFILE-15).

- **Format version.** The version of this document, which every meta file states (R-MFILE-4).

- **Ignored file.** A file in a copy that matches a pattern in that copy's ignore file (R-MFILE-20).

- **Run.** A single invocation of Turbo-Collection, which performs its work once and exits.

- **Migration.** Converting a copy written under an older MAJOR version of this document to the
  current one (R-MFILE-24).

## 2. Naming and placement

| ID            | Requirement                                                                                                                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R-MFILE-1** | A meta file's format MUST be determinable from that file's name alone, without reading its content. Turbo-Collection MUST NOT read a meta file whose name it does not recognize, and MUST report such a file instead.                     |
| **R-MFILE-2** | Turbo-Collection MUST use these names and places, relative to a copy's root: `turbo-collection-config.json` and `.tcignore` and `README.md` at the root; a `.turbo-collection/` subdirectory of the root holding per-event location receipt files named `receipt-<runId>-<copyName>.location.json` (R-MFILE-26); and, for each directory holding content, a `.turbo-collection/` subdirectory of that directory holding a manifest named `manifest.json` and per-event receipt files named `receipt-<runId>-<copyName>.arrival.json` and `receipt-<runId>-<copyName>.error.json`. A carried copy of a specification MUST be named for the document and the full version of the text it holds. |

> **Why an extension carries the format, and what that buys.** A reader must know how to parse a file
> before it can find anything inside it, so nothing inside can carry that fact. A name can, and a name
> is readable by a person, a file manager, and an operating system that has never heard of this
> project. This is also what keeps R-MFILE-4 honest: a version field inside a JSON object can promise
> stability only for as long as meta files are JSON, and a later format is a different extension,
> which identifies itself without being parsed.

> **Why root files are self-describing and per-directory machinery sits in a subdirectory.** A
> stranger who finds one drive and nothing else can tell what `turbo-collection-config.json` belongs
> to, which is why the files a person is meant to find, the configuration, the `README.md`, and any
> carried specification, keep full self-describing names at the root. The files Turbo-Collection
> maintains for itself inside the tree, a directory's manifest and its receipt files, go instead into a
> `.turbo-collection/` subdirectory of that directory. One entry beside the content holds all of them,
> however many receipt files a directory accumulates, so the machinery stays out of the way of the
> photographs a person browses, and a directory boundary rather than a name prefix separates meta from
> content. The subdirectory carries the identity, which is why the files inside are named plainly:
> `manifest.json` and the `receipt-` files need no prefix to say whose they are, because the directory
> holding them already does. It is a grouping convention, not a promise of hiding, since not every
> platform hides a name by its leading dot. `.tcignore` shares the reason its own format supplies: an
> ignore file is a short dotfile, and it is the one root file a person edits rather than finds by
> accident.

## 3. Rules for every JSON meta file

| ID            | Requirement                                                                                                                                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-MFILE-3** | A JSON meta file MUST be a JSON document as defined by RFC 8259, encoded in UTF-8.                                                                                                                                                                                                    |
| **R-MFILE-4** | The first field of a JSON meta file MUST be `version`, stating the version of this document under which that file was written. Turbo-Collection MUST NOT move or rename that field while meta files are JSON.                                                                          |
| **R-MFILE-5** | Turbo-Collection MUST ignore a field it does not recognize, and MUST preserve every such field verbatim when it rewrites a meta file.                                                                                                                                                 |
| **R-MFILE-6** | **Self-evidence.** A meta file MUST be intelligible by inspection alone, without the document version that produced it. A version is a disambiguator, and MUST NOT be the only key to decoding a meta file.                                                                            |
| **R-MFILE-7** | Turbo-Collection MUST NOT reinterpret a meta file whose stated version it does not recognize. An unrecognized version MUST be an explicit failure, never a guess.                                                                                                                     |

> **R-MFILE-6 is a design constraint with teeth.** It forbids any meta file format that can only be
> understood by consulting its specification, which rules out binary encodings, opaque headers, and
> compact-but-cryptic schemes **forever**. Every format this project ever adopts must pass one test:
> could a stranger figure this out by looking at it?

> **Why `version` is bare while other version fields are qualified.** A file named `manifest.json`
> has already said what it is and how it parses, so its own top-level `version` can only mean which
> version of that format it holds. A version that points outward is set apart from the file's own:
> namespaced inside the block it qualifies (`layout.version` and `importSource.version`, in a manifest
> and in an import arrival), or given a qualified name (`tcSpecVersion`, the core specification's
> version, in a receipt), so it is never confused with the file's own. Bare for self, qualified for
> everything else.

> **Why unknown fields are ignored rather than rejected, and why that needs no minor number.** An
> addition that older software can ignore safely is not a break, so the format version does not move
> for it at all. Preserving unknown fields verbatim matters wherever Turbo-Collection rewrites a meta
> file rather than creating a new one: a manifest is regenerated when its directory's content changes,
> and a rewrite that dropped fields it did not understand would quietly destroy what a newer writer
> recorded. Receipt files are never rewritten (R-MFILE-13), so the concern does not arise for
> them; reconcile copies such a file between copies byte for byte. A field that changes how an existing field must be read is not an addition
> at all, and is MAJOR under Section 10.

## 4. The manifest

| ID             | Requirement                                                                                                                                                                                                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-MFILE-8**  | Turbo-Collection MUST record a SHA-256 checksum for every content file in a directory, in a manifest stored in that directory's `.turbo-collection/` subdirectory and named `manifest.json`. A manifest MUST cover the content files of the directory it describes, and MUST NOT cover a subdirectory, which excludes both a nested content directory and the `.turbo-collection/` directory the meta files sit in. A directory holding no content file needs no manifest. A manifest MUST NOT cover an ignored file. |
| **R-MFILE-9**  | A manifest's fields MUST be, in this order: `version` (R-MFILE-4); `layout`, an object with `specId`, the identifier the layout specification declares for the convention that placed the directory's content, and `version`, that specification's version; `importSource`, an object with `specId`, the identifier the import source's specification declares, which is also the directory's `<import source>` path segment (`photo-path-layout-spec.md` R-PHOTO-3), and `version`, the version of that specification that governs the directory; `checksumAlgorithm`, stating the algorithm the checksums were computed with as `SHA-256` (R-MFILE-8); and `files`, an array holding one object per covered file. |
| **R-MFILE-10** | Each entry in `files` MUST state, in fields of these names: that file's name (`file`), that file's length in bytes (`size`), and that file's checksum (`checksum`). A `file` field MUST state a name only, MUST NOT state a path, and MUST preserve the name's casing exactly as stored. A `checksum` MUST be lowercase hexadecimal. |
| **R-MFILE-11** | An entry MAY also state a `date`, a time the import source associates with that file. The import source sets the value and defines its meaning, and Turbo-Collection MUST NOT interpret it. A `date` MUST be an ISO 8601 calendar date and time (`YYYY-MM-DDThh:mm:ss`), carrying a UTC offset when the import source supplies the zone and omitting it, as a bare local date and time, when it does not. An import source MUST NOT set a `date` from a filesystem timestamp. Turbo-Collection MUST omit the field where the import source associates no time with the file. |
| **R-MFILE-12** | A manifest MUST be written with whitespace that places each file entry on its own line. The entries in `files` MUST be ordered by their `file` name using a case-insensitive comparison: compare names with ASCII letters `A` through `Z` folded to lowercase and ordered by Unicode code point, and where two names are equal under that folding, order them by the unfolded name by Unicode code point. This ordering MUST NOT depend on a locale, so that any implementation writes the same manifest. |

> **Why a copy's root files are covered by no manifest.** A root holds no content file, so it gets
> no manifest, and `turbo-collection-config.json`, `.tcignore` and `README.md` are therefore
> checksummed nowhere. This is a decision rather than an oversight. Fixity protects what cannot be
> recreated: a photograph is irreplaceable, while a configuration file can be retyped, an ignore file
> re-pasted from the public lists it came from, and a `README.md` regenerated. Covering them would
> also mean recording checksums for three files that exist to be edited by hand, so every ordinary
> edit would report a mismatch until someone rebuilt the record, and a fixity report that fires
> during normal use teaches a person to ignore fixity reports. What protects those files instead is
> R-CFG-3 and R-CFG-4 in `turbo-collection-spec.md`, which validate configuration before any
> filesystem mutation and fail rather than guess; R-MFILE-19, which refuses to run when two connected
> copies claim one name; and R-MFILE-21's per-pattern match counts, which make a mutated ignore
> pattern visible on the next run.

> **Why a manifest vouches rather than inventories.** A manifest states that the files it lists are
> intact. It does not assert that its directory holds nothing else, because ignored files exist and
> the patterns that define them live at a copy root, which a separated directory does not carry.
> Detecting an unexpected file is a run's job, where configuration is in hand, and a run reports one
> (R-MFILE-21). What a separated directory can still do alone is prove its own photographs are
> intact, which is the job it has.

> **Why a date is optional, and why its absence says something.** A `date` is present when the import
> source associates a time with the file, and absent when it does not. Absence is therefore a record
> rather than a gap: it says this file reached the collection with no time the import source could
> state. Recording the value rather than a flag also lets a tree be audited, or rebuilt, from
> manifests alone rather than by re-reading embedded metadata across a whole collection.

> **Why a filesystem timestamp is never that date.** A creation or modification time describes a
> copy, not a photograph. Reconciling to a new drive rewrites it, restoring from a backup rewrites it,
> and exFAT and NTFS disagree about which zone it is in. A photograph taken in 2003, sitting on a
> drive formatted last year, has a modification time from last year, and none of that is a fact about
> the photograph.

> **Why an entry states a size the checksum already implies.** A size never contradicts a checksum:
> anything a size mismatch catches, a checksum mismatch catches too. Its value is that it is a check
> a person can afford to run. Verifying by checksum reads every byte, which is hours for a
> multi-terabyte copy, while comparing sizes reads none and takes seconds. That gives a cheap screen
> between full verification passes, and it catches the class of damage this system's own operations
> can cause: a truncated file from an interrupted copy, a full destination, a disconnected drive, a
> photograph that is now zero bytes. A matching size is not fixity, because bit rot does not change
> a file's length; only a checksum establishes that a file is unchanged.

> **Why an entry states a name rather than a path.** A manifest covers one directory, so a name
> identifies an entry without ambiguity. A path in every entry would repeat one prefix a hundred
> times and, worse, would become a hundred false statements the moment that directory is copied
> elsewhere, which is the case per-directory manifests exist to serve. Where a separated directory
> belongs stays recoverable without being restated: its month follows from the `date` fields its
> entries carry, and the import source is the directory's own name.

> **Why every directory restates its layout convention.** It duplicates one fact thousands of times,
> and that is the point. Duplication is cheap, drift between directories is detectable, and a directory
> that gets moved, mailed, or restored on its own reconstructs the convention that placed it. The
> version of `turbo-collection-spec.md` a run wrote under is not restated here: it is uniform across a
> run rather than varying per directory the way a layout convention can
> (`turbo-collection-spec.md` R-SRC-15), so it is recorded once per run in the receipt (R-MFILE-14).

> **Why the manifest carries `layout` and `importSource` versions, and what those versions mean.**
> Both name a specification a directory was placed under, and both belong here rather than in the
> receipt because they describe what the directory structurally **is**, a per-directory fact, not
> what one run did. Each block is a `specId` and a `version`, the shape of a pinned dependency, so a
> manifest reads as declaring which versioned specifications govern the directory. `importSource.specId`
> is the directory's own `<import source>` path segment, kept in the manifest as well so a directory
> that disagrees with the segment it sits under is a cheap misplacement signal. The `version` in each
> block is a **current claim**: the latest specification version that took ownership of the directory
> as compatible, re-stamped on a compatible reuse and forked to a new import-source `specId` on an
> incompatible one (`turbo-collection-spec.md` R-SRC-16). The
> authoritative per-run version trail lives in the receipts (R-MFILE-14); the manifest holds only the
> claim in force now. An import source's specification is one document per import source, and such
> specifications may reference one another.

## 5. The receipt

| ID             | Requirement                                                                                                                                                                                                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-MFILE-13** | Turbo-Collection MUST maintain a receipt in every directory into which it writes a content file, and in every directory in which it recorded an error affecting that directory's content. A receipt is a set of per-event files, each stored in that directory's `.turbo-collection/` subdirectory: one file per arrival, named `receipt-<runId>-<copyName>.arrival.json`, and, per run that recorded any error for the directory, one file named `receipt-<runId>-<copyName>.error.json`. `<runId>` identifies the run and MUST be an ISO 8601 basic-format instant in UTC (for example `20260814T180422Z`) followed by `-` and a short disambiguating suffix, so it contains no character illegal in a filename and orders files by the time the run occurred (`photo-path-layout-spec.md` R-PHOTO-4 uses the same basic format). `<copyName>` names the copy the run wrote to, or attempted to write to, for that event (R-MFILE-19), and appears in the filename so that files two copies author in one run cannot collide; R-MFILE-19 constrains `copyName` to a portable filename character set for this reason. The copy an event names is not always the copy its file resides on: propagation places a copy's receipt files on other copies (`turbo-collection-spec.md` R-REC-6), and a reconcile error names a destination copy that failed, which often cannot hold the file, so Turbo-Collection MUST write a reconcile error file on the copy it is reconciling from, beside the content the failed transfer was driving from. A receipt MUST record every arrival of that directory's content at a copy and every error. Turbo-Collection MUST NOT modify or delete a receipt file after writing it. |
| **R-MFILE-14** | An arrival file MUST contain one arrival. Its fields MUST be, in this order: `version` (R-MFILE-4); `tcSpecVersion`, stating the version of `turbo-collection-spec.md` the run conformed to; `runId`, identifying the run that wrote the file; `copyName`, the copy the content reached; `date`, the date and time it was reached; `fileCount`, the number of content files present in the directory at that moment; `contentDigest`, a content digest over them (R-MFILE-15); and, where the arrival newly acquired the content from an import source, `layout`, `importSource`, and optionally `importSourceDetails` (R-MFILE-15). A `date` MUST be a full ISO 8601 calendar date and time (`YYYY-MM-DDThh:mm:ss`) carrying a time-zone offset (`Z` for UTC, or `±hh:mm`); Turbo-Collection records it from the run's own clock, so unlike an import source's `date` (R-MFILE-11) the offset is never omitted. An arrival file MUST be written with whitespace that places each field on its own line. |
| **R-MFILE-15** | An arrival records how content reached a copy, and the two ways differ. An arrival that newly acquired content from an import source (an import) MUST carry `layout` and `importSource`, and MAY carry `importSourceDetails`. An arrival that propagated content already held by another copy (a reconcile) MUST carry neither `layout` nor `importSource`, because it acquired nothing from outside and applied no layout; its provenance is the import arrival that placed the content, which travels to it (`turbo-collection-spec.md` R-REC-6). `layout` MUST be an object stating the layout convention's identifier (`specId`) and that specification's `version`; `importSource` MUST be an object stating the import source specification's identifier (`specId`, which is also the directory's `<import source>` path segment) and the `version` of that specification the run conformed to. An `importSourceDetails` value MUST be a JSON object whose contents that import source's own specification states, and Turbo-Collection MUST NOT depend on its contents. A content digest MUST cover content files only, so that no meta file contributes to it. A `contentDigest` MUST be computed as the SHA-256 of the text formed by taking each content file's SHA-256 checksum as lowercase hexadecimal, ordering those checksums in ascending Unicode code point order, and joining them with a single newline (`U+000A`) between each. |
| **R-MFILE-16** | An error file MUST contain the errors a run recorded for the directory. Its fields MUST be, in this order: `version` (R-MFILE-4); `tcSpecVersion`; `runId`; `copyName`, the copy the run wrote to or attempted to write to; and `errors`, an array holding one object per error. An error file MUST be written with whitespace that places each error on its own line. Each error MUST state a human-readable description of what went wrong (`message`), in plain language and intelligible without the importer or adapter that produced it; the description is best-effort and MAY be incomplete. An error MAY also state the file it concerns (`file`); the import source that produced it (`importSource`, the same `{specId, version}` shape as on an arrival), whose presence marks it an import error and whose absence marks a reconcile error that failed to reach the file's `copyName`; and further detail (`details`). A `file` value states whatever identifies the file that failed and MAY be a path, and is not bound by R-MFILE-10's name-only rule, because an error may name a source item or an intended collection path no manifest covers. A `details` value MUST be a JSON object whose contents the piece that produced the error states in its own specification, and Turbo-Collection MUST NOT depend on its contents nor act on any field within it. |
| **R-MFILE-26** | A location receipt records where a copy is, as a hint for finding it, and states that copy's own location, never another's. Turbo-Collection MUST store it in the `.turbo-collection/` subdirectory of the copy root (R-MFILE-2), one file per observation named `receipt-<runId>-<copyName>.location.json`, and MUST NOT modify or delete it once written, as with every receipt file (R-MFILE-13). Its fields MUST be, in this order: `version` (R-MFILE-4); `tcSpecVersion`; `runId`; `copyName`, the copy this locates; `date`, when the location was observed, in the same form an arrival's `date` takes (R-MFILE-14); an optional `volumeId`, an identifier the volume the copy is stored on carries across machines, where a `null` value is equivalent to an absent one and both mean the copy is located by `relativePath` alone; and `relativePath`, a path to the copy that MUST be relative and MUST NOT be absolute. When `volumeId` is present, `relativePath` is relative to that volume's root; when it is absent, `relativePath` is relative to the location receipt file's own directory. `relativePath` MUST be written separator-neutral, joining segments with `/` rather than any one filesystem's separator. A location receipt file MUST be written with whitespace that places each field on its own line. |

> **Why a receipt is a set of per-event files, while the manifest is one file.** A manifest states
> what a directory holds now, so recomputing and rewriting it whole is the operation that fits it. A
> receipt instead accumulates events that never restate the past. Making each event its own immutable
> file means a run only ever creates files, never reopens or rewrites one, so writing a new event can
> neither lose nor corrupt what came before, and a copy on removable media needs only an atomic create.
> It also makes a receipt trivial to bring between copies: because every file is immutable and its name
> identifies the run and the copy that authored it, catching one copy up to another is a union of
> files, never a merge. One arrival is one file; a run's errors for a directory are one file, since a
> run can fail on several files at once.

> **Why a run's specification version lives here, not in the manifest.** The version of
> `turbo-collection-spec.md` a run conformed to, `tcSpecVersion`, is a fact about the run, uniform
> across every directory the run touched, so recording it on each event records it where it belongs
> rather than stamping it on every directory's manifest. A manifest instead records what varies per
> directory, the layout convention and import source that placed the content. A meta file otherwise
> carries only the version needed to parse itself, the format `version` (R-MFILE-4). An event file
> travels with its directory, sitting beside the manifest in the same `.turbo-collection/`
> subdirectory, so a directory carried on its own still states which version wrote each of its arrivals
> and errors.

> **Why an import arrival and a reconcile arrival differ, and why a partial arrival is honest.** An
> import brings bytes from outside that the content cannot describe itself, so an import arrival records
> the `importSource` and `layout` that placed them, the durable trail of which versioned specifications
> governed the placement. The manifest's matching blocks are a current claim that a later compatible
> run re-stamps (`turbo-collection-spec.md` R-SRC-16), so the receipt is the only place the originating
> version survives. A reconcile copies bytes already vouched for by another copy, acquiring nothing and
> applying no layout, so its arrival records neither; the import arrival that first placed the content
> travels to the copy alongside (R-REC-6), carrying that provenance with it. Either arrival records a
> `fileCount` and a `contentDigest` over the content present at that moment, which may be less than the
> whole directory when a run lands some files and fails on others. A partial arrival is not a half-truth
> but an honest snapshot, because every file it counts is completely written
> (`turbo-collection-spec.md` R-REC-5). Whether a copy is complete is then read not from any single
> field but from its newest event: a run that left no error file for the directory placed everything it
> attempted. What a following run must still correct is derived by comparing the copy's manifest with
> what it should hold, never by reading the error list as a queue of outstanding work.

> **Why an import source may add detail, and why nothing may read it.** Import sources differ in
> what they can say about an arrival, and a format that tried to anticipate all of it would either
> constrain sources it has never met or grow a field per vendor. `importSourceDetails` is the one
> place a source may record what only it knows, and its shape is stated where that knowledge lives,
> in that source's own specification. It is bounded by two rules that keep it from becoming a junk
> drawer: it is an object rather than a blob, so it stays readable by inspection (R-MFILE-6), and
> nothing may depend on its contents, so no reader ever needs to understand a source it has never
> heard of in order to interpret a receipt.

> **Why a content digest excludes meta files.** A receipt answers whether the photographs a directory
> held at one moment reached a copy. Manifests and receipts differ between copies by design, so
> including them would make two intact copies disagree about content that is in fact identical.

> **Why an error carries a human message and opaque detail (R-MFILE-16).** Error space is unbounded:
> every operating system, filesystem, and import source has its own failures, and a format that tried
> to enumerate them would either constrain sources it has never met or grow a field per vendor. So an
> error names one thing the core understands, a plain-language `message`, and delegates everything
> specific to `details`, an object the piece that raised the error fills and nothing else reads. The
> `message` keeps an error intelligible by inspection (R-MFILE-6) once the importer or adapter that
> wrote it is long gone; `details` is for a reader that still has that piece's specification. The two
> rules that bound `importSourceDetails` bound `details` too: it is an object rather than a blob, and
> nothing depends on its contents. What the core does guarantee is the meaning of the array itself: an
> entry in `errors` records content a run handled that did not reach a copy, which is the fact a
> person needs before deleting the source it came from (`turbo-collection-spec.md` R-LOG-5). An import
> error is anchored by its `importSource`; a reconcile error carries no `importSource`, the copy it
> failed to reach being the error file's own `copyName`.

> **Where a reconcile error file is written (R-MFILE-13).** An arrival file lands on the copy it names,
> which by definition just received content and so is writable. A reconcile error is the opposite case:
> it names the destination copy that failed, which may be unmounted, unwritable, or not yet holding the
> directory, so its own file cannot live there. Turbo-Collection writes it on the copy it was
> reconciling from, beside the content the failed transfer was driving from, which that copy holds and
> can read by construction; the file reaches the copy it names later, by the same propagation that
> carries every receipt file (`turbo-collection-spec.md` R-REC-6). This is one case of a general fact:
> `copyName` names the copy an event concerns, never the copy the file happens to sit on. In the
> degenerate run where no copy it touched is writable, no receipt can be written at all and the log is
> the only record (`turbo-collection-spec.md` R-LOG-1); R-LOG-5 is not thereby breached, because a
> reconcile error concerns how many copies hold content that is held elsewhere, not whether an import
> source may be deleted.

> **Why receipt files travel between copies, and its one limit.** A reconcile copies into each copy the
> event files the other holds that it lacks, never overwriting one (`turbo-collection-spec.md`
> R-REC-6), so a single drive inspected alone carries not only its own history but what it has heard of
> every other copy's. From one connected copy a person can read, per directory, which copies held the
> content and when, and whether each was complete, without connecting those drives. The limit is honest
> and unavoidable: a copy knows another's state only as of the last time their histories touched, which
> is why an arrival always carries its `date` and a copy count is never stated without it
> (`turbo-collection-spec.md` R-REC-8). This travel is also what guards a receipt's own integrity. A
> receipt is covered by no manifest, since meta files sit outside the content a manifest describes, so a
> hand-edited receipt that stays valid JSON is caught by no checksum. What catches it instead is
> immutability plus this travel: the same event file, named for its run and copy, exists on several
> copies, and one that has been altered simply disagrees with its unaltered twins. A lone copy never
> compared to another cannot detect the edit, but a system whose whole thesis is more than one copy
> answers that by keeping more than one.

> **Why a copy records its own location, and why as a receipt (R-MFILE-26).** Where a copy sits is a
> fact about the whole copy, not about any one directory in it, so it belongs in neither a manifest nor
> a directory receipt. It gets a record at the copy root instead, in a `.turbo-collection/` of the
> root's own, which hides copy-level machinery by the same convention that keeps a directory's manifest
> and receipts out of the way of its photographs. It is a receipt rather than a snapshot because a
> copy's location changes over time, when a drive is reformatted or replaced, and each observation is
> worth keeping: an immutable, time-ordered series records which volumes have stood behind a `copyName`.
> A copy records only its own location; the records of other copies arrive by the propagation that
> carries every receipt file (`turbo-collection-spec.md` R-REC-6, R-REC-9), so a single connected drive
> can suggest where its peers were last seen without any copy ever writing down another's whereabouts.

> **Why the locator is an optional identifier and an always-relative path (R-MFILE-26).** A path that
> names a drive letter or a mount point is a fact about one machine at one moment, false on the next
> machine and on most copies it propagates to, so the location receipt never stores one. It stores
> instead the two things that are true anywhere: a `volumeId`, an identifier a volume carries with it
> across machines and operating systems, and a `relativePath` that is always relative to an anchor.
> Across a drive boundary the anchor is the volume's own root, and the absolute path is recomputed each
> run from wherever that volume is mounted (`turbo-collection-spec.md` R-REC-9). Within one filesystem,
> where the copies share a tree, no `volumeId` is needed and `relativePath` is relative to the location
> receipt file's own directory, a literal path that resolves by inspection alone and survives an unusual
> mount arrangement. Either way the stored path is relative, never absolute, which is a machine-specific
> path forbidden by its shape: the one thing that must not be written into a record that is immutable
> and travels is a fact true on only one machine.

## 6. Configuration and the ignore file

| ID             | Requirement                                                                                                                                                                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R-MFILE-17** | Configuration MUST be plain data in a text format a person can read and edit, and that a tool other than Turbo-Collection can parse. It MUST be named `turbo-collection-config.json` and MUST sit at the root of the copy it describes.                                                                                                          |
| **R-MFILE-18** | A configuration file's fields MUST be, in this order: `version` (R-MFILE-4); and `copyName`, stating the name receipts use for this copy. `copyName` MUST be non-empty. Configuration states a copy's own identity and nothing about other copies: it declares no role and no roster of copies expected to exist, since copies are peers and are discovered at run time. |
| **R-MFILE-19** | Every copy MUST declare its own identity in its own configuration file. Turbo-Collection MUST determine a copy's name by reading that declaration, and MUST NOT infer it from a volume label, a mount path, a drive letter, or a command-line argument. `copyName` MUST consist only of characters that are portable across common filesystems, namely ASCII letters `A` through `Z` and `a` through `z`, digits `0` through `9`, hyphen, and underscore, because it appears verbatim in receipt filenames (R-MFILE-13). Turbo-Collection MUST refuse the whole run when two connected copies state one name, comparing names without regard to letter case, since a difference of case alone names a single file on a case-insensitive filesystem (R-MFILE-13). |
| **R-MFILE-20** | A copy MAY carry an ignore file named `.tcignore` at its root. It MUST be plain text encoded in UTF-8, one pattern per line, with blank lines skipped and a line beginning with `#` treated as a comment. Pattern syntax and matching MUST follow `gitignore(5)`, evaluated relative to the copy root. |
| **R-MFILE-21** | Turbo-Collection MUST exclude an ignored file from every manifest and MUST NOT copy one to another copy. Every run MUST report, per pattern, how many files that pattern matched. Turbo-Collection MUST report a pattern it cannot evaluate and MUST NOT apply it.                                                                                   |

> **Why patterns may hide a file from a manifest but never from a report (R-MFILE-21).** An ignore
> file is the only setting in this system that can remove data from Turbo-Collection's own
> accounting, so it is bounded by making every exclusion visible. A mistyped `*.mov` announces itself
> as thousands of files matched rather than as silently empty video backups. Ignoring changes whether
> a file is checksummed and copied; it never changes whether a file is counted. A pattern that cannot
> be evaluated is reported and skipped rather than guessed at, so a file it would have matched is
> reported as unrecognized instead of vanishing.

> **Why one ignore file at a copy root, and why `gitignore(5)`.** Per-directory ignore files would
> have to be kept in sync across thousands of directories, which is a maintenance burden nobody would
> survive. One file per copy travels with that copy and is edited in one place. The syntax is
> gitignore's because operating systems produce new stray files every year, and lists of them are
> maintained publicly and can be pasted in unmodified, so keeping current is a text edit rather than a
> change to this document. That format is defined by git's documentation rather than by a standards
> body, which is a deliberate exception to this project's usual preference, made because gitignore is
> more widely implemented than most standards and has been reimplemented independently many times.

> **Why a copy names itself (R-MFILE-19).** A receipt records the copy an arrival reached, and a
> receipt is permanent, so that name must still resolve decades later after every drive behind it has
> been replaced. Three tempting sources all fail. A volume label is mutable by anyone in seconds and
> leaves no trace when changed. A mount path is a drive letter on one operating system and a
> `/Volumes` entry on another, and it changes between sessions. A command-line argument puts a
> permanent record at the mercy of a typo. Reading a name off the copy itself fails none of these,
> and it buys a safety property the others cannot: plugging in the wrong drive becomes detectable
> rather than silent. It also makes Turbo-Collection indifferent to where a drive is mounted, which
> is what lets a backup run on a borrowed computer that assigns whatever letter it likes.

## 7. `README.md`

| ID             | Requirement                                                                                                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-MFILE-22** | Every copy MUST carry, at its root, a file named `README.md` stating what the data is, how it is organized, and how to verify it. Turbo-Collection MUST write this file where none exists, and MUST NOT overwrite one that does. Nothing MUST depend on it: it is orientation only, and the correctness of a copy MUST NOT depend on it existing or being readable. |

## 8. Reading, writing, and migration

| ID             | Requirement                                                                                                                                                                                                                                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-MFILE-23** | Turbo-Collection MUST read a meta file written under the current MAJOR version of this document or under the one before it. It MUST write meta files of the current MAJOR version only. Writing into a copy of an older MAJOR version MUST migrate that copy first.                                                                                                                    |
| **R-MFILE-24** | A release that introduces a new MAJOR version of this document MUST include a migration from the previous MAJOR version. A migration MUST be atomic per copy: at every moment a copy is wholly of the old version or wholly of the new, never in between. It MUST verify a copy against its manifests under the old rules before converting, and MUST re-verify under the new rules after converting; both verifications MUST cover every file rather than a sample. It MUST leave every content file byte-identical. It MUST remain available for at least one full off-site rotation cycle after the release. |
| **R-MFILE-25** | A release MAY also provide a direct migration from a named older MAJOR version. Such a migration MUST check a copy's stated version against its declared source version and MUST refuse any other; MUST meet every obligation of R-MFILE-24; and MUST produce an end state identical to crossing each intervening version in turn. It is an addition to the previous-version migration, never a replacement for it. |

> **Why read and write are governed by one window, and why the window is narrow.** A previous
> wording let Turbo-Collection read an old format while forbidding it to act, which reads as a
> capability rule and is really a scope rule. Migration already requires full read capability for the
> old version, so "can read but must not" was the confusing part. One rule replaces it: read within
> the window, write current only, and any write forces migration first.
>
> N-1 is the floor rather than a compromise. LTO, the most archival-serious storage industry there
> is, spent twenty years narrowing its own compatibility window: two generations back through LTO-7,
> one for LTO-8 and LTO-9, and none at all by LTO-10. An industry with far more at stake concluded
> that a wide window costs more than it returns, which argues against buying a wider one here.

> **Why a migration verifies twice (R-MFILE-24).** Verifying before converting establishes that what
> is about to be rewritten was intact, so a migration cannot launder pre-existing corruption into a
> new format and call it converted. Verifying after establishes that conversion itself broke nothing.
> Either check alone leaves a hole large enough to lose a photograph through.

## 9. This document's bump test

Required of every normative document by `version-requirement.md` R-PUB-1. This test is measured on
**meta files**, which is what this document puts into a copy.

| Level     | Test                                                                                                                                                                                                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MAJOR** | A meta file written under the previous version would parse differently, change meaning, or become invalid; or a field is removed, renamed, or reinterpreted; or an obligation is withdrawn or narrowed; or the document language or obligation vocabulary changes (`version-requirement.md` R-PUB-9). |
| **MINOR** | Additions only. Every meta file written under the previous version keeps its exact meaning, and every field it carries is still read the same way.                                                                                                                                             |
| **PATCH** | Prose improvement that changes no obligation and changes no meta file.                                                                                                                                                                                                                        |

> **Why this document exists, and why its MAJOR is the format break.** The specification governing
> Turbo-Collection's behavior bumps MAJOR for several reasons, and most of them touch no file on any
> drive. Using that number to tell a reader whether a manifest still parses would make it a proxy,
> and a proxy fires when the thing it stands for did not happen. A document that contains nothing but
> the format has no such gap: its MAJOR is a format break by construction, because there is nothing
> else in it to break.

---

## 10. Change ledger

Required by `version-requirement.md` R-PUB-6. No version has been published yet (R-PUB-3), so the
entry below is informal; a draft carries no obligations and receives no per-ID ledger entries.

| Version     | Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.0-draft | 2026-08-27 | First draft, extracted from `turbo-collection-spec.md` so that a format break is a document version rather than a proxy. Carries the manifest format (formerly R-INT-1 and R-INT-4), the receipt format (formerly R-REC-1, R-REC-2, R-REC-3, R-REC-4, R-REC-9), configuration naming and contents (formerly R-CFG-1 in part, R-CFG-2 and R-CFG-6), `README.md` (formerly R-TGT-10), and stamping, self-evidence, the support window and migration (formerly R-VER-3, R-VER-4, R-VER-5, R-VER-6, R-VER-15, R-VER-16). New: R-MFILE-1's rule that an extension states a meta file's format, R-MFILE-4's bare `version` field, R-MFILE-5's ignore-and-preserve rule for unknown fields, and R-MFILE-20 and R-MFILE-21's ignore file. Behavior stays in the core, which is where a rule about when Turbo-Collection writes, and how it validates what it reads, belongs. |
| 0.1.0-draft | 2026-08-28 | Per-directory meta files renamed to a `.tc-` prefix: `manifest.json` becomes `.tc-manifest.json` (R-MFILE-2, R-MFILE-8) and the receipt becomes a set of per-run records named `.tc-receipt-<run>.json` (R-MFILE-2, R-MFILE-13). The receipt is now an append-only ledger: a run writes one record and never reopens an earlier one (R-MFILE-13, R-MFILE-14), replacing the single rewritten file, because a receipt accumulates events while a manifest is a snapshot. R-MFILE-8 generalized from "cover every file, but not itself" to "cover every content file, but no meta file," which the multiple receipts and the `.tc-` prefix made both necessary and clean. What a refusal records (R-MFILE-16) is unchanged and still under discussion. |
| 0.1.0-draft | 2026-08-29 | Per-directory meta files moved off the `.tc-` prefix and into a `.turbo-collection/` subdirectory of each content directory, holding `manifest.json` and per-run `receipt-<run>.json` records (R-MFILE-2, R-MFILE-8, R-MFILE-13). The prefix had been a sorting convention to keep the manifest and receipt out of the way of the content; the 2026-08-28 ledger turned one receipt into many, which a directory boundary collapses to a single entry however many runs accumulate. The subdirectory carries the identity, so the files inside drop the prefix, and a directory boundary rather than a name test separates meta from content. Root files (`turbo-collection-config.json`, `README.md`, `.tcignore`) stay visible and self-describing, as the files a person is meant to find. The receipt's `refusals` became `errors` (R-MFILE-13, R-MFILE-14, R-MFILE-16): an error records any file a run failed to copy, whether on import or on mirror, and its shape is a core-understood `message` plus an opaque importer- or adapter-defined `details`, alongside the file it concerns and the `importSource` or `copyName` it involves. An arrival's `copy` became `copyName`, matching the configuration field (R-MFILE-15, R-MFILE-18). A per-run record now states its `runId` first after `version` (R-MFILE-14), and receipts are named `receipt-<runId>.json`. R-MFILE-8 dropped its "no meta file" clause, which the `.turbo-collection/` subdirectory exclusion now covers. |
| 0.1.0-draft | 2026-09-05 | Manifest fields finalized field by field. `specVersion` removed from the manifest (R-MFILE-9) and added to the per-run receipt record (R-MFILE-14), because the core-spec version is uniform across a run rather than varying per directory the way a layout convention does, so it is recorded once per run where it varies rather than stamped on every directory. `layoutConvention` now names the layout convention by its convention identifier rather than a specification filename, and `checksumAlgorithm` states `SHA-256` explicitly (R-MFILE-9). `checksum` values are lowercase hexadecimal and `file` names preserve casing verbatim (R-MFILE-10). `date` reworked (R-MFILE-11): the import source sets the value and its meaning, Turbo-Collection does not interpret it, the format is ISO 8601 with a best-effort UTC offset, and a filesystem timestamp is forbidden as a source. Manifest `files` entries are ordered by a locale-independent case-insensitive comparison (R-MFILE-12). `contentDigest` construction pinned (R-MFILE-15): SHA-256 of the content files' lowercase-hex checksums, sorted ascending and newline-joined. |
| 0.1.0-draft | 2026-09-05 | **Peer model, and the manifest's identity blocks.** Terminology reframed: _Collection_ is the dataset held as peer copies, _Copy_ one physical instance, _Import source_ an instance (one specification each, which may reference one another). `R-MFILE-9` restructured: the flat `layoutConvention` and `layoutVersion` become a `layout` object with `specId` and `version`, and a new `importSource` object with `specId` and `version` records the import source instance that placed a directory (`importSource.specId` is also the directory's `<import source>` path segment) and the version of its specification that governs the directory, a current claim re-stamped per `turbo-collection-spec.md` R-SRC-16. Each block is thus a `{specId, version}` pinned-dependency shape. `R-MFILE-15` amended so every arrival states `importSource`; the "an arrival recording a mirror states no `importSource`" clause is withdrawn, because provenance is uniform across peer copies. `R-MFILE-18` amended: configuration is identity only, `version` and a non-empty `copyName`; `role` and `importSources` withdrawn. `R-MFILE-19` amended: name only, no role, and whole-run refuse on a name collision. `R-MFILE-16` and several commentaries reworded from mirror to reconcile; a stale `R-MFILE-17` citation corrected to `R-MFILE-19`. A field renamed and restructured makes this MAJOR by this document's bump test, but a draft is archived by nothing (`version-requirement.md` R-PUB-3). |
| 0.1.0-draft | 2026-09-07 | **The receipt session: per-event files.** The per-run record, one file with `arrivals` and `errors` arrays, becomes a set of per-event files (R-MFILE-13): one arrival per file, named `receipt-<runId>-<copyName>.arrival.json`, and a run's errors for a directory in one file, named `receipt-<runId>-<copyName>.error.json`, both immutable, so catching one copy up to another is a union of files and never a merge. `<runId>` is pinned to ISO 8601 basic format in UTC with a suffix, colon-free so it is a legal filename and time-sortable (R-MFILE-13); `copyName` enters the filename and is therefore constrained to a portable character set (R-MFILE-19). An arrival file (R-MFILE-14) carries `version`, `tcSpecVersion` (the core-spec version, renamed from `specVersion`), `runId`, `copyName`, `date`, `fileCount`, `contentDigest`, and, only for an import, `layout` and `importSource` as `{specId, version}` blocks plus optional `importSourceDetails`; a reconcile arrival carries neither block, its provenance traveling in the propagated import arrival (R-MFILE-15). An arrival is an honest snapshot of what was present, which may be partial; completeness is derived from a run leaving no error file, not from a field. An error file (R-MFILE-16) carries the common header plus an `errors` array; a top-level `copyName` names the copy each error concerns, so an entry keeps only `message` (required), optional `file`, optional `importSource` (whose absence marks a reconcile error), and optional `details`. Receipt files propagate on reconcile (`turbo-collection-spec.md` R-REC-6), which is what lets one drive report another copy's state and what guards a receipt against hand-editing (divergence between immutable twins), with the lone-copy limit acknowledged. An arrival's `date` is a full ISO 8601 date and time with a mandatory time-zone offset, set from the run's own clock, since unlike an import source's `date` Turbo-Collection always knows its own zone (R-MFILE-14). |
| 0.1.0-draft | 2026-09-10 | **Receipt edges pinned.** Four under-specifications left open at the close of the receipt session settled. `R-MFILE-13`: a receipt file's `copyName` names the copy an event concerns, which is not always the copy the file resides on, so a reconcile error, whose named destination failed and often cannot hold its own file, MUST be written on the copy being reconciled from, beside the content the failed transfer was driving from; a new commentary states this and notes that where no copy the run touched is writable only the log records the failure (`turbo-collection-spec.md` R-LOG-1), leaving R-LOG-5 intact because a reconcile error concerns copy count, not whether an import source may be deleted. `R-MFILE-19`: the name-collision refusal now folds letter case, since a difference of case alone names one file on a case-insensitive filesystem where `copyName` is a filename component. No format field changed; a draft is archived by nothing (`version-requirement.md` R-PUB-3). |
| 0.1.0-draft | 2026-09-10 | **The location receipt.** A third receipt type joins the arrival and the error: a location receipt (R-MFILE-26), stored in a `.turbo-collection/` at the copy root (R-MFILE-2) rather than in a content directory, recording where a copy is as a hint for finding it and stating only that copy's own location. One file per observation, named `receipt-<runId>-<copyName>.location.json`, immutable like every receipt file. Its fields are `version`, `tcSpecVersion`, `runId`, `copyName`, `date`, an optional `volumeId` (a `null` value equivalent to absent), and an always-relative `relativePath` whose anchor is the volume root when `volumeId` is present and the receipt file's own directory when it is absent. The stored path is never absolute; the absolute path is derived at run time (`turbo-collection-spec.md` R-REC-9). Additive: no existing field or file changed, and a draft is archived by nothing (`version-requirement.md` R-PUB-3). |
