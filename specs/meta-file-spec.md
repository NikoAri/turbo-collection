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

- **Collection.** The authoritative tree of files this project preserves.

- **Copy.** The collection, or a mirror of it held elsewhere.

- **Content file.** A photograph or a video held in a copy, preserved untouched.

- **Meta file.** A file Turbo-Collection writes into a copy that describes that copy or what happened
  to it: a manifest, a receipt, a configuration file, an ignore file, a `README.md`, and any copy of
  a specification carried on a drive.

- **Item.** One logical thing supplied by an import source, which may comprise several content files.

- **Import source.** One way of getting original bytes into the collection, such as iCloud or a
  camera card.

- **Manifest.** The meta file recording a checksum for each file in one directory (R-MFILE-8).

- **Receipt.** The record of every arrival of a directory's content at a copy and every error
  affecting it, written as one file per run (R-MFILE-13).

- **Arrival.** One event of a directory's content reaching one copy.

- **Error.** One event of content a run handled failing to reach a copy: an item an import source
  offered that Turbo-Collection did not take, or a collection file that failed to reach a target.

- **Fixity.** Evidence that data has not changed, established by comparing checksums.

- **Content digest.** A checksum computed over the checksums of a directory's content files, in a
  deterministic order.

- **Format version.** The version of this document, which every meta file states (R-MFILE-4).

- **Ignored file.** A file in a copy that matches a pattern in that copy's ignore file (R-MFILE-20).

- **Run.** A single invocation of Turbo-Collection, which performs its work once and exits.

- **Migration.** Converting a copy written under an older MAJOR version of this document to the
  current one (R-MFILE-24).

## 2. Naming and placement

| ID            | Requirement                                                                                                                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R-MFILE-1** | A meta file's format MUST be determinable from that file's name alone, without reading its content. Turbo-Collection MUST NOT read a meta file whose name it does not recognize, and MUST report such a file instead.                     |
| **R-MFILE-2** | Turbo-Collection MUST use these names and places, relative to a copy's root: `turbo-collection-config.json` and `.tcignore` and `README.md` at the root; and, for each directory holding content, a `.turbo-collection/` subdirectory of that directory holding a manifest named `manifest.json` and per-run receipts named `receipt-<runId>.json`. A carried copy of a specification MUST be named for the document and the full version of the text it holds. |

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
> maintains for itself inside the tree, a directory's manifest and its receipts, go instead into a
> `.turbo-collection/` subdirectory of that directory. One entry beside the content holds all of them,
> however many per-run receipts a directory accumulates, so the machinery stays out of the way of the
> photographs a person browses, and a directory boundary rather than a name prefix separates meta from
> content. The subdirectory carries the identity, which is why the files inside are named plainly:
> `manifest.json` and `receipt-<runId>.json` need no prefix to say whose they are, because the directory
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
> has already said what it is and how it parses, so its own `version` can only mean which version of
> that format it holds. Fields naming other documents, `specVersion` and `layoutConvention`, are
> qualified because they point outward. Bare for self, qualified for everything else.

> **Why unknown fields are ignored rather than rejected, and why that needs no minor number.** An
> addition that older software can ignore safely is not a break, so the format version does not move
> for it at all. Preserving unknown fields verbatim matters at the append leg rather than the mirror
> leg: R-REC-6 copies a receipt to a target byte for byte, while a collection's own receipt is
> rewritten, and a rewrite that dropped fields it did not understand would quietly destroy what a
> newer writer recorded. A field that changes how an existing field must be read is not an addition
> at all, and is MAJOR under Section 10.

## 4. The manifest

| ID             | Requirement                                                                                                                                                                                                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-MFILE-8**  | Turbo-Collection MUST record a SHA-256 checksum for every content file in a directory, in a manifest stored in that directory's `.turbo-collection/` subdirectory and named `manifest.json`. A manifest MUST cover the content files of the directory it describes, and MUST NOT cover a subdirectory, which excludes both a nested content directory and the `.turbo-collection/` directory the meta files sit in. A directory holding no content file needs no manifest. A manifest MUST NOT cover an ignored file. |
| **R-MFILE-9**  | A manifest's fields MUST be, in this order: `version` (R-MFILE-4); `specVersion`, stating the version of `turbo-collection-spec.md` under which the directory was written; `layoutConvention`, naming the layout specification that placed the directory's content; `layoutVersion`, stating that specification's version; `checksumAlgorithm`, naming the algorithm the checksums were computed with; and `files`, an array holding one object per covered file. |
| **R-MFILE-10** | Each entry in `files` MUST state, in fields of these names: that file's name (`file`), that file's length in bytes (`size`), and that file's checksum (`checksum`). A `file` field MUST state a name only, and MUST NOT state a path. |
| **R-MFILE-11** | An entry MAY also state the capture time read from that file's own content (`date`), in local wall-clock time. Turbo-Collection MUST NOT derive a `date` from a filesystem timestamp, and MUST omit the field where it read no capture time from that file's content. |
| **R-MFILE-12** | A manifest MUST be written with whitespace that places each file entry on its own line.                                                                                                                                                                                                                                                                |

> **Why a copy's root files are covered by no manifest.** A root holds no content file, so it gets
> no manifest, and `turbo-collection-config.json`, `.tcignore` and `README.md` are therefore
> checksummed nowhere. This is a decision rather than an oversight. Fixity protects what cannot be
> recreated: a photograph is irreplaceable, while a configuration file can be retyped, an ignore file
> re-pasted from the public lists it came from, and a `README.md` regenerated. Covering them would
> also mean recording checksums for three files that exist to be edited by hand, so every ordinary
> edit would report a mismatch until someone rebuilt the record, and a fixity report that fires
> during normal use teaches a person to ignore fixity reports. What protects those files instead is
> R-CFG-3 and R-CFG-4 in `turbo-collection-spec.md`, which validate configuration before any
> filesystem mutation and fail rather than guess; R-MFILE-17, which refuses to run when two connected
> copies claim one name; and R-MFILE-21's per-pattern match counts, which make a mutated ignore
> pattern visible on the next run.

> **Why a manifest vouches rather than inventories.** A manifest states that the files it lists are
> intact. It does not assert that its directory holds nothing else, because ignored files exist and
> the patterns that define them live at a copy root, which a separated directory does not carry.
> Detecting an unexpected file is a run's job, where configuration is in hand, and a run reports one
> (R-MFILE-21). What a separated directory can still do alone is prove its own photographs are
> intact, which is the job it has.

> **Why a date is optional, and why its absence says something.** A `date` is present when a
> capture time was read out of a file's own bytes, and absent when none was, whether because the file
> carries none or because the import source that supplied it cannot read that format. Absence is
> therefore a record rather than a gap: it says the directory this file sits in was chosen without a
> date the file itself states. Recording the value rather than a flag also lets a tree be audited, or
> rebuilt, from manifests alone rather than by re-reading embedded metadata across a whole
> collection.

> **Why a filesystem timestamp is never that date.** A creation or modification time describes a
> copy, not a photograph. Mirroring to a new drive rewrites it, restoring from a backup rewrites it,
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

> **Why every directory restates `specVersion` and `layoutConvention`.** It duplicates one fact
> thousands of times, and that is the point. Duplication is cheap, drift between directories is
> detectable, and a directory that gets moved, mailed, or restored on its own reconstructs what
> governed it. It is also the only thing that lets a future reader tell which of two independent
> implementations wrote which directory under which rules.

## 5. The receipt

| ID             | Requirement                                                                                                                                                                                                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-MFILE-13** | Turbo-Collection MUST maintain a receipt in every directory into which it writes a content file, and in every directory in which it recorded an error affecting that directory's content. A receipt is a set of per-run records, each stored in that directory's `.turbo-collection/` subdirectory and named `receipt-<runId>.json`, where `<runId>` identifies the run and orders the records by the time the run occurred. A receipt MUST record every arrival of that directory's content at a copy and every error. Turbo-Collection MUST NOT modify a record after writing it. |
| **R-MFILE-14** | A per-run record's fields MUST be, in this order: `version` (R-MFILE-4); `runId`, identifying the run that wrote the record; `arrivals`, an array holding one object per arrival; and, where that run recorded any error, `errors`, an array holding one object per error. A record MUST be written with whitespace that places each arrival and each error on its own line.                                                                                                                                                 |
| **R-MFILE-15** | Each arrival MUST state, in fields of these names: the copy reached (`copyName`); the date it was reached (`date`); the number of content files present in the directory at that moment (`fileCount`); and a content digest (`contentDigest`). An arrival recording an import MUST also state the import source that supplied the content (`importSource`), and MAY state further detail about that import (`importSourceDetails`). An arrival recording a mirror states no `importSource`, because propagation of content already in the collection has no import source. An `importSourceDetails` value MUST be a JSON object whose contents that import source's own specification states, and Turbo-Collection MUST NOT depend on its contents. A content digest MUST cover content files only, so that no meta file contributes to it. |
| **R-MFILE-16** | Each error MUST state a human-readable description of what went wrong (`message`), in plain language and intelligible without the importer or adapter that produced it; the description is best-effort and MAY be incomplete. An error MAY also state the file it concerns (`file`); the import source that produced it (`importSource`) or, for an error on a mirror, the copy it failed to reach (`copyName`); and further detail (`details`). A `file` value states whatever identifies the file that failed and MAY be a path, and is not bound by R-MFILE-10's name-only rule, because an error may name a source item or an intended collection path no manifest covers. A `details` value MUST be a JSON object whose contents the piece that produced the error states in its own specification, and Turbo-Collection MUST NOT depend on its contents nor act on any field within it. |

> **Why the receipt is a set of per-run records, while the manifest is one file.** A manifest states
> what a directory holds now, so recomputing and rewriting it whole is the operation that fits it. A
> receipt instead accumulates events that never restate the past, and rewriting a whole file to append
> one event would reread and rewrite all of history, scale its cost with the record's age, and lean on
> an atomic replace. A run writes one new record and never reopens an earlier one, so an append cannot
> lose or corrupt what came before, and a copy on removable media needs only an atomic create.

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
> error is anchored by its `importSource` and a mirror error by the `copyName` it failed to reach,
> mirroring how an arrival names one and not the other.

## 6. Configuration and the ignore file

| ID             | Requirement                                                                                                                                                                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R-MFILE-17** | Configuration MUST be plain data in a text format a person can read and edit, and that a tool other than Turbo-Collection can parse. It MUST be named `turbo-collection-config.json` and MUST sit at the root of the copy it describes.                                                                                                          |
| **R-MFILE-18** | A configuration file's fields MUST be, in this order: `version` (R-MFILE-4); `role`, stating whether the copy is the collection or a target; `copyName`, stating the name receipts use for this copy; and `importSources`, declaring the import sources this copy imports from. |
| **R-MFILE-19** | Every copy MUST declare its own identity in its own configuration file. Turbo-Collection MUST determine a copy's role and name by reading that declaration, and MUST NOT infer either from a volume label, a mount path, a drive letter, or a command-line argument. Turbo-Collection MUST refuse to run when two connected copies state one name. |
| **R-MFILE-20** | A copy MAY carry an ignore file named `.tcignore` at its root. It MUST be plain text encoded in UTF-8, one pattern per line, with blank lines skipped and a line beginning with `#` treated as a comment. Pattern syntax and matching MUST follow `gitignore(5)`, evaluated relative to the copy root. |
| **R-MFILE-21** | Turbo-Collection MUST exclude an ignored file from every manifest and MUST NOT copy one to a target. Every run MUST report, per pattern, how many files that pattern matched. Turbo-Collection MUST report a pattern it cannot evaluate and MUST NOT apply it.                                                                                   |

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
