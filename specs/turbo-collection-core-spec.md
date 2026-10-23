> **Version:** that of [`turbo-collection-spec.md`](turbo-collection-spec.md),
> of which this file is a part.

Turbo Collection Core does following:

Init Import Backup Verify

This is implementation details to help with particular implementation like in
Node.js. Actual general instructions should be in turbo-collection-spec.md

## 8. Operation: configuration and the Command Line

### 8.1 General Configuration (`R-CFG-*`)

**R-CFG-1.** Turbo-Collection MUST read a copy's own identity and any persisted
option from an external configuration file, whose contents `meta-file-spec.md`
states, rather than hardcoding them. It MUST NOT hardcode any path, and MUST NOT
require a copy to declare the other copies expected to exist, which are
discovered at run time.

**R-CFG-3.** In a Run, Turbo-Collection MUST validate configuration **before**
performing any filesystem mutation other than making that Run's log directory
and writing that Run's log (`logging-spec.md` R-LOG-6). Invalid configuration
MUST cause that Run to fail immediately, with no partial effect besides that
Run's log and its log directory.

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

**R-CLI-14.** Turbo-Collection MUST NOT create a copy in any operation other
than **init** and **backup**, and in every other operation MUST refuse to act on
a directory given as a copy that is not a copy.

**R-CLI-18.** A Copy MUST NOT lie inside another Copy. Where a Copy that a Run
acts on, or a directory that a Run is to make a Copy, lies inside a Copy,
Turbo-Collection MUST end that Run with an error before that Run makes a
directory or writes a file inside any Copy. Where a Run finds a configuration
file (`meta-file-spec.md` R-MFILE-17) below the root of a Copy that Run acts on,
Turbo-Collection MUST end that Run with an error, and MUST NOT let that Run
write into the Copy that configuration file describes.

> **Example.** An init given `photos/2024`, where `photos` is a Copy, fails and
> makes no directory. A backup given a Copy that a person moved into another
> Copy fails before it writes. A verify that meets another Copy's configuration
> file in a subdirectory fails.

**R-CLI-19.** Where a Run would read a directory entry inside a Copy that is
neither a regular file nor a directory, such as a symbolic link, a junction, a
device, a socket, or a named pipe, Turbo-Collection MUST end that Run with an
error, MUST report every such entry that Run read, and MUST NOT follow such an
entry. Turbo-Collection MUST pass over an entry that matches a pattern in that
Copy's ignore file (`meta-file-spec.md` R-MFILE-21), and MUST NOT end a Run with
an error on account of such an entry.

> **Example.** A person puts a symbolic link named `latest` into a Copy. The
> next backup of that Copy fails, names `latest`, and copies nothing from where
> `latest` points.

**R-CLI-20.** Where the path of a directory given to a Run passes through a
symbolic link or a junction, Turbo-Collection MUST end that Run with an error,
and MUST report the directory that path leads to. Turbo-Collection MUST end that
Run before that Run makes a directory or writes a file, other than that Run's
log and its log directory (`logging-spec.md` R-LOG-6).

> **Example.** An init given `D:\photos`, where `photos` is a junction to
> `E:\archive`, fails and names `E:\archive`, which can be given instead.

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

### 8.4 Distinct read-only inspections

"Verify my collection" sounds like one request, but it is several. Each MUST be
separately answerable (R-CLI-5), because they fail in different ways and at
different times.

| Question                                                                                    | Operation                | Requirement |
| ------------------------------------------------------------------------------------------- | ------------------------ | ----------- |
| Are my import sources and copies reachable and authorized?                                  | **verify access**        | R-VERIFY-2  |
| Do the copies still hold every file their manifests list, and the same files? (agreement)   | **verify copies**        | R-INT-11    |
| Do the bytes on this copy still match the manifest? (fixity)                                | **verify fixity**        | R-INT-2     |
| Would any filename fail to survive a move to another filesystem? (name hazards)             | **verify names**         | R-NAME-1    |
| What _would_ a backup transfer? (drift)                                                     | **backup**, dry-run mode | R-BACKUP-10 |
| What does this import source still hold that the collection lacks? (import-source coverage) | **import**, dry-run mode | R-SRC-14    |
| How many copies hold this content, and when did each receive it? (propagation)              | **status**               | R-STATUS-1  |

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
> (R-VERIFY-1), and so does an Import that places a file under the floor and
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
| Operations    | `list() -> Item[]`                                                                                                                                                                                                                                                                                                                           |
| Item          | A logical item, which MAY comprise several files (R-SRC-9), together with the metadata its import source supplies and, for each file, the path at which the core reads that file and the path that file has at its import source (R-SRC-21)                                                                                                  |
| Precondition  | The import source is reachable and authorized                                                                                                                                                                                                                                                                                                |
| Postcondition | Every returned item is supplied as plain files, unaltered as far as the Importer is able (R-SRC-5)                                                                                                                                                                                                                                           |
| MUST NOT      | Delete, modify, move, or rename a file at an Import Source that it did not create (R-SRC-7); split a multi-file item (R-SRC-9); let anything but the item, the metadata its import source supplies, and that import source decide a collection path (R-SRC-10); report or retain which items the import source no longer supplies (R-SRC-13) |
| Errors        | Import source unreachable or unauthorized; content delivered only inside a proprietary container that the Importer cannot unpack (R-SRC-5); a directory entry that is neither a regular file nor a directory (R-SRC-22)                                                                                                                      |

### Storage layout

| Aspect        | Contract                                                                                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operations    | `read(copy) -> Contents`; `write(copy, files, options) -> Result`; `verify(manifest) -> VerifyReport`                                                                                                                                                                     |
| Precondition  | The copy is reachable, and writable when written                                                                                                                                                                                                                          |
| Postcondition | The copy holds every content file the run added to it (R-BACKUP-4), plus a manifest in each of its directories (R-TGT-9), and a receipt in each directory holding content **or recording an error** (R-MFILE-13). It MAY lack a content file another copy holds (R-COL-4) |
| MUST NOT      | Modify a content file already present in the copy (R-TGT-7); write a receipt, which is the core's responsibility (R-REC-6); delete a file it holds (R-TGT-7); store data other than as a plain tree (R-COL-4)                                                             |
| Errors        | Copy unreachable, unmounted, or unwritable; transfer failure                                                                                                                                                                                                              |

### Mirror engine

Scoped as _the mechanism by which two copies are brought into agreement_. This
contract keeps that mechanism a binding, which `turbo-collection-spec.md`
Section 12 records, while storage layout (`turbo-collection-spec.md` Section 6)
covers _what_ a copy is.

| Aspect        | Contract                                                                                                                                                                                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operation     | `mirror(copyA, copyB, excludes, options) -> MirrorResult`                                                                                                                                                                                                                                                                              |
| Precondition  | Both copies readable; the copy being written is writable                                                                                                                                                                                                                                                                               |
| Postcondition | Each copy holds every content file the other holds (R-BACKUP-4); only absent files were transferred (R-BACKUP-7); each arrival is recorded in a receipt file and both copies' receipt files are brought to their union (R-REC-6)                                                                                                       |
| Result        | Files transferred, bytes transferred, content files present in both copies with differing content (R-BACKUP-4), arrivals recorded, per-file errors                                                                                                                                                                                     |
| MUST NOT      | Modify a content file already present in a copy (R-BACKUP-5); delete in a copy (R-BACKUP-6); overwrite a differing content file (R-BACKUP-4); record an arrival before its content is completely written (R-REC-5); delete or alter a receipt file (R-REC-7); leave a partial file that a later run mistakes for complete (R-BACKUP-9) |
| Errors        | A copy unreadable; a copy unwritable; transfer failure                                                                                                                                                                                                                                                                                 |

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

| Aspect        | Contract                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Operation     | `load(path) -> Config`                                                                         |
| Postcondition | Returns a fully validated Config, or fails before any mutation besides the Run's log (R-CFG-3) |
| MUST NOT      | Apply a destructive default for an absent setting (R-CFG-4)                                    |
| Errors        | Missing, unparseable, or invalid configuration                                                 |

### Logger

| Aspect        | Contract                                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operations    | `log(event)`, or `log(text)` for a `message` event (R-LOG-17); `error(error)`                                                                         |
| Postcondition | `log` leaves the event as the last line of this Run's log (R-LOG-7); `error` leaves an `error` event recording the error as that last line (R-LOG-12) |
| MUST NOT      | Be load-bearing for correctness (R-LOG-2)                                                                                                             |

---
