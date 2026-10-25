> **Version:** that of [`turbo-collection-spec.md`](turbo-collection-spec.md),
> of which this file is a part.

Turbo Collection Core does following:

Init Import Backup Verify

This is implementation details to help with particular implementation like in
Node.js. Actual general instructions should be in turbo-collection-spec.md

## 8. Operation: configuration and Command Line

### 8.1 General Configuration (`R-CFG-*`)

**R-CFG-1.** Turbo-Collection MUST read a TC Copy's own identity and any
persisted option from an external configuration file, whose contents
`meta-file-spec.md` states, rather than hardcoding them. It MUST NOT hardcode
any path, and MUST NOT require a TC Copy to declare which other TC Copies are
expected to exist, which are discovered at run time.

**R-CFG-3.** In a Run, Turbo-Collection MUST validate configuration **before**
performing any filesystem mutation other than making that Run's log directory
and writing that Run's log (`logging-spec.md` R-LOG-6). Invalid configuration
MUST cause that Run to fail immediately, with no partial effect besides that
Run's log and its log directory.

**R-CFG-4.** Turbo-Collection MUST fail rather than guess. A missing, ambiguous,
or unparseable setting MUST NOT be silently defaulted into a behavior that loses
data.

**R-CFG-5.** Turbo-Collection MUST be fully operable with configuration supplied
from a collection's own storage or on a command line, and MUST NOT require
configuration held on a host computer. A host-specific location MAY be searched
as a convenience; configuration MUST NOT be able to live there alone.

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
schedule itself. _When_ it runs is for whatever invokes it to decide.

**R-CLI-3.**  
Turbo-Collection MUST be fully operable from a Command Line, with no graphical
interface required. A graphical interface, if one is ever built, MUST be a
consumer of this Core and MUST NOT be a dependency of it.

**R-CLI-5.**  
Every operation MUST be independently invocable on demand, not only as part of a
combined run: **init**, **import**, **backup**, **status**, and **verify**
inspections. Further subdivisions **verify copies** (R-INT-11), **verify
fixity** (R-INT-2), **verify access** (R-VERIFY-2), and **verify names**
(R-NAME-1). Dry-run MUST be a mode of **import** (R-SRC-14) and of **backup**
(R-BACKUP-10), not a separate operation.

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

**R-CLI-14.** Turbo-Collection MUST NOT create a TC Copy in any operation other
than **init** and **backup**, and in every other operation MUST refuse to act on
a directory given as a TC Directory that is not a TC Directory.

**R-CLI-18.** A TC Copy MUST NOT lie inside another TC Copy. Where a TC Copy
that a Run acts on, or a directory that a Run is to make a TC Directory, lies
inside a TC Copy, Turbo-Collection MUST end that Run with an error before that
Run makes a directory or writes a file inside any TC Copy. Where a Run, acting
on a TC Copy, finds a configuration file (`meta-file-spec.md` R-MFILE-17) below
that TC Copy's TC Directory, Turbo-Collection MUST end that Run with an error,
and MUST NOT let that Run write into whichever TC Copy that configuration file
describes.

> **Example.** An init given `photos/2024`, where `photos` is a TC Directory,
> fails and makes no directory. A backup given a TC Directory that a person
> moved into another TC Copy fails before it writes. A verify that meets another
> TC Copy's configuration file in a subdirectory fails.

**R-CLI-19.** Where a Run would read a directory entry inside a TC Copy that is
neither a regular file nor a directory, such as a symbolic link, a junction, a
device, a socket, or a named pipe, Turbo-Collection MUST end that Run with an
error, MUST report every such entry that Run read, and MUST NOT follow such an
entry. Turbo-Collection MUST pass over an entry that matches a pattern in that
TC Copy's ignore file (`meta-file-spec.md` R-MFILE-21), and MUST NOT end a Run
with an error on account of such an entry.

> **Example.** A person puts a symbolic link named `latest` into a TC Copy. That
> TC Copy's next backup fails, names `latest`, and copies nothing from where
> `latest` points.

**R-CLI-20.** Where a directory given to a Run has a path that passes through a
symbolic link or a junction, Turbo-Collection MUST end that Run with an error,
and MUST report which directory that path leads to. Turbo-Collection MUST end
that Run before that Run makes a directory or writes a file, other than that
Run's log and its log directory (`logging-spec.md` R-LOG-6).

> **Example.** An init given `D:\photos`, where `photos` is a junction to
> `E:\archive`, fails and names `E:\archive`, which can be given instead.

**R-CLI-15.** Turbo-Collection MUST be operable under more than one operating
system. A file a Run writes into a TC Copy MUST NOT have a name or content that
depends on whichever operating system that Run is performed under.
Turbo-Collection MUST perform every operation on a TC Copy whichever operating
system each earlier Run that wrote to that TC Copy was performed under.

> **Example.** A TC Copy written to from a Mac is backed up on a borrowed
> Windows computer, and a later verify on that Mac finds nothing wrong.

**R-CLI-16.**  
**Version Arg**  
When asked for its version, Turbo-Collection MUST report Turbo-Collection's
version and a version stamp (R-VER-18) for every specification it conforms to.
In answering, Turbo-Collection MUST NOT act on a TC Copy or on an Import Source.

> **Example.** A version report lists `turbo-collection-spec 1.2.0 (2027-03-01)`
> and one such line for `meta-file-spec.md`, for each Layout specification, and
> for each Import Source specification Turbo-Collection conforms to.

### 8.4 Distinct read-only inspections

"Verify my collection" sounds like one request, but it is several. Each MUST be
separately answerable (R-CLI-5), because they fail in different ways and at
different times.

| Question                                                                                       | Operation                | Requirement |
| ---------------------------------------------------------------------------------------------- | ------------------------ | ----------- |
| Are my import sources and TC Copies reachable and authorized?                                  | **verify access**        | R-VERIFY-2  |
| Do TC Copies still hold every file their manifests list, and agree on which files? (agreement) | **verify copies**        | R-INT-11    |
| Do bytes on this TC Copy still match its manifests? (fixity)                                   | **verify fixity**        | R-INT-2     |
| Would any filename fail to survive a move to another filesystem? (name hazards)                | **verify names**         | R-NAME-1    |
| What _would_ a backup transfer? (drift)                                                        | **backup**, dry-run mode | R-BACKUP-10 |
| What does this import source still hold that my collection lacks? (import-source coverage)     | **import**, dry-run mode | R-SRC-14    |
| How many TC Copies hold this content, and when did each receive it? (propagation)              | **status**               | R-STATUS-1  |

> **Example.** `status` reads receipts, not bytes, so it reports which TC Copies
> received content and when with no other drive connected; it never claims a TC
> Copy still exists or is intact today (R-REC-8).

### 8.5 Exit status

A Run exits with status **0** only where it was fully successful, and with a
non-zero status otherwise (R-CLI-1). This specification distinguishes no failure
by exit status: a non-zero status says only that a Run was not fully successful,
and its report and log say what happened (R-LOG-4).

> **Example.** An Import that leaves one differing file out and takes in every
> other file exits non-zero (R-SRC-23), as does a verify that finds one extra
> file (R-INT-8). A verify run while an off-site TC Copy is away exits 0
> (R-VERIFY-1), and so does an Import that places a file under supplied-path
> layout, its floor, and reports it (R-SRC-20): each did everything it was asked
> to do and found nothing wrong.

---

## 11. Contracts

Turbo-Collection's core depends on these contracts, never on tools or vendors
behind them. Error conditions are **named, not numbered**, because this
specification distinguishes no failure by exit status (Section 8.5).

### Importer

| Aspect        | Contract                                                                                                                                                                                                                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operations    | `list() -> Item[]`                                                                                                                                                                                                                                                                                                                            |
| Item          | A logical item, which MAY comprise several files (R-SRC-9), together with any metadata its import source supplies and, for each file, where Turbo-Collection's core reads it and which path it has at its import source (R-SRC-21)                                                                                                            |
| Precondition  | Its import source is reachable and authorized                                                                                                                                                                                                                                                                                                 |
| Postcondition | Every returned item is supplied as plain files, unaltered as far as that Importer is able (R-SRC-5)                                                                                                                                                                                                                                           |
| MUST NOT      | Delete, modify, move, or rename a file at an Import Source that it did not create (R-SRC-7); split a multi-file item (R-SRC-9); let anything but that item, any metadata its import source supplies, and that import source decide a collection path (R-SRC-10); report or retain which items its import source no longer supplies (R-SRC-13) |
| Errors        | Import source unreachable or unauthorized; content delivered only inside a proprietary container that its Importer cannot unpack (R-SRC-5); a directory entry that is neither a regular file nor a directory (R-SRC-22)                                                                                                                       |

### Storage layout

| Aspect        | Contract                                                                                                                                                                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operations    | `read(tcCopy) -> Contents`; `write(tcCopy, files, options) -> Result`; `verify(manifest) -> VerifyReport`                                                                                                                                                                  |
| Precondition  | `tcCopy` is reachable, and writable when written                                                                                                                                                                                                                           |
| Postcondition | `tcCopy` holds every content file a run added to it (R-BACKUP-4), plus a manifest in each of its directories (R-TGT-9), and a receipt in each directory holding content **or recording an error** (R-MFILE-13). It MAY lack a content file another TC Copy holds (R-COL-4) |
| MUST NOT      | Modify a content file already present in `tcCopy` (R-TGT-7); write a receipt, which is for Turbo-Collection's core to write (R-REC-6); delete a file it holds (R-TGT-7); store data other than as a plain tree (R-COL-4)                                                   |
| Errors        | TC Copy unreachable, unmounted, or unwritable; transfer failure                                                                                                                                                                                                            |

### Mirror engine

Scoped as _a mechanism by which two TC Copies are brought into agreement_. This
contract keeps that mechanism a binding, which `turbo-collection-spec.md`
Section 12 records, while storage layout (`turbo-collection-spec.md` Section 6)
covers _what_ a TC Copy is.

| Aspect        | Contract                                                                                                                                                                                                                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operation     | `mirror(tcCopyA, tcCopyB, excludes, options) -> MirrorResult`                                                                                                                                                                                                                                                                                |
| Precondition  | Both TC Copies readable; whichever TC Copy is being written is writable                                                                                                                                                                                                                                                                      |
| Postcondition | Each TC Copy holds every content file either TC Copy holds (R-BACKUP-4); only absent files were transferred (R-BACKUP-7); each arrival is recorded in a receipt file and both TC Copies' receipt files are brought to their union (R-REC-6)                                                                                                  |
| Result        | Files transferred, bytes transferred, content files present in both TC Copies with differing content (R-BACKUP-4), arrivals recorded, per-file errors                                                                                                                                                                                        |
| MUST NOT      | Modify a content file already present in a TC Copy (R-BACKUP-5); delete in a TC Copy (R-BACKUP-6); overwrite a differing content file (R-BACKUP-4); record an arrival before its content is completely written (R-REC-5); delete or alter a receipt file (R-REC-7); leave a partial file that a later run mistakes for complete (R-BACKUP-9) |
| Errors        | A TC Copy unreadable; a TC Copy unwritable; transfer failure                                                                                                                                                                                                                                                                                 |

### Integrity

| Aspect        | Contract                                                                                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operations    | `build(directory) -> Manifest`; `verify(directory, manifest) -> VerifyReport`                                                                                                           |
| Precondition  | Directory readable; for verify, `manifest` exists and names its algorithm (R-INT-5)                                                                                                     |
| Postcondition | `build` writes a JSON manifest covering that directory alone (R-MFILE-8, R-MFILE-9), having verified against any existing manifest first (R-INT-10); `verify` mutates nothing (R-INT-6) |
| Result        | Per file: ok, missing, corrupt, or extra (R-INT-3)                                                                                                                                      |
| MUST NOT      | Repair, overwrite, or delete (R-INT-6); declare either side authoritative on a mismatch (R-INT-7)                                                                                       |
| Errors        | Any discrepancy found                                                                                                                                                                   |

### Config

| Aspect        | Contract                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Operation     | `load(path) -> Config`                                                                         |
| Postcondition | Returns a fully validated Config, or fails before any mutation besides its Run's log (R-CFG-3) |
| MUST NOT      | Apply a destructive default for an absent setting (R-CFG-4)                                    |
| Errors        | Missing, unparseable, or invalid configuration                                                 |

### Logger

| Aspect        | Contract                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Operations    | `log(event)`, or `log(text)` for a `message` event (R-LOG-17); `error(error)`                                                                |
| Postcondition | `log` leaves `event` as this Run's log's last line (R-LOG-7); `error` leaves an `error` event recording `error` as that last line (R-LOG-12) |
| MUST NOT      | Be load-bearing for correctness (R-LOG-2)                                                                                                    |

---
