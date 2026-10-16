Turbo Collection Core does following:

Init
Import
Backup
Verify

This is implementation details to help with particular implementation like in Node.js.
Actual general instructions should be in turbo-collection-spec.md

## Init

add .turbo-collection directory
If there are any files in folder where init is performed, then fail

## 5. Import (`R-SRC-*`)

The Core must be indifferent to whether a photo arrived by cable, from iCloud,
through a OneDrive sync folder, or from something not yet invented.

This contract is specified completely enough (R-META-1) that **anyone can write
an Importer from this document alone, without modifying Turbo-Collection's
core.** That is the extensibility that matters. How importers are loaded is a
binding (`turbo-collection-spec.md` Section 12), not a requirement.

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

**R-SRC-12.**  
**Import is additive.**  
Import MUST add files to the collection, and MUST NOT delete, move, rename, or
modify a file already in the collection. If an import source no longer holds an
item the collection already holds, Turbo-Collection MUST take no action and MUST
NOT report a discrepancy.

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
> import source whose primary layout is the photo layout, and keep their place
> in their folder when that folder is imported as a local folder, where the
> layout is as-found. Bytes decide where an item goes within a layout, never
> which layout.

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

**R-SRC-20.**  
**The floor.**  
Where the primary layout of an item's import source is not able to place that
item, Turbo-Collection MUST place the item under the as-found layout
(`as-found-path-layout-spec.md`), and MUST report every item placed this way.
Turbo-Collection MUST NOT leave an item out of the collection because a layout
is not able to place it.

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

---



## 8. Operation: configuration and the Command Line

### 8.1 General Configuration (`R-CFG-*`)

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

### 8.3 Command Line (`R-CLI-*`)

**R-CLI-1.** Turbo-Collection MUST exit a Run with status **0** only where every
operation of that Run completed everything it was asked to do and found nothing
wrong, and MUST otherwise exit with a non-zero status. A report of what an
operation did, as distinct from a report of something an operation could not do,
refused to do, or found wrong, MUST NOT by itself cause a non-zero exit status
(Section 8.5).

**R-CLI-2.**  
**One-shot.**  
Turbo-Collection MUST perform one run and exit. It MUST NOT daemonize, poll, or
schedule itself. _When_ it runs is the responsibility of whatever invokes it.

**R-CLI-3.**  
Turbo-Collection MUST be fully operable from a Command Line, with no graphical
interface required. A graphical interface, if one is ever built, MUST be a
consumer of this Core and MUST NOT be a dependency of it.

**R-CLI-4.**  
Turbo-Collection MUST NOT require network access to back up to a
locally-attached copy.

**R-CLI-5.**  
Every operation MUST be independently invocable on demand, not only as part of a
combined run: **init**, **import**, **backup**, **status**, and **verify**
inspections. Further subdivisions **verify fixity** (R-INT-2), **verify access**
(R-CLI-9), and **verify names** (R-NAME-1). Dry-run MUST be a mode of **init**
(R-CLI-11), of **import** (R-SRC-14), and of **backup** (R-MIRROR-7), not a
separate operation.

**R-CLI-6.**  
Turbo-Collection MUST be fully usable with **no scheduler installed or
configured**. Scheduling is optional.

**R-CLI-7.**  
Effects MUST be identical whether Turbo-Collection is invoked by a human or by a
scheduler. Output formatting MAY differ (for example, progress reporting on a
terminal); effects MUST NOT.

**R-CLI-8.**  
An operation MUST NOT require an interactive prompt to complete, because a
scheduled run cannot answer one. Every option that changes what a run does MUST
be settable in configuration or by a command-line flag.

**R-CLI-11.** **Init Operation** Turbo-Collection MUST provide an **init**
operation that makes the directory it is given a copy, by writing into that
directory a configuration file (`meta-file-spec.md` R-MFILE-17) and an ignore
file holding the starter patterns that `meta-file-spec.md` describes
(R-MFILE-20). Init MUST create a directory it is given that does not exist,
with every directory above it that does not exist. Where it is given no
directory, init MUST act on the current working directory. Init MUST refuse a
directory that holds any file, at any depth, other than one a starter pattern
matches. Init MUST take the new Collection's `collectionName` from a name given
on the command line for the Collection and, where none is given, from the name
of the new Copy's directory, unchanged. Init MUST take the new Copy's `copyName`
from a name given on the command line for the Copy and, where none is given,
MUST set `copyName` to `main`. Where a name is not valid (`meta-file-spec.md`
R-MFILE-18, R-MFILE-19), init MUST refuse, and MUST report which name is not
valid.

> **Example.** An init run by mistake on a folder of photographs fails and
> writes nothing. A folder that holds only a `.DS_Store` its operating system
> left there is made a copy. A directory that is already a copy holds its
> configuration file, so an init of it fails the same way. An init of a folder
> named `Photos (2019)`, given neither name, makes a Copy named `main` of a
> Collection named `Photos (2019)`.

**R-CLI-9.**  
**Dry-Run Access Verification** Turbo-Collection MUST provide a read-only
**verify access** inspection that transfers and modifies nothing, and that
reports, for every import source and copy a run would act on: whether it is
reachable and authorized; and whether the configuration would be refused
(R-TGT-6).

**R-CLI-10.**  
**Status Operation**  
Turbo-Collection MUST provide a read-only **status** operation that reports,
from receipts alone and with no other copy connected, which copies each
directory's content has reached, the date of each arrival, and the content
present that has reached no other copy. It MUST report every arrival's date
(R-REC-8), and MUST NOT state or imply that a copy still exists or is still
intact. A status MUST also report each connected Copy's `collectionName` and
`copyName` (`meta-file-spec.md` R-MFILE-18). What a status reports MUST NOT by
itself cause a non-zero exit status.

**R-CLI-13.**  
**Backup Operation**  
In a **backup**, Turbo-Collection MUST mirror every directory the backup is
given that is a copy (`backup-spec.md` Section 7.1). Turbo-Collection MUST
refuse a backup unless every Copy the backup is given states the same
`collectionId`, comparing the values character for character
(`meta-file-spec.md` R-MFILE-18). On that refusal, Turbo-Collection MUST report
the `collectionId` and `collectionName` of every Copy the backup is given.
Before mirroring, Turbo-Collection MUST create a new copy in each directory the
backup is given that does not exist, or that holds no file at any depth except
files matching a pattern in the ignore file of the backup's existing copy.
Turbo-Collection MUST refuse a backup that would create a new copy unless that
backup is given exactly one existing copy. Turbo-Collection MUST refuse to
create a new copy unless a name for the new copy is given on the command line;
that name becomes the new copy's `copyName`. To create a new copy,
Turbo-Collection MUST write into its directory a configuration file
(`meta-file-spec.md` R-MFILE-17, R-MFILE-19) and, where the existing copy has an
ignore file, a duplicate of that ignore file (R-MFILE-20). Turbo-Collection MUST refuse to act on a directory given to a
backup that is not a copy and that holds any file not matching such a pattern,
and MUST report every file that directory holds.

> **Example.** A backup creates a copy only in an empty directory, so files
> already there are not pulled into the collection by the two-way mirror. Two
> folders named `Photos`, each made a Copy by its own init, belong to different
> Collections, so a backup given both refuses and copies nothing, although both
> state the `collectionName` `Photos`.

**R-CLI-14.** Turbo-Collection MUST NOT create a copy in any operation other
than **init** and **backup**, and in every other operation MUST refuse to act on
a directory given as a copy that is not a copy. Where init or backup creates a
directory, Turbo-Collection MUST also create every directory above it that does
not exist.

> **Example.** A backup given `archive/photos`, where `archive` does not exist,
> creates both directories.

**R-CLI-15.** Turbo-Collection MUST be operable under more than one operating
system. The name and content of every file a Run writes into a Copy MUST NOT
depend on the operating system that Run is performed under. Turbo-Collection
MUST perform every operation on a Copy whichever operating system each earlier
Run that wrote to that Copy was performed under.

> **Example.** A Copy written to from a Mac is backed up on a borrowed Windows
> computer, and a later verify on that Mac finds nothing wrong.

**R-CLI-16.**  
**Version Arg**  
When asked for its version, Turbo-Collection MUST report the Turbo-Collection
version and a version stamp (R-VER-18) for every specification it conforms to.
In answering, Turbo-Collection MUST NOT act on a Copy or on an Import Source.

> **Example.** A version report lists `turbo-collection-spec 1.2.0 (2027-03-01)`
> and one such line for `meta-file-spec.md`, for each Layout specification, and
> for each Import Source specification the code conforms to.

**R-CLI-17.**  
**Verify Arg**  
 A **verify** invoked with no inspection named MUST run every verify inspection,
against every connected copy. Where a receipt on a connected copy names a copy
that is not connected, verify MUST report that copy as not connected, and that
absence alone MUST NOT cause a non-zero exit status.

> **Example.** `verify` run while the off-site copy is away reports it as not
> connected and still exits 0, so a routine check does not fail by design every
> time.

### 8.4 Distinct read-only inspections

"Verify my collection" sounds like one request, but it is several. Each MUST be
separately answerable (R-CLI-5), because they fail in different ways and at
different times.

| Question                                                                                    | Operation                | Requirement |
| ------------------------------------------------------------------------------------------- | ------------------------ | ----------- |
| Are my import sources and copies reachable and authorized?                                  | **verify access**        | R-CLI-9     |
| Do the bytes on this copy still match the manifest? (fixity)                                | **verify fixity**        | R-INT-2     |
| Would any filename fail to survive a move to another filesystem? (name hazards)             | **verify names**         | R-NAME-1    |
| How far apart are two copies? What _would_ a run transfer? (drift)                          | **backup**, dry-run mode | R-MIRROR-7  |
| What does this import source still hold that the collection lacks? (import-source coverage) | **import**, dry-run mode | R-SRC-14    |
| How many copies hold this content, and when did each receive it? (propagation)              | **status**               | R-CLI-10    |

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

### Storage layout

| Aspect        | Contract                                                                                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operations    | `read(copy) -> Contents`; `write(copy, files, options) -> Result`; `verify(manifest) -> VerifyReport`                                                                                                                                                                     |
| Precondition  | The copy is reachable, and writable when written, **and declares itself a plain tree** (R-TGT-6)                                                                                                                                                                          |
| Postcondition | The copy holds every content file the run added to it (R-MIRROR-1), plus a manifest in each of its directories (R-TGT-9), and a receipt in each directory holding content **or recording an error** (R-MFILE-13). It MAY lack a content file another copy holds (R-COL-4) |
| MUST NOT      | Modify a content file already present in the copy (R-TGT-7); write a receipt, which is the core's responsibility (R-REC-6); delete a file it holds (R-TGT-7); store data other than as a plain tree (R-COL-4)                                                             |
| Errors        | Copy unreachable, unmounted, or unwritable; copy does not declare itself a plain tree; transfer failure                                                                                                                                                                   |

### Mirror engine

Scoped as _the mechanism by which two copies are brought into agreement_. This
is what keeps the "swap rclone for rsync by changing one binding" property
intact, while storage layout (`turbo-collection-spec.md` Section 6) covers
_what_ a copy is.

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

