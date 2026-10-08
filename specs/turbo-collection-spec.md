# Turbo-Collection: Specification (Core)

> **Spec version:** 0.1.0-draft **Created:** 2026-07-12 **Status:** Draft. No
> implementation exists yet.

This document is the **normative source of truth** for what Turbo-Collection
must do. It is language-neutral and tool-neutral on purpose, so that the tests
and the implementation can be regenerated from it in any future implementation
language, in the way an RFC outlives any single implementation of a protocol.

This document carries its **own** glossary (Section 3), and does not defer it
elsewhere. Which document binds what, that the documents binding the
implementation are jointly sufficient, and how code cites and traces to them,
are governed by `traceability-requirement.md` (`R-META-*`). Which other
documents exist, and what each one governs, is mapped in `docs/spec-guide.md`,
which is navigation and binds nothing, so no obligation here depends on it.

---

## 0. Conventions

**Requirement keywords** (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY) are used as
defined in **RFC 2119**.

**Requirement IDs** in this document are domain-prefixed: `R-COL-1`, `R-SRC-7`,
`R-TGT-12`. Their stability, and uniqueness of a prefix across documents, are
governed by `language-requirement.md` R-LANG-20. A prefix belongs to exactly one
document, so an ID cited here without a document name is still unambiguous.
Prefixes cited by this document and defined elsewhere: `R-META-*` in
`traceability-requirement.md`, `R-DUR-*` in `durability-requirement.md`,
`R-MFILE-*` in `meta-file-spec.md`, `R-PHOTO-*` in `photo-path-layout-spec.md`,
`R-FOUND-*` in `as-found-path-layout-spec.md`, `R-INPLACE-*` in
`in-place-import-source-spec.md`, `R-LOCALFOLDER-*` in
`local-folder-import-source-spec.md`,
`R-PUB-*` in `version-requirement.md`, and `R-LANG-*` in
`language-requirement.md`.

**Document language.** This document is written in **American English**
(`language-requirement.md` R-LANG-21). Stating it here rather than only by
reference matters, because R-VER-8 scatters copies of this document onto every
copy, and `language-requirement.md` does not travel with them.

**Writing rules.** The language discipline this document is written under
(controlled vocabulary, one term per concept, the normative-text/commentary
split) is defined in `language-requirement.md`, which binds every normative
document in this project.

---

## 1. Scope, non-goals, and invocation

The diagram below _is_ Turbo Collection scope statement. It draws the line
between what this document owns, what the import source specifications own, and
what sits outside Turbo-Collection entirely. Note the two boundaries: one where
content enters by import, one where a copy is read and written on its medium,
and nothing vendor-specific between them.

```mermaid
flowchart LR
    IN["Import sources<br/>iPhone, iCloud, OneDrive,<br/>SD card, existing archive<br/>(specs/import-sources/)"]

    subgraph COLL["The collection: one dataset, many peer copies"]
        C["Peer copies<br/>each a plain tree + manifest"]
        C <-->|mirror| C
    end

    IN -->|import| COLL
```

Every copy is a plain tree carrying its own manifest, verifiable against it
independently and reachable as files on its medium (R-TGT-9). **Copies are
peers: no copy is privileged.** Mirroring is symmetric and add-only, filling
whichever copy lacks a file another holds, in whichever direction each file
needs; on a mismatch neither side is authoritative (R-INT-7). Fixity, not
location, is what establishes that data is intact.

### 1.1 In scope

The durable core: Import contract, Storage layout contract, Mirror semantics,
integrity, filename safety, meta file versioning, configuration, logging, and
the command-line contract.

### 1.2 Out of scope

| Concern                                                                        | Where it lives                                                                    |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Concrete Importers (iPhone, iCloud, OneDrive, SD card) and their format quirks | Import source specifications under `specs/import-sources/`, one per import source |
| _When_ a run happens (scheduling)                                              | Outside Turbo-Collection entirely. See Section 1.4.                               |

### 1.3 Non-goals (normative)

Turbo-Collection does **not** do the following, and MUST NOT grow them by
accident. Each has a documented path to becoming a goal later, in Section 10, so
that deferring them costs no architectural flexibility.

| Non-goal                                                     | Path to enabling it |
| ------------------------------------------------------------ | ------------------- |
| Albums and tags                                              | Section 10          |
| Captions, ratings, face recognition                          | Section 10          |
| Converting a Content file to an open format                  | Section 10          |
| AI search                                                    | Section 10          |
| A browsing graphical interface                               | Section 10          |
| Versioning and snapshots _of the collection_                 | Section 10          |
| Deduplication                                                | Section 10          |
| Modifying a file in place: restore, repair, manifest rebuild | Section 10          |
| Symbolic links and other entries that are not regular files  | Section 10          |

> These are non-goals, not rejections. The distinction matters: a rejection
> means the idea is wrong, and a non-goal means it is simply not being built
> yet. Section 10 exists to prove the difference is real, by showing exactly
> what each would cost.

### 1.4 Invocation is external

Turbo-Collection is invoked from outside: by **a human on demand**, or by **an
OS scheduler**. Both are equal citizens, and both live outside the system.
Turbo-Collection contains no scheduling logic (R-CLI-2) and is fully usable with
no scheduler installed at all (R-CLI-6).

---

## 2. Guiding principles (normative)

These are the principles the requirements are derived from. Where a requirement
seems to conflict with a principle, the conflict is a defect, and one of the two
must change.

The project-wide durability axioms (plain data, redundancy, re-verification,
explicit guarantees, recoverability, and never destroying preserved data) now
live as requirements in `durability-requirement.md` (`R-DUR-*`). The two
principles below are specific to Turbo-Collection's own architecture.

- **The Core is indifferent to Import Sources.** The core knows nothing about
  how a file arrived or what medium a copy is stored on. It knows only the
  collection: plain trees and their manifests. Every fact about where a file
  came from lives in the importer that brought it in; every fact about the
  medium a copy sits on lives in that copy's storage (Section 6); none lives in
  the core.

- **A Record lives with the data it describes, never in a separate index.**
  There is no central database of what is stored where. A directory carries its
  own manifest (R-MFILE-8) and its own receipt (R-MFILE-13); every copy carries
  its own configuration stating what it is (R-MFILE-19), and optionally its own
  copy of this document (R-VER-8); no
  memory of an import source is kept between runs (R-SRC-13). A separated
  directory therefore stays interpretable, and there is no index whose loss
  makes surviving media unreadable. The cost is accepted deliberately: records
  are repeated across copies rather than centralized, which is redundancy
  (`R-DUR-2`) applied to metadata.

---

## 3. Terminology

Self-contained, per `language-requirement.md` R-LANG-5.

- **Turbo-Collection.** This system: the orchestrator, its importers, its
  copies' storage, and its mirror engine.

- **Collection.** The set of files this project preserves: photographs and
  videos, and any other file an import brings in (R-SRC-20). It is one logical
  dataset, held as one or more **peer copies**, each a plain tree (R-COL-1).
  This is the data Turbo-Collection exists to protect. (The word "library" is
  deliberately avoided, because it collides with "code library".)

- **Plain tree.** A directory structure that holds every Content file as
  **exactly one file**, **byte-identical** to what an Importer supplied, at a
  path derived from its path in the Collection, and **retrievable without any
  Turbo-Collection software**. A cloud bucket holding one object per file
  qualifies. A chunked, deduplicated, or encrypted repository does not. This
  definition is load-bearing: R-COL-4 and R-TGT-6 both test against it, so it
  must be decidable by inspection rather than by judgment.

- **Layout.** A rule that determines where in the collection a content file is
  stored, given that file's own bytes, the metadata its import source supplied
  with it, and that import source. R-COL-4 requires every copy to follow the
  same layouts, and R-SRC-10 requires a layout to depend on nothing beyond those
  three. Each layout is defined by its own specification, which states which
  items that layout is able to place (R-SRC-15) and carries the identifier and
  version a manifest records for it (`meta-file-spec.md` R-MFILE-9). Layouts
  coexist: each import source specification names one as its primary layout, and
  the as-found layout takes every item a primary layout is not able to place
  (R-SRC-20), so that this document binds no particular directory shape.

- **Primary Layout.** The one layout that an import source specification names
  to govern that import source's items (R-SRC-15).

- **As-found Layout.** The layout that stores a file at the path its import
  source supplied for it, defined by `as-found-path-layout-spec.md`. It is the
  Primary Layout of the in-place Import Source (R-CLI-12), and the floor that
  takes every item a primary layout is not able to place (R-SRC-20).

- **Import Source.** One way of getting files into the Collection, such as
  iCloud or a camera card. An import source is an **instance**: a personal and a
  work iCloud account are two import sources, each named by the operator
  (`icloud-personal`, `icloud-work`). An importer imports from exactly one
  import source; the leaf manifest records which import source placed a
  directory (its `importSource` block's `specId`, `meta-file-spec.md`
  R-MFILE-9), and R-SRC-10 admits that identifier into a collection path. What
  may be assumed about one import source is stated in its own specification
  under `specs/import-sources/`, one specification per import source, which also
  names that import source's primary layout (R-SRC-15); such specifications may
  reference one another.

- **Importer.** The component that brings files into the Collection from one
  **Import Source**. An importer is internal to Turbo-Collection and reaches
  exactly one import source; an import source is the outside origin files are
  imported from.

- **Import.** Bringing files into the collection from an import source,
  performed by an importer.

- **Copy.** One physical instance of the collection, held on one storage medium.
  Copies are **peers**: no copy is privileged, each carries its own manifest and
  is verifiable against it independently (R-TGT-9), and mirroring is symmetric
  among them.

- **Medium.** Where a Copy is stored: a local drive, a removable drive, or a
  cloud bucket. A Copy is read and written as plain files on its medium, by
  import, mirror, and verify alike. Each copy declares what its medium can and
  cannot guarantee (R-TGT-5).

- **Content File.** Any file a copy holds that is neither a meta file nor an
  ignored file. Photographs and videos are one kind of content file; where each
  kind is placed is decided by layout specifications (R-SRC-15), not by this
  document. Several requirements are scoped to content files, because a rule
  that protects a photograph from being altered would otherwise forbid
  Turbo-Collection from writing down what it did.

- **Meta File.** A file Turbo-Collection writes into a copy that describes that
  copy or what happened to it: the configuration file, the ignore file, a
  manifest, a receipt, and any copy of a specification carried on a drive. What
  each one is called, where it sits, and what is inside it are stated by
  `meta-file-spec.md`. Content files are preserved untouched, exactly as they
  arrived. Every file in a copy is a content file, a meta file, or an ignored
  file. A log is none of these, because a log is never written inside a copy
  (R-LOG-5).

- **Ignored File.** A file in a copy that matches a pattern in that copy's
  ignore file, `.tcignore` (`meta-file-spec.md` R-MFILE-20). Turbo-Collection
  records no ignored file in a manifest and mirrors none to another copy
  (R-MFILE-21).

- **MAJOR Version.** All versions of this specification that share a MAJOR
  number (for example, the 2.x line).

- **Init.** The operation that creates a directory for new copy with no other
  copy present, which is how a collection's first copy comes to exist
  (R-CLI-11).

- **In-place Import.** An Import of files already inside a Copy, from that
  Copy's in-place Import Source (`in-place-import-source-spec.md`). It records
  each file at the path it has and moves none (R-SRC-7). Init performs one as it
  makes a directory a Copy (R-CLI-12), and an operator starts any later one.

- **Backup.** The operation an operator runs to bring the collection's peer
  copies into agreement, so the collection survives the loss of any one copy
  (R-CLI-5). Its mechanism is a non-destructive, symmetric mirror across those
  copies (Section 7.1); recovering data from a copy is _restore_. A backup given
  an empty directory, or one that does not exist, creates a new copy there
  (R-CLI-13); every copy after the first comes to exist this way.

- **Procedure.** A normative document stating the steps a Human operator
  performs to achieve a result this specification requires. It binds the
  operator, not the implementation (R-META-4).

- **Mirror.** To bring peer copies into agreement by copying to a copy any
  content file another copy holds and it lacks (R-MIRROR-1), and recording each
  arrival in the receipt of each directory written (R-REC-5). Mirroring is
  **symmetric** (no copy is privileged; it fills whichever copy is missing a
  file, in whichever direction each file needs) and **add-only** (it never
  overwrites a differing file and never deletes). Both the transfer and its
  record are parts of one operation; a transfer whose arrival is unrecorded is
  an incomplete mirror. The mirror is the mechanism the **backup** operation
  performs.

- **Manifest File.** A JSON file recording a checksum for each file in a copy,
  together with the hash algorithm and the specification version that produced
  it (R-MFILE-9).

- **Receipt File.** A per-directory record of the arrivals of that directory's
  content: where it came from, and the dated arrival of that content at each
  copy (R-MFILE-13). A manifest states what is present now and can be rebuilt by
  rescanning; a receipt states what happened and can be rebuilt from nothing.

- **Arrival.** One event in which content reaches a Copy: an importer bringing
  external bytes into a Copy, or a Mirror bringing to a Copy content another
  Copy already holds. Arrivals are what change the number of copies holding a
  file, and are therefore the only events a receipt records (R-MFILE-13).

- **Dry-run.** A mode in which Turbo-Collection reports what an operation would
  do and mutates nothing (R-SRC-14, R-MIRROR-7).

- **Temporary file.** A file Turbo-Collection creates in a copy while writing
  another file, and which never becomes a complete file at its final path.
  Removing one is the single carve-out from R-MIRROR-3 (R-MIRROR-8).

- **Fixity.** Evidence that data has not changed or corrupted, established by
  comparing checksums.

- **Capability.** A statement by a Copy's storage about what it can and cannot
  guarantee (R-TGT-5). Re-evaluated every Run.

- **Run.** A single invocation of Turbo-Collection, which performs its work once
  and exits.

- **Grouping.** A named set of items within the collection (an album, a tag).
  **Defined here but reserved:** groupings are a non-goal for now (Section 1.3).
  The term is fixed in advance so that the extension path in Section 10 has a
  name to use.

---

## 4. Collection invariants (`R-COL-*`)

These constrain the collection itself. They outrank everything else in this
document: any requirement that conflicts with them is wrong and must be changed.

**R-COL-1.** The Collection MUST be a plain directory tree of ordinary files.
Turbo-Collection MUST NOT introduce a database, archive, container, or any other
format that requires software to read the files back.

**R-COL-2.** Turbo-Collection MUST preserve every Content file byte-for-byte,
exactly as an Importer supplied it. It MUST NOT transcode, recompress, resize,
or strip metadata from a Content file, under any circumstance.

**R-COL-3.** The Collection MUST remain fully usable without Turbo-Collection.
Any ordinary file manager or file-copy tool MUST be sufficient to browse it and
recover its contents.

**R-COL-4.** **Every** Copy MUST be a plain tree, laid out under the same
layouts, so that a Content file's path is derived the same way in every Copy. A
Copy MAY lack a Content file that another Copy holds: a file imported into one
Copy and not yet mirrored, or a file a person removed from one Copy.
Turbo-Collection resolves such a difference only by adding the file where it is
absent (R-MIRROR-1), never by deleting it where it is present (R-MIRROR-3).

> **Example.** A photo deleted by hand from one Copy is still in the others, and
> the next backup copies it back.

> **Rationale.** The plain-files thesis and add-only shape behind these
> invariants: [design-record §2 and §3](../docs/design-record.md); the
> withdrawal that lets one copy hold files another lacks:
> [the append-only decision](../docs/decisions/2026-08-13-append-only-decision.md).

---

## 5. Import (`R-SRC-*`)

The Core must be indifferent to whether a photo arrived by cable, from iCloud,
through a OneDrive sync folder, or from something not yet invented.

This contract is specified completely enough (R-META-1) that **anyone can write
an Importer from this document alone, without modifying Turbo-Collection's
core.** That is the extensibility that matters. How importers are loaded is a
binding (Section 12), not a requirement.

**R-SRC-1.** Files MUST enter the collection only by Import. The Core MUST
contain no logic specific to any individual import source, device, vendor, or
service.

**R-SRC-2.** Adding support for a new Import Source MUST require writing only a
new Importer. It MUST NOT require changing the Core, this specification's
requirements, or any existing importer.

**R-SRC-3.** Which import sources a run draws from, and their settings, MUST be
supplied to Turbo-Collection as data rather than hardcoded in code. An import
source MUST be able to be added or removed without a code change.

**R-SRC-4.** Multiple import sources MUST be able to coexist and MUST be
importable independently. The failure of one import source MUST NOT prevent
import from another, and MUST still be reported.

**R-SRC-5.** An Importer MUST supply each item as plain files. An Importer
SHOULD supply every file unaltered, without transcoding, recompressing, or
stripping metadata, and where an Import Source offers a file in more than one
version SHOULD take the unaltered one. This is a best effort: Turbo-Collection
guarantees nothing about what an Import Source delivers, and preserves exactly
what an Importer supplies (R-COL-2). A vendor tool MAY be required to perform an
Import. A vendor tool MUST NOT be required to read a stored file. Where an
Import Source delivers content only inside a proprietary container, the Importer
MUST unpack it to plain files within the Import, and MUST refuse where it
cannot.

**R-SRC-7.** In an Import, Turbo-Collection MUST NOT delete, modify, move, or
rename a file at an Import Source that Turbo-Collection did not itself create.
An Importer MAY create files and directories of its own at an Import Source, and
MAY remove what it created.

> **Example.** An Importer may create an export folder and remove it afterward.
> It may not rename a folder a camera wrote, because that moves every file in
> it.

**R-SRC-8.** Import MUST be idempotent. Importing the same item twice MUST NOT
produce a duplicate in the Collection, and re-running an interrupted import MUST
converge rather than accumulate.

**R-SRC-9.** An item consisting of multiple files that are semantically one
thing (for example, a still image and its paired motion clip) MUST be imported
atomically: either all of its parts arrive, or none do. An importer MUST NOT
split such an item silently.

**R-SRC-10.** The Collection path of an item MUST be a pure function of the
item's own bytes, the metadata the import source supplies with it, and that
import source, under the layout that governs that item (R-SRC-15, R-SRC-20).

> **Example.** No `-2` suffix to disambiguate import order, and no directory
> named for a label a person adds after import.

**R-SRC-12.** **Import is additive.** Import MUST add files to the collection,
and MUST NOT delete, move, rename, or modify a file already in the collection.
If an import source no longer holds an item the collection already holds,
Turbo-Collection MUST take no action and MUST NOT report a discrepancy.

**R-SRC-13.** Turbo-Collection MUST NOT compute, record, or report which items
an import source no longer supplies. Turbo-Collection MUST hold no record of an
import source's contents between runs, and MUST establish that an item is
already imported by inspecting the collection rather than by comparing against a
previous state of the import source.

**R-SRC-14.** Turbo-Collection MUST support a Dry-Run Mode for import that
reports every item a real import would add to the collection, and mutates
nothing.

> **Example.** Before freeing space at an import source, an import dry-run that
> reports zero pending items shows everything there has already reached the
> collection.

**R-SRC-15.** Every import source specification MUST name exactly one Layout as
the primary layout of that import source. A layout specification MUST state
which items its layout is able to place, as a condition on an item's own bytes
and the metadata its import source supplies with it. Turbo-Collection MUST
determine an item's collection path under the primary layout of that item's
import source, wherever that layout is able to place the item. R-SRC-20 governs
an item that layout is not able to place.

> **Example.** Identical photo bytes are filed by date when imported from an
> import source whose primary layout is the photo layout, and stay where they
> sit in an In-place Import (R-CLI-12), where the layout is as-found. Bytes
> decide where an item goes within a layout, never which layout.

**R-SRC-16.** On importing into an existing import-source directory,
Turbo-Collection MUST compare the running import source's version against the
`importSource.version` that directory's manifest records (`meta-file-spec.md`
R-MFILE-9). If they share the same MAJOR line (`version-requirement.md`
R-PUB-1), Turbo-Collection MAY reuse the directory, and where it writes to it
MUST re-stamp `importSource.version` to the running version. If the running
version begins a new MAJOR line, Turbo-Collection MUST NOT reuse the directory,
and MUST place the imported content under a different import-source `specId`.
What compatibility an import source guarantees within a MAJOR line is stated by
that import source's own specification; the core does not adjudicate it.

**R-SRC-17.** An importer MUST NOT write into a copy of the collection, and MUST
NOT create, modify, or delete any meta file. Turbo-Collection alone writes
collection content and meta files: an importer supplies an item's content, and
Turbo-Collection reads it, determines the item's collection path (R-SRC-10), and
performs the write.

**R-SRC-18.** An importer MAY declare the number of items it expects to supply
in a run. Where it does, Turbo-Collection MUST compare that count against the
number of items it actually received from the importer, and MUST report any
mismatch.

**R-SRC-20.** **The floor.** Where the primary layout of an item's import source
is not able to place that item, Turbo-Collection MUST place the item under the
as-found layout (`as-found-path-layout-spec.md`), and MUST report every item
placed this way. Turbo-Collection MUST NOT leave an item out of the collection
because a layout is not able to place it.

> **Example.** A PDF on a camera card is not a photograph, so the photo layout
> cannot place it; it is stored under the as-found layout and reported, never
> skipped.

**R-SRC-21.** An importer MUST supply, with every file of every item, the path
that file has at its import source, relative to a root that import source's
specification states. This path is metadata the import source supplies
(R-SRC-10).

> **Example.** A supplied path is what lets the as-found layout place any item,
> so no item is ever without a place to go.

**R-SRC-22.** **Regular files only.** Where an Import would read a directory
entry that is neither a regular file nor a directory, such as a symbolic link, a
junction, a device, a socket, or a named pipe, Turbo-Collection MUST fail that
Import, MUST add no file to the Collection in that Import, and MUST report every
such entry. Turbo-Collection MUST NOT follow such an entry. Turbo-Collection
MUST pass over an entry that matches a pattern in the ignore file of the Copy
being imported into (`meta-file-spec.md` R-MFILE-21), and MUST NOT fail an
Import on account of such an entry.

> **Example.** A folder holds a symbolic link named `latest` that points at
> another folder. An Import of that folder fails, names `latest`, and adds
> nothing. Once a pattern matching `latest` is in the Copy's ignore file, the
> next Import passes over it and takes in everything else.

**R-SRC-23.** **Import never overwrites.** Where an Import would store a file at
a path at which the Copy being imported into already holds a Content File with
differing content, Turbo-Collection MUST NOT overwrite that Content File
(R-SRC-12), MUST leave the arriving file out of the Collection, and MUST report
every such file. Turbo-Collection MUST still import every other file of that
Import. A Run in which an Import reports such a file MUST exit with a non-zero
status.

> **Example.** A folder is imported, a document in it is then edited, and the
> folder is imported again. The Collection keeps the first version at that path,
> the edited file is reported and stays out, and every new file in the folder is
> still taken in. No second name is invented for the edited file (R-SRC-10).

**R-SRC-24.** **One directory, one provenance.** Where an Import would add a
file to a directory whose manifest names another Import Source or another Layout
(`meta-file-spec.md` R-MFILE-9), Turbo-Collection MUST NOT add that file to that
directory, MUST NOT change what that manifest names, MUST leave that file out of
the Collection, and MUST report every such file. Turbo-Collection MUST still
import every other file of that Import. A Run in which an Import reports such a
file MUST exit with a non-zero status.

> **Example.** A folder put into a Copy by hand at `local-folder/old-laptop/`,
> and recorded there by an In-place Import, has a manifest naming `in-place`. A
> later Import of a directory named `old-laptop` finds one file that folder
> lacks. That file is reported and stays out, because
> the manifest would otherwise name `in-place` for a file another Import Source
> brought.

> **Rationale.** Why an Importer's fidelity is a best effort, and why the
> import-source path segment and the version re-stamp are shaped this way:
> [the importer best-effort decision](../docs/decisions/2026-10-06-importer-best-effort-decision.md),
> [the import-source decision](../docs/decisions/2026-08-22-import-source-decision.md),
> [the append-only decision](../docs/decisions/2026-08-13-append-only-decision.md),
> and [design-record §2](../docs/design-record.md). Why an import source names
> its layout and nothing is skipped:
> [the layout-selection decision](../docs/decisions/2026-10-03-layout-selection-decision.md).
> Why an importer never writes into a copy:
> [design-record §5](../docs/design-record.md). Why an Import that meets a
> symbolic link fails:
> [the non-regular-files decision](../docs/decisions/2026-10-06-non-regular-files-decision.md).
> Why an Import leaves a differing file out, and neither fails nor renames it:
> [the import-conflict decision](../docs/decisions/2026-10-06-import-conflict-decision.md).
> Why a directory has one provenance:
> [the in-place importer decision](../docs/decisions/2026-10-06-in-place-importer-decision.md).

---

## 6. Storage (`R-TGT-*`)

What must hold of the Storage a copy sits on. A copy is **not merely a path**:
its storage declares what it can and cannot guarantee. (The `R-TGT-*` prefix
dates from when a copy was called a target. A requirement ID is never renamed,
per `language-requirement.md` R-LANG-20.)

**R-TGT-1.** Turbo-Collection MUST read and write a Copy as plain files on that
copy's medium. The core MUST contain no logic specific to any individual storage
medium, vendor, or service.

**R-TGT-2.** Adding support for a new kind of storage medium MUST require adding
only storage support for that medium. It MUST NOT require changing the core,
this specification's requirements, or storage support for any other medium.

**R-TGT-3.** Which copies a run acts on, and the storage settings each needs,
MUST be supplied to Turbo-Collection as data rather than hardcoded in code.

**R-TGT-4.** Multiple copies MUST be able to coexist and MUST be acted on
independently. The failure against one copy MUST NOT prevent the attempt against
another, and MUST still be reported.

**R-TGT-5.** A copy's storage MUST declare its capabilities: whether the copy is
a plain tree, whether it can be verified in place, whether it is remote, and
whether it can report a stable identifier for the volume the copy is stored on
(R-MFILE-26, R-REC-9).

**R-TGT-6.** **The plain-tree guarantee.** Turbo-Collection MUST refuse to run
if any copy it would act on does not declare itself a plain tree. This check
MUST happen before any work is done, enforcing R-COL-4 rather than merely hoping
for it.

**R-TGT-7.** A copy's storage MUST NOT modify, rename, move, or delete a file
already present in that copy, meta files included. Adding a new file the core
hands it is not a modification. Writing a copy's receipt is the core's
responsibility, never its storage's (R-REC-6).

**R-TGT-8.** A copy's storage MUST NOT delete a file it holds, and MUST NOT
expose an operation that deletes a file it holds. (This is the storage-level
counterpart of R-MIRROR-3, deliberately duplicated so that a defect in one layer
alone cannot destroy data.)

**R-TGT-9.** Each copy MUST carry, in each of its directories, a manifest
covering **that directory's own** contents (R-MFILE-8), so that the copy is
self-verifying without any other copy and without Turbo-Collection, and so that
any single directory remains verifiable when separated from the rest.

**R-TGT-11.** Every copy MUST be restorable by ordinary file copy, using no
Turbo-Collection software.

> **Example.** With Turbo-Collection gone, a finder restores a copy by copying
> its files off the drive with any file manager.

**R-TGT-12.** A copy's storage capabilities MUST be re-evaluated on every run
and MUST NOT be cached from a previous run. A copy that has ceased to be a plain
tree MUST be caught **before** it is written to, not after.

> **Rationale.** Why a copy is a declared plain tree rather than a bare path,
> and what a copy carries for a future finder:
> [design-record §4 and §5](../docs/design-record.md),
> [the peer-model decision](../docs/decisions/2026-09-05-peer-model-decision.md),
> and
> [the storage-hardware decision](../docs/decisions/2026-08-10-storage-hardware-decision.md).
> Why this section names storage and a medium, and no port:
> [the vocabulary decision](../docs/decisions/2026-10-05-spec-vocabulary-decision.md).

---

## 7. Preservation requirements

### 7.1 Mirroring (`R-MIRROR-*`)

The semantics of the mirror mechanism, as distinct from the storage contract in
Section 6. Mirroring is symmetric between peer copies, and is what the
**backup** operation (R-CLI-5) performs.

**R-MIRROR-1.** When mirroring two copies, Turbo-Collection MUST copy to each
copy every content file the other holds that is absent at it. If a **content
file** is present in both copies with differing content, Turbo-Collection MUST
NOT overwrite either copy, and MUST report the difference (R-INT-7). A meta file
MAY be replaced, under the conditions its own requirements state (R-REC-7 for a
receipt, R-INT-10 for a manifest).

> **Example.** Two copies hold different bytes at the same path: neither is
> overwritten, and the difference is reported.

**R-MIRROR-2.** Mirroring MUST be read-only with respect to every **content
file** already present in a copy. It MUST NOT modify, rename, move, or delete
one. Mirroring MUST record each arrival it makes in that directory's receipt,
and beyond the content files it adds and the meta files R-MIRROR-1 permits, MUST
write no other file into a copy (R-REC-5).

**R-MIRROR-3.** Turbo-Collection MUST NOT delete a file in any copy, and MUST
NOT provide a configuration setting or a command-line flag that permits deletion
in a copy. The single exception is R-MIRROR-8.

**R-MIRROR-4.** **Idempotence.** Mirroring copies already in agreement MUST
transfer no file data.

**R-MIRROR-5.** Turbo-Collection MUST support more than one copy and MUST treat
each independently: a failure against one MUST NOT prevent the attempt against
another, and MUST still be reported.

**R-MIRROR-6.** An interrupted run (power loss, disconnected drive, termination)
MUST leave a copy in a state from which a subsequent run converges to a correct
mirror. A run MUST NOT leave a partially-written file that a later run would
mistake for a complete one.

**R-MIRROR-7.** Turbo-Collection MUST support a dry-run mode that reports
exactly what a real run would transfer, and mutates nothing.

**R-MIRROR-8.** **The carve-out for incomplete work.** Turbo-Collection MAY
remove a temporary file (Section 3) that Turbo-Collection itself created.
Turbo-Collection MUST NOT remove anything else. A temporary file MUST be
identifiable as a temporary file by its name or its location, so that a human
can audit every such removal without Turbo-Collection.

> **Example.** A half-written `photo.jpg.part` from an interrupted run may be
> removed; `photo.jpg` may not.

**R-MIRROR-9.** Turbo-Collection MUST verify a content file against its copy's
manifest immediately before copying that file to another copy. Turbo-Collection
MUST NOT copy a file whose checksum does not match, and MUST report the
mismatch.

> **Example.** A file that corrupted silently in one copy is caught before it
> reaches a fresh copy.

> **Rationale.** Why mirroring is add-only and symmetric, and what that costs
> and buys:
> [the append-only decision](../docs/decisions/2026-08-13-append-only-decision.md)
> and [design-record §2](../docs/design-record.md).

### 7.2 Integrity (`R-INT-*`)

**R-INT-2.** Turbo-Collection MUST be able to verify any copy against a
manifest, and MUST report every discrepancy it finds.

**R-INT-3.** Verification MUST distinguish these outcomes per file, and MUST NOT
conflate them: **ok**; **missing** (in the manifest, absent on disk);
**corrupt** (present, but the checksum differs); **extra** (present on disk,
absent from the manifest).

**R-INT-5.** The manifest MUST record which hash algorithm produced it, so that
changing the algorithm later is explicit and detectable rather than silent.

**R-INT-6.** Verification MUST NOT repair, overwrite, or delete anything as a
side effect. It reports. Any repair MUST be a separate, explicitly requested
action.

> **Example.** Verification only reports; a verifier that "repaired" could
> overwrite a good copy with a bad one.

**R-INT-7.** On a mismatch between two copies' **content files** at the same
path, Turbo-Collection MUST report **which copies differ** and MUST NOT treat
any copy as authoritative. Choosing the surviving copy is a human decision. This
requirement MUST NOT be applied to meta files, which are per-copy records and
are expected to differ between copies.

**R-INT-8.** Turbo-Collection MUST report a **content file** that is **extra**
(present on disk, absent from its directory's manifest) as a finding, in
whichever copy it appears. A Run that reports one MUST exit with a non-zero
status (R-CLI-1). Turbo-Collection MUST NOT report a manifest as **extra** in
any copy, since R-MFILE-8 excludes it by design.

> **Example.** A file a person put into a Copy with a file manager is extra
> until an In-place Import records it (R-CLI-12). Until then no Backup carries
> it to another Copy, so a verify that finds it does not exit 0.

**R-INT-10.** Turbo-Collection MUST NOT replace a file's recorded checksum with
a newly computed one unless Turbo-Collection wrote that file's current content
itself. Rebuilding a manifest from a copy's present contents MUST be an action a
human explicitly requests, and MUST report every difference against the existing
manifest rather than overwriting it silently. Adding an entry for a file not yet
covered is not a replacement and is unrestricted.

> **Example.** A silent rebuild would hash a corrupted file and record its bad
> checksum as correct.

> **The manifest.** Its name, placement, fields, and format are stated by
> [`meta-file-spec.md`](meta-file-spec.md) (R-MFILE-8 through R-MFILE-12), the
> only document code may cite for them.

> **Rationale.** Why detection and repair are kept separate, why a manifest
> rebuild is never silent, and why JSON with nothing beside it:
> [the manifest-format decision](../docs/decisions/2026-08-16-manifest-format-decision.md)
> and
> [the append-only decision](../docs/decisions/2026-08-13-append-only-decision.md).

### 7.3 Filename safety (`R-NAME-*`)

**R-NAME-1.** Before copying, Turbo-Collection MUST check collection filenames
for hazards that do not survive a move between common filesystems, and MUST
report them. At minimum: characters reserved on some filesystems; names
differing only by case; Unicode normalization differences (NFC versus NFD);
trailing spaces or dots; reserved device names; and path lengths beyond common
limits.

**R-NAME-2.** Turbo-Collection MUST NOT silently rename a file to resolve such a
hazard. It reports; the human decides.

**R-NAME-3.** A filename hazard MUST NOT, by default, abort an otherwise valid
run. Hazards are reported as warnings, because a name that is harmless on
today's filesystem still needs backing up today.

### 7.4 Receipts (`R-REC-*`)

**R-REC-5.** Turbo-Collection MUST write an arrival file only **after** the
content that arrival covers has been completely written to the copy the arrival
names. The content an arrival covers is the content present in the directory at
that moment, which MAY be less than the whole directory; every file it covers
MUST be completely written, so that a partial arrival is still an honest
snapshot.

> **Example.** A run that dies mid-transfer leaves no arrival claiming the
> content arrived.

**R-REC-6.** On a mirror, Turbo-Collection MUST record an arrival as a receipt
file (R-MFILE-13, R-MFILE-14) for each directory into which it placed content,
and MUST bring both copies' receipt files to the union of the two for every
directory the mirror covers, not only those into which it placed content,
copying into a copy every receipt file the other holds that it lacks and never
overwriting one, since receipt files are immutable (R-MFILE-13). A directory in
which the mirror placed nothing gets no new arrival, because an arrival records
a placement and not a verification (R-REC-8), yet its receipt files still
converge, so one connected copy reports every copy's state for every directory
rather than only for those a given run changed. Every receipt write is the
core's responsibility; a copy's storage MUST NOT write a receipt (R-TGT-7).

**R-REC-7.** Turbo-Collection MUST NOT delete or alter a receipt file
(R-MFILE-13). An error therefore outlives the problem it describes: when the
content an error names later reaches the copy, the arrival is a new file and the
earlier error file remains, so the receipt states both events.

**R-REC-8.** A receipt records where content was **placed**, not where it
**remains**. Turbo-Collection MUST NOT treat a receipt as evidence that a copy
still exists or is still intact, and MUST NOT state a copy count derived from
receipts without stating the date of each arrival counted.

**R-REC-9.** Turbo-Collection MAY record a location receipt (R-MFILE-26) for the
copy it is operating on, stating that copy's `volumeId` and `relativePath` so a
later run can find the copy with fewer questions. It MUST write one only when
the copy's observed location differs from the most recent location receipt
already on record for that copy, so that an unchanged location does not
accumulate files. A location receipt locates a **candidate** only:
Turbo-Collection MUST confirm a copy's identity by reading its configuration
(R-MFILE-19) before treating a found copy as that copy or writing to it, and
MUST NOT infer identity from a matched `volumeId` or `relativePath`. The hint
MUST be optional and non-load-bearing: Turbo-Collection MUST function without
it, MUST fall back to asking when it is absent or no longer resolves, and MUST
NOT store an absolute path, deriving the mount point at run time from `volumeId`
through that copy's storage (R-TGT-5) instead. Location receipts propagate as
every receipt file does: on a mirror, Turbo-Collection MUST bring both copies'
copy-root location receipts to the union of the two, copying into each copy
every one the other holds that it lacks and never overwriting one (R-REC-6,
R-REC-7). A location receipt records where a copy was **observed**, not where it
**remains** (R-REC-8).

> **Example.** A matched `volumeId` says only "look here"; the copy's identity
> is confirmed from its own configuration (R-MFILE-19), never from the matched
> id, so a reformatted or swapped drive simply fails to resolve.

> **Rationale.** Why receipts exist and are not logs, record arrivals and errors
> but never verifications, stay immutable, and why a location hint never settles
> identity:
> [the receipts decision](../docs/decisions/2026-09-07-receipts-decision.md) and
> [the location-receipt decision](../docs/decisions/2026-09-10-location-receipt-decision.md).
> The receipt file format, with a worked example, lives in
> [`meta-file-spec.md`](meta-file-spec.md) (R-MFILE-13).

---

## 8. Operation: configuration, logging, and the command line

> **Rationale.** Why configuration travels with the collection, why a copy names
> itself, why init and backup are the only operations that create a copy, and
> why the read-only inspections are kept distinct:
> [the config-placement decision](../docs/decisions/2026-09-27-config-placement-decision.md),
> [the collection-naming decision](../docs/decisions/2026-09-28-collection-naming-decision.md),
> [the backup-naming decision](../docs/decisions/2026-09-27-backup-naming-decision.md),
> [the copy-creation decision](../docs/decisions/2026-09-30-copy-creation-decision.md),
> [the operation-taxonomy decision](../docs/decisions/2026-09-30-operation-taxonomy-decision.md),
> [the starter-ignore-file decision](../docs/decisions/2026-10-02-starter-ignore-file-decision.md),
> and [design-record §10](../docs/design-record.md).

### 8.1 Configuration (`R-CFG-*`)

**R-CFG-1.** Turbo-Collection MUST read a copy's own identity and any persisted
option from an external configuration file, whose contents `meta-file-spec.md`
states, rather than hardcoding them. It MUST NOT hardcode any path, and MUST NOT
require a copy to declare the other copies expected to exist, which are
discovered at run time.

**R-CFG-3.** Turbo-Collection MUST validate configuration **before** performing
any filesystem mutation. Invalid configuration MUST cause the run to fail
immediately, with no partial effect.

**R-CFG-4.** Turbo-Collection MUST fail rather than guess. A missing, ambiguous,
or unparseable setting MUST NOT be silently defaulted into a behavior that loses
data.

**R-CFG-5.** Turbo-Collection MUST be fully operable with configuration supplied
from the collection's own storage or on the command line, and MUST NOT require
configuration held on the host computer. A host-specific location MAY be
searched as a convenience; it MUST NOT be the only place configuration can live.

### 8.2 Logging (`R-LOG-*`)

**R-LOG-1.** Every run MUST write a plain-text log recording at minimum: start
time; end time; the configuration used; per import source, the count of items
imported and any refused items; per copy, the count and byte total of files
transferred; every error encountered; and the final outcome.

**R-LOG-2.** Logs MUST be observability only. The correctness of any copy of the
collection MUST NOT depend on a log file existing or being readable.

**R-LOG-3.** A run's log MUST record the Turbo-Collection version and the
specification version it conforms to, so that a past run's behavior can be
reconstructed.

**R-LOG-4.** Failures MUST be reported in the log even when the process exits
non-zero. A crash MUST NOT be the only evidence that something went wrong.

**R-LOG-5.** A log MUST NOT be the only record of an event that changes whether
material at an import source can safely be deleted. Such events are recorded in
receipts (R-MFILE-13); a log MAY additionally record them and MUST NOT be relied
on to. Turbo-Collection MUST NOT write a log inside a copy. A log MAY be written
elsewhere on a drive that holds a copy, and MAY be ephemeral and local to the
computer performing the run.

### 8.3 Command line (`R-CLI-*`)

**R-CLI-1.** Turbo-Collection MUST exit a Run with status **0** only where every
operation of that Run completed everything it was asked to do and found nothing
wrong, and MUST otherwise exit with a non-zero status. A report of what an
operation did, as distinct from a report of something an operation could not do,
refused to do, or found wrong, MUST NOT by itself cause a non-zero exit status
(Section 8.5).

**R-CLI-2.** **One-shot.** Turbo-Collection MUST perform one run and exit. It
MUST NOT daemonize, poll, or schedule itself. _When_ it runs is the
responsibility of whatever invokes it.

**R-CLI-3.** Turbo-Collection MUST be fully operable from a command line, with
no graphical interface required. A graphical interface, if one is ever built,
MUST be a consumer of this core and MUST NOT be a dependency of it.

**R-CLI-4.** Turbo-Collection MUST NOT require network access to back up to a
locally-attached copy.

**R-CLI-5.** Every operation MUST be independently invocable on demand, not only
as part of a combined run: **init**, **import**, **backup**, **status**, and the
verify inspections, **verify fixity** (R-INT-2), **verify access** (R-CLI-9),
and **verify names** (R-NAME-1). Dry-run MUST be a mode of **init** (R-CLI-11),
of **import** (R-SRC-14), and of **backup** (R-MIRROR-7), not a separate
operation.

**R-CLI-6.** Turbo-Collection MUST be fully usable with **no scheduler installed
or configured**. Scheduling is optional.

**R-CLI-7.** Effects MUST be identical whether Turbo-Collection is invoked by a
human or by a scheduler. Output formatting MAY differ (for example, progress
reporting on a terminal); effects MUST NOT.

**R-CLI-8.** An operation MUST NOT require an interactive prompt to complete,
because a scheduled run cannot answer one. Every option that changes what a run
does MUST be settable in configuration or by a command-line flag.

**R-CLI-9.** Turbo-Collection MUST provide a read-only **verify access**
inspection that transfers and modifies nothing, and that reports, for every
import source and copy a run would act on: whether it is reachable and
authorized; for a Copy, what capabilities its storage **currently** declares
(R-TGT-12); and whether the configuration would be refused (R-TGT-6).

**R-CLI-10.** Turbo-Collection MUST provide a read-only **status** operation
that reports, from receipts alone and with no other copy connected, which copies
each directory's content has reached, the date of each arrival, and the content
present that has reached no other copy. It MUST report every arrival's date
(R-REC-8), and MUST NOT state or imply that a copy still exists or is still
intact. What a status reports MUST NOT by itself cause a non-zero exit status.

**R-CLI-11.** Turbo-Collection MUST provide an **init** operation that makes the
directory it is given a copy, by writing into that directory a configuration
file (`meta-file-spec.md` R-MFILE-17) and, where no ignore file exists, an
ignore file holding the starter patterns that `meta-file-spec.md` describes
(R-MFILE-20). Init MUST create a directory it is given that does not exist
(R-CLI-14). Init MUST take
the new copy's `collectionName` from a name given on the command line, and MUST
use `main` where no name is given. Init MUST refuse to act on a directory that
is inside a copy or that contains a copy. Given a directory that is already a
copy, init MUST fail without changing anything, and MUST report that the
directory is already a copy.

**R-CLI-12.** Having made a directory a Copy, Init MUST perform an In-place
Import of that Copy (`in-place-import-source-spec.md` R-INPLACE-3). It is an
Import like any other: R-SRC-7 keeps each file where it is, and the As-found
Layout records it at the path it has (`as-found-path-layout-spec.md` R-FOUND-2).

> **Example.** A starter ignore file is written before the In-place Import, so a
> `.DS_Store` the OS scatters is not taken in as permanent content.

**R-CLI-13.** In a **backup**, Turbo-Collection MUST mirror every directory the
backup is given that is a copy (Section 7.1). Before mirroring, Turbo-Collection
MUST create a new copy in each directory the backup is given that does not
exist, or that holds no file at any depth except files matching a pattern in the
ignore file of the backup's existing copy. Turbo-Collection MUST refuse a backup
that would create a new copy unless that backup is given exactly one existing
copy. Turbo-Collection MUST refuse to create a new copy unless a name for the
new copy is given on the command line; that name becomes the new copy's
`collectionName`. To create a new copy, Turbo-Collection MUST write into its
directory a configuration file (`meta-file-spec.md` R-MFILE-17) and, where the
existing copy has an ignore file, a duplicate of that ignore file (R-MFILE-20).
Turbo-Collection MUST refuse to act on a directory given to a backup that is not
a copy and that holds any file not matching such a pattern, and MUST report
every file that directory holds.

> **Example.** A backup creates a copy only in an empty directory, so files
> already there are not pulled into the collection by the two-way mirror.

**R-CLI-14.** Turbo-Collection MUST NOT create a copy in any operation other
than **init** and **backup**, and in every other operation MUST refuse to act on
a directory given as a copy that is not a copy. Where init or backup creates a
directory, Turbo-Collection MUST create only the last segment of that
directory's path, and MUST refuse a path whose parent directory does not exist.

> **Example.** Only the final path segment is created, so a disconnected
> removable drive fails rather than building a copy on the local disk.

**R-CLI-15.** Turbo-Collection MUST be operable under more than one operating
system. The name and content of every file a Run writes into a Copy MUST NOT
depend on the operating system that Run is performed under. Turbo-Collection
MUST perform every operation on a Copy whichever operating system each earlier
Run that wrote to that Copy was performed under.

> **Example.** A Copy written to from a Mac is backed up on a borrowed Windows
> computer, and a later verify on that Mac finds nothing wrong.

**R-CLI-16.** When asked for its version, Turbo-Collection MUST report the
Turbo-Collection version and a version stamp (R-VER-18) for every specification
it conforms to. In answering, Turbo-Collection MUST NOT act on a Copy or on an
Import Source.

> **Example.** A version report lists `turbo-collection-spec 1.2.0 (2027-03-01)`
> and one such line for `meta-file-spec.md`, for each Layout specification, and
> for each Import Source specification the code conforms to.

**R-CLI-17.** A **verify** invoked with no inspection named MUST run every
verify inspection, against every connected copy. Where a receipt on a connected
copy names a copy that is not connected, verify MUST report that copy as not
connected, and that absence alone MUST NOT cause a non-zero exit status.

> **Example.** `verify` run while the off-site copy is away reports it as not
> connected and still exits 0, so a routine check does not fail by design every
> time.

### 8.4 Distinct read-only inspections

"Verify my collection" sounds like one request, but it is several. Each MUST be
separately answerable (R-CLI-5), because they fail in different ways and at
different times.

| Question                                                                                       | Operation                | Requirement |
| ---------------------------------------------------------------------------------------------- | ------------------------ | ----------- |
| Are my import sources and copies reachable, authorized, and still honoring what they promised? | **verify access**        | R-CLI-9     |
| Do the bytes on this copy still match the manifest? (fixity)                                   | **verify fixity**        | R-INT-2     |
| Would any filename fail to survive a move to another filesystem? (name hazards)                | **verify names**         | R-NAME-1    |
| How far apart are two copies? What _would_ a run transfer? (drift)                             | **backup**, dry-run mode | R-MIRROR-7  |
| What does this import source still hold that the collection lacks? (import-source coverage)    | **import**, dry-run mode | R-SRC-14    |
| How many copies hold this content, and when did each receive it? (propagation)                 | **status**               | R-CLI-10    |

> **Example.** `status` reads receipts, not bytes, so it reports which copies
> received content and when with no other drive connected; it never claims a
> copy still exists or is intact today (R-REC-8).

### 8.5 Exit status

A Run exits with status **0** only where it was fully successful, and with a
non-zero status otherwise (R-CLI-1). This specification distinguishes no failure
by exit status: a non-zero status says only that a Run was not fully successful,
and the report and the log say what happened (R-LOG-4).

> **Example.** An Import that leaves one differing file out and takes in every
> other file exits non-zero (R-SRC-23), as does a verify that finds one extra
> file (R-INT-8). A verify run while the off-site Copy is away exits 0
> (R-CLI-17), and so does an Import that places a file under the floor and
> reports it (R-SRC-20): each did everything it was asked to do and found
> nothing wrong.

---

## 9. Versioning and change (`R-VER-*`)

This section governs how this specification's own version is decided (9.2), and
how meta files declare the version that governs them (9.3).

> **Where the rest of it went.** How a normative document in this project is
> numbered, published, archived, and corrected is stated in
> [`version-requirement.md`](version-requirement.md), which binds every
> normative document here, including this one. Those rules bind the authors of
> documents, and code has nothing to cite in them. Everything left in this
> section binds the implementation.

### 9.1 The regress, and where it stops

Code is regenerable from this specification, so code need not be preserved. But
**this specification changes too**, which appears to relocate the problem rather
than solve it: now we must know which version a meta file was written under, and
we must preserve the specification itself. That is a real objection, and it is
answered in three moves.

1. **The specification is a meta file, and it travels with the data.** Every
   copy carries the version it was written under (R-VER-8). It is a few tens of
   kilobytes against terabytes; redundancy (`R-DUR-2`) authorizes this without
   argument. The specification cannot float away into abstraction, and it cannot
   die with a code-hosting service: it survives as long as any copy of the
   collection survives.

2. **Meta files are self-_evident_, not merely self-_described_** (R-MFILE-6). A
   version stamp tells a reader _which rules applied_; it MUST NOT be the _key
   to decoding_. A manifest is one checksum and one path per line: it can be
   read by looking at it, with no specification in hand. So losing the
   specification entirely is survivable. This property is available only because
   every format is plain text, which is the payoff of the choice already made in
   R-COL-1.

3. **Versioning does not require a decoder.** RFCs _are_ versioned, and
   rigorously: each is immutable once published, and a later RFC explicitly
   obsoletes or updates an earlier one. What RFCs never needed was a _version of
   English_. That is the distinction that matters: a binary format's version
   tells you **which decoder to use**, so losing its specification destroys the
   data; a prose specification's version tells you **which document you are
   reading**, and you can read it regardless. The chain of versions terminates
   in something a human, or an AI, can simply read. The regress stops, and it
   stops because of what the meta files are made of, not because versioning was
   avoided.

### 9.2 Version of this specification

**R-VER-1.** The bump of this specification's semantic version MUST be decided
by the effect on **behavior**. **MAJOR**: previously conforming behavior becomes
forbidden; or a contract (Section 11) changes so that an existing importer, or
existing storage support for a medium, stops conforming; or the document
language or obligation vocabulary changes (`version-requirement.md` R-PUB-9).
**MINOR**: additions only; everything conforming under the previous version
still conforms. **PATCH**: prose improvement with no behavioral consequence. A
change of meta file format is measured by `meta-file-spec.md`, and a change of
layout by the layout specification it belongs to, under each of their own bump
tests.

### 9.3 Stamps and self-evidence

**R-VER-8.** Every copy MUST record which specification version and which layout
governed the writing of its content. Every copy SHOULD additionally carry the
text of those documents, so that the rules governing the data survive alongside
the data; where carried, each MUST be named for the document and the full
version of the text it holds, as `turbo-collection-spec-<version>.md`.

**R-VER-9.** Code MUST declare which specification version it conforms to, and
every run MUST record that version in its log (R-LOG-3).

**R-VER-18.** A version stamp MUST state the name of the document it stamps, and
the publication date in ISO 8601 form, beside the number: for example,
`turbo-collection-spec 1.2.0 (2027-03-01)`.

> **Rationale.** Why document-lifecycle rules moved to `version-requirement.md`,
> and why this document's number tracks behavior:
> [the version-requirement split decision](../docs/decisions/2026-08-01-version-requirement-split-decision.md)
> and
> [the future-reader decision](../docs/decisions/2026-08-16-future-reader-decision.md).

---

## 10. Extension points: the path from non-goal to goal

Section 1.3 lists what Turbo-Collection does not do. This section is the
evidence that deferring those things costs no architectural flexibility. For
each one: what enabling it would require, which existing requirement already
carries it, and **what would not change**.

The last column is the real deliverable. A claim that an architecture is
flexible is worth nothing; a demonstration of what a change would cost is worth
something.

| Deferred goal                                                   | Path to enabling it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Already provided by                       | Core changes needed                                                                                                                                                                                                  |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Albums and tags** (groupings)                                 | A grouping is a plain-text list of members. **R-COL-2 already pre-decides the hard part**: membership can never live inside a photo's own metadata, because Content files are immutable, so it must be an external plain file. The manifest format (R-MFILE-9) is already exactly the shape of a membership list, so a grouping is a _subset of a manifest_: there is no new format to invent, and a JSON manifest has room for the fields a grouping needs beyond membership, such as curated order. R-MFILE-8's per-file SHA-256 supplies a stable identity that survives renames and reorganization. Grouping files are ordinary files in the collection, so they are mirrored, checksummed, and verified by machinery that already exists. | R-COL-2, R-MFILE-8, R-MFILE-9, R-MIRROR-1 | **None in the core.** One extension to the import contract (Section 11), so importers can report groupings. R-SRC-2 already anticipates exactly this.                                                                |
| **Captions, ratings, faces**                                    | The same shape: per-photo metadata in sidecar files beside the photo, never inside it (R-COL-2).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | R-COL-2                                   | None. Sidecars are ordinary files.                                                                                                                                                                                   |
| **Open-format conversions, and format-risk reporting**          | Proprietary formats (HEIC, HEVC, CR3, NEF, ARW) are a genuine long-term readability risk. A conversion step would write an open-format file rendered from each at-risk Content file, stored in addition to that file and never in place of it (R-COL-2), and a read-only report lists which formats in the collection are proprietary or single-vendor.                                                                                                                                                                                                                                                                                                                                                                                        | R-COL-2, R-MFILE-8                        | **One design, not yet made:** where a rendered file is stored, how it is identified as rendered, and whether it is mirrored or regenerated. The report needs no core change; it only reads data that already exists. |
| **Versioning and snapshots of the collection**                  | A copy using a repository format (restic, Borg, Kopia). **This is the one deferred goal that requires amending a requirement rather than merely adding storage support for a medium:** R-COL-4 would change from "every copy MUST be a plain tree" to "at least one copy MUST be", and R-TGT-6's check would relax from _all_ to _at least one_. The capability machinery (R-TGT-5) already exists to express it; such a copy's storage simply declares that it is not a plain tree.                                                                                                                                                                                                                                                           | R-TGT-1, R-TGT-2, R-TGT-5, R-TGT-6        | **One requirement amended (R-COL-4), one check relaxed (R-TGT-6), storage support for one medium added.** No structural change.                                                                                      |
| **Cloud off-site**                                              | A copy whose medium happens to be remote. It still stores one object per file, so it is a plain tree and satisfies R-COL-4 **today**, with no amendment at all. It declares itself remote via R-TGT-5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | R-TGT-1, R-TGT-5                          | None. Storage support for one more medium.                                                                                                                                                                           |
| **Deduplication**                                               | The manifest already holds a content hash for every file, so duplicate detection is a read-only report over data that already exists. Deliberately deferred: redundancy (`R-DUR-2`) holds that duplicates are cheap and often desirable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | R-MFILE-8                                 | None.                                                                                                                                                                                                                |
| **Restore, repair, and manifest rebuild**                       | Each would modify or replace a file already in a copy, which no operation does today (R-MIRROR-2, R-TGT-7). Until one is built, recovery is an ordinary file copy with any file manager (R-TGT-11), and choosing which copy survives a mismatch is a human decision (R-INT-7). Existing requirements already fix the shape such an operation would take: a separate action a human explicitly requests (R-INT-6), reporting every difference rather than overwriting silently (R-INT-10).                                                                                                                                                                                                                                                      | R-INT-6, R-INT-7, R-INT-10, R-TGT-11      | None to the plain tree. One operation added; whether it may overwrite a content file is the decision deferred with it.                                                                                               |
| **Symbolic links and other non-regular files**                  | A symbolic link holds no content of its own: what it points at lives elsewhere, possibly outside the directory being imported. Taking one in means first deciding what is preserved, the bytes it points at or a plain record of where it pointed, and neither is needed to preserve a regular file. Until that is decided an Import that meets one fails, adds nothing, and names it (R-SRC-22); a pattern in the ignore file passes over an entry an operator does not want taken in (R-MFILE-21).                                                                                                                                                                                                                                           | R-SRC-22, R-MFILE-21                      | **One design, not yet made:** whether a link is followed or recorded. One requirement amended (R-SRC-22).                                                                                                            |
| **Third-party importers and storage support loaded as plugins** | The import and storage contracts are already specified completely enough for anyone to implement either (R-META-1). Making them _dynamically discoverable at runtime_ is purely a loading mechanism: a registry, a discovery path, contract versioning. It is deferred because running third-party code against the collection is a trust decision, and because the machinery cuts against keeping the orchestrator thin.                                                                                                                                                                                                                                                                                                                      | R-SRC-2, R-TGT-2, R-META-1                | **None. This specification never says how an importer or storage support is loaded**, so this is a change to Section 12 and nothing more.                                                                            |
| **Browsing GUI, AI search, face recognition**                   | Any such tool is a **consumer** of a plain file tree. It reads the collection; the core never learns it exists. Any index it builds is derived and disposable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | R-COL-1, R-COL-3, R-CLI-3                 | **None, ever.** This is the entire payoff of plain files.                                                                                                                                                            |

---

## 11. Contracts

The core depends on these contracts, never on the tools or vendors behind them.
Error conditions are **named, not numbered**, because this specification
distinguishes no failure by exit status (Section 8.5).

### Importer

| Aspect        | Contract                                                                                                                                                                                                                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operations    | `list() -> Item[]`; `fetch(item) -> Bytes`                                                                                                                                                                                                                                                                                                   |
| Item          | A logical item, which MAY comprise several files (R-SRC-9), together with the metadata its import source supplies and the path each file has there (R-SRC-21)                                                                                                                                                                                |
| Precondition  | The import source is reachable and authorized                                                                                                                                                                                                                                                                                                |
| Postcondition | Every returned item is supplied as plain files, unaltered as far as the Importer is able (R-SRC-5)                                                                                                                                                                                                                                           |
| MUST NOT      | Delete, modify, move, or rename a file at an Import Source that it did not create (R-SRC-7); split a multi-file item (R-SRC-9); let anything but the item, the metadata its import source supplies, and that import source decide a collection path (R-SRC-10); report or retain which items the import source no longer supplies (R-SRC-13) |
| Errors        | Import source unreachable or unauthorized; content delivered only inside a proprietary container that the Importer cannot unpack (R-SRC-5); a directory entry that is neither a regular file nor a directory (R-SRC-22)                                                                                                                      |

### Storage

| Aspect        | Contract                                                                                                                                                                                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operations    | `capabilities() -> Capabilities`; `read(copy) -> Contents`; `write(copy, files, options) -> Result`; `verify(manifest) -> VerifyReport`                                                                                                                                                               |
| Capabilities  | Declares whether the copy is a plain tree, whether it can be verified in place, whether it is remote, and whether it can report a stable volume identifier for the copy (R-TGT-5). Re-evaluated every run (R-TGT-12); never cached                                                                    |
| Precondition  | The copy is reachable, and writable when written, **and declares itself a plain tree** (R-TGT-6)                                                                                                                                                                                                      |
| Postcondition | The copy holds every content file the run added to it (R-MIRROR-1), plus a manifest in each of its directories (R-TGT-9), and a receipt in each directory holding content **or recording an error** (R-MFILE-13). It MAY lack a content file another copy holds (R-COL-4)                             |
| MUST NOT      | Modify a content file already present in the copy (R-TGT-7); write a receipt, which is the core's responsibility (R-REC-6); delete a file it holds, or expose an operation that does (R-TGT-8); store data other than as a plain tree (R-COL-4)                                                       |
| Errors        | Copy unreachable, unmounted, or unwritable; copy does not declare itself a plain tree; transfer failure                                                                                                                                                                                               |

### Mirror engine

Scoped as _the mechanism by which two copies are brought into agreement_. This
is what keeps the "swap rclone for rsync by changing one binding" property
intact, while storage (Section 6) covers _what_ a copy is.

| Aspect        | Contract                                                                                                                                                                                                                                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operation     | `mirror(copyA, copyB, excludes, options) -> MirrorResult`                                                                                                                                                                                                                                                                                                                              |
| Precondition  | Both copies readable; the copy being written is writable                                                                                                                                                                                                                                                                                                                               |
| Postcondition | Each copy holds every content file the other holds (R-MIRROR-1); only absent files were transferred (R-MIRROR-4); each arrival is recorded in a receipt file and both copies' receipt files are brought to their union (R-REC-6)                                                                                                                                                       |
| Result        | Files transferred, bytes transferred, content files present in both copies with differing content (R-MIRROR-1), arrivals recorded, per-file errors                                                                                                                                                                                                                                     |
| MUST NOT      | Modify a content file already present in a copy (R-MIRROR-2); delete in a copy, apart from its own temporary files (R-MIRROR-3, R-MIRROR-8); overwrite a differing content file (R-MIRROR-1); record an arrival before its content is completely written (R-REC-5); delete or alter a receipt file (R-REC-7); leave a partial file that a later run mistakes for complete (R-MIRROR-6) |
| Errors        | A copy unreadable; a copy unwritable; transfer failure                                                                                                                                                                                                                                                                                                                                 |

### Integrity

| Aspect        | Contract                                                                                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operations    | `build(directory) -> Manifest`; `verify(directory, manifest) -> VerifyReport`                                                                                                           |
| Precondition  | Directory readable; for verify, the manifest exists and names its algorithm (R-INT-5)                                                                                                   |
| Postcondition | `build` writes a JSON manifest covering that directory alone (R-MFILE-8, R-MFILE-9), having verified against any existing manifest first (R-INT-10); `verify` mutates nothing (R-INT-6) |
| Result        | Per file: ok, missing, corrupt, or extra (R-INT-3)                                                                                                                                      |
| MUST NOT      | Repair, overwrite, or delete (R-INT-6); declare either side authoritative on a mismatch (R-INT-7)                                                                                       |
| Errors        | Any discrepancy found                                                                                                                                                                   |

### Config

| Aspect        | Contract                                                                        |
| ------------- | ------------------------------------------------------------------------------- |
| Operation     | `load(path) -> Config`                                                          |
| Postcondition | Returns a fully validated Config, or fails before any mutation occurs (R-CFG-3) |
| MUST NOT      | Apply a destructive default for an absent setting (R-CFG-4)                     |
| Errors        | Missing, unparseable, or invalid configuration                                  |

### Logger

| Aspect        | Contract                                                |
| ------------- | ------------------------------------------------------- |
| Operation     | `log(event)`                                            |
| Postcondition | The event is appended, as plain text, to this run's log |
| MUST NOT      | Be load-bearing for correctness (R-LOG-2)               |

---

## 12. Current bindings

> **This section, and only this section, records _how_ the requirements are met
> today.** It is expected to change, and it is the only section a binding change
> touches. Nothing above depends on any entry here. The dated assumptions these
> bindings rest on are kept in the assumptions register of
> [`docs/design-record.md`](../docs/design-record.md), Section 13.

Bindings as of 2026-07-12:

| Concern              | Today's binding                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Mirror engine        | rclone (MIT licensed), with rsync as the named fallback                                                               |
| Integrity            | SHA-256; JSON manifest (R-MFILE-9)                                                                                    |
| Config               | JSON, parsed by the runtime's standard library, with no third-party dependency                                        |
| Logger               | Plain-text files, one per run, written outside every copy (R-LOG-5)                                                   |
| Pattern matching     | `ignore` (MIT), vendored, for gitignore pattern semantics                                                             |
| Language and runtime | TypeScript on Node.js, standard library first, minimal third-party dependencies                                       |
| Operating systems    | Windows and macOS (R-CLI-15)                                                                                          |
| Scheduler (external) | launchd on macOS; cron, systemd timers, or Task Scheduler elsewhere                                                   |
| Importers            | **None yet.** What an import source delivers is stated with dated evidence, one import source specification at a time |

**Minimal third-party dependencies, and the test one must pass.** This binding
said _zero_ until 2026-08-27, which stated a ban where the reasoning supports a
filter. An operating system, a filesystem, and a vendor's export are
dependencies this project cannot avoid and does not pretend to; a package pulled
from a registry is different in kind, because it is optional, it must be fetched
again to rebuild, and it runs inside the process that writes to copies of
irreplaceable data. What it cannot do is endanger the data itself: R-COL-3 makes
a collection usable with no Turbo-Collection at all, so a package that
disappears costs a rebuild rather than a photograph. A package is therefore
permitted when all three hold, and is otherwise written by hand:

- It implements a **documented format** that this specification already cites.
- It carries **no transitive dependencies**.
- It is **vendored into the repository**, with its license notice, rather than
  resolved at build time, so the tool still builds with no registry reachable.

`ignore` is admitted on that test: it implements gitignore pattern semantics,
which R-MFILE-20 cites, it has no dependencies of its own, and its MIT license
permits copying it into this repository. Which package performs matching is a
binding; what a pattern means is a requirement, so replacing it changes no
obligation.

**Loading: compiled in.** Importers and storage support are ordinary modules in
the codebase, selected by configuration. There is no dynamic discovery, no
plugin registry, and no runtime loading of third-party code. This is a
**binding, not a requirement**: the contracts (R-SRC-_, R-TGT-_) say nothing
about how either is loaded, so a plugin-style loader could replace this with no
change to the specification (Section 10).

**Operating systems: Windows and macOS.** R-CLI-15 requires more than one
operating system and names none, so which ones are named here is a **binding,
not a requirement**. Adding another, such as Linux, changes this section and no
requirement; it also adds one more operating system under which conformance is
checked (Section 13).

Changing a binding is expected to require changing one module and no data. **If
a proposed change to a binding would require rewriting the contents of a copy,
it violates R-COL-4 and the proposal is wrong.**

---

## 13. Conformance

Conformance is checked in **two directions**, both periodically, both able to be
AI-assisted.

**Internal: code against this specification.** For each requirement, locate the
code responsible and judge it Satisfied, Partial, Violated, or Missing, citing
evidence as file and line. The check is bidirectional: code that does something
this specification does not describe is _also_ a finding, and per R-META-3 it is
either a specification gap or unauthorized behavior.

**External: this specification against the world.** Periodically re-validate the
bindings in Section 12, and the dated assumptions behind them in the assumptions
register of `docs/design-record.md`. Is the mirror engine still maintained and
permissively licensed? Has a better one appeared? Is SHA-256 still adequate?
Have filesystem or hardware norms shifted? And, most importantly: **has an
import source's behavior changed underneath us?**

**Traceability.** Every requirement ID MUST be traceable to code that implements
it and to at least one test that exercises it. Code cites the ID it satisfies,
for example an `R-MIRROR-1` comment on the function that enforces it, so
conformance is audited mechanically rather than inferred. Per R-META-2, code
cites **only** specification IDs. Code declares the specification version it
conforms to (R-VER-9).

**The no-deletion test.** Conformance MUST include a test asserting that no code
path deletes a file in any copy of the collection, apart from the temporary-file
carve-out (R-MIRROR-8). This is checked as a property of the code rather than
only as a behavior of a run, because a deletion path that exists but is not
reached today is a defect that a later change activates silently. Under
R-META-3, a delete call traceable to no requirement is unauthorized behavior and
is removed.

**The receipt-extension test.** Conformance MUST include a test asserting that
no code path writes a receipt holding fewer arrivals than the receipt it
replaces (R-REC-7). This is checked as a property of the code for the same
reason as the no-deletion test: arrival history is the only record in a copy
that cannot be rebuilt from anything else, so an overwrite is unrecoverable
rather than merely expensive.

**Testing.** Every **MUST** in this document MUST map to at least one test.
Tests are deterministic but bound to an implementation language; this
specification is the layer above them. On an implementation-language migration,
this document regenerates **both** the tests and the implementation.

> AI-assisted conformance review is a strong reviewer, not a proof: it can miss
> subtle behavioral bugs. Tests complement it. Neither replaces the other.
