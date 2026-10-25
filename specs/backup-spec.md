> **Version:** that of [`turbo-collection-spec.md`](turbo-collection-spec.md),
> of which this file is a part.

## 7. Backup (`R-BACKUP-*`)

**R-BACKUP-1.**  
**Backup Operation**  
Turbo-Collection MUST refuse a **backup** unless that backup is given exactly
two directories, at least one of them a TC Directory, and MUST mirror both
(Section 7.1). Turbo-Collection MUST refuse a backup of two TC Copies unless
both state one `collectionId`, comparing those values character for character
(`meta-file-spec.md` R-MFILE-18). On that refusal, Turbo-Collection MUST report
both TC Copies' `collectionId` and `collectionName`. Where one of those two
directories is not a TC Directory, Turbo-Collection MUST, before mirroring,
create a new TC Copy there if that directory does not exist or holds no file at
any depth except files matching a pattern in its partner's ignore file, its
partner being an existing TC Copy. Turbo-Collection MUST refuse to create a new
TC Copy unless a name for that new TC Copy is given on its command line; that
name becomes that new TC Copy's `tcCopyName`. Turbo-Collection MUST refuse a
name that is not valid, or that is that existing TC Copy's `tcCopyName` without
regard to letter case (`meta-file-spec.md` R-MFILE-19), before it makes a
directory or writes a file. Turbo-Collection MUST refuse a backup given a name
for a new TC Copy where that backup creates no TC Copy. To create a new TC Copy,
Turbo-Collection MUST write into its TC Directory a configuration file
(`meta-file-spec.md` R-MFILE-17, R-MFILE-19) and, where that existing TC Copy
has an ignore file, a duplicate of that ignore file (R-MFILE-20).
Turbo-Collection MUST refuse to act on a directory given to a backup that is not
a TC Directory and that holds any file not matching such a pattern, and MUST
report every such file.

> **Example.** A backup creates a TC Copy only in an empty directory, so files
> already there are not pulled into a collection by a two-way mirror. Two
> folders named `Photos`, each made a TC Directory by its own init, belong to
> different Collections, so a backup given both refuses and copies nothing,
> although both state `Photos` as `collectionName`. A backup given a working TC
> Copy, `main`, and an empty directory makes a TC Copy named `home` there when
> given that name, and refuses `MAIN` as a name before it makes anything.

**R-BACKUP-2.** Where backup creates a directory, Turbo-Collection MUST also
create every directory above it that does not exist.

> **Example.** A backup given `archive/photos`, where `archive` does not exist,
> creates both directories.

**R-BACKUP-3.** Turbo-Collection MUST NOT require network access to back up to a
locally-attached TC Copy.

### 7.1 Mirroring

A mirror's semantics, as distinct from `turbo-collection-spec.md` Section 6's
storage layout contract. Mirroring is symmetric between peer TC Copies, and is
what a **backup** (R-CLI-5) performs.

**R-BACKUP-4.** When mirroring two TC Copies, Turbo-Collection MUST copy to each
TC Copy every Content File its partner holds and it does not, where a TC Copy
holds a Content File only where that file is at its path and a manifest of its
directory lists it (`turbo-collection-spec.md` R-TGT-13). Where both TC Copies'
manifests state different checksums for a Content File at one path,
Turbo-Collection MUST NOT copy that file to either TC Copy, MUST NOT overwrite
it in either TC Copy, and MUST report that difference (R-INT-7), whether both TC
Copies hold that file or only one does.

> **Example.** Two TC Copies hold different bytes at one path: neither is
> overwritten, and that difference is reported. So it is where one TC Copy has
> lost its file and its manifest still states a checksum that its partner's file
> does not have: that file is not copied there.

**R-BACKUP-5.** Mirroring MUST NOT modify, rename, move, or delete a **content
file** already present in a TC Copy, except as `turbo-collection-spec.md`
R-TGT-13 states. Mirroring MUST record each arrival it makes in that directory's
receipt (R-REC-5). Into a TC Copy, mirroring MUST write only these files:

- each Content File it copies to that TC Copy (R-BACKUP-4);
- a manifest, or an entry added to one, as R-BACKUP-13 states;
- an arrival file or an error file of that Run, and each receipt file this TC
  Copy lacks that its partner holds (`meta-file-spec.md` R-MFILE-13,
  `verify-spec.md` R-REC-6, R-REC-9);
- in a TC Copy that a backup creates, its configuration file and its ignore file
  (R-BACKUP-1).

**R-BACKUP-6.** Turbo-Collection MUST NOT delete a file in any TC Copy, and MUST
NOT provide a configuration setting or a command-line flag that permits deletion
in a TC Copy.

**R-BACKUP-7.**  
**Idempotence.**  
Mirroring TC Copies already in agreement MUST transfer no file data.

**R-BACKUP-8.** Turbo-Collection MUST support more than one TC Copy and MUST
treat each independently: a failure against one MUST NOT prevent an attempt
against another, and MUST still be reported.

**R-BACKUP-9.** An interrupted run (power loss, disconnected drive, termination)
MUST leave a TC Copy in a state from which a subsequent run converges to a
correct mirror. A run MUST NOT leave a partially-written file that a later run
would mistake for a complete one. Mirroring MUST write each file straight to its
path in a TC Copy, and MUST list a Content File it writes in a manifest only as
`turbo-collection-spec.md` R-TGT-13 states.

> **Example.** A backup is stopped while it copies `photo.jpg`. What it wrote so
> far is at `photo.jpg`'s path, and no manifest lists it, so it is not in its
> Collection, and whichever backup runs next writes `photo.jpg` over it.

**R-BACKUP-10.**  
**Dry-Run**  
Turbo-Collection MUST support a Dry-Run mode that reports exactly what a real
run would transfer, and mutates nothing.

**R-BACKUP-12.** Turbo-Collection MUST verify a Content File against its TC
Copy's manifest as it copies that file to another TC Copy. Where that file's
checksum does not match its own TC Copy's manifest, Turbo-Collection MUST NOT
list it in a manifest of whichever TC Copy it is copied to, and MUST report it
as an error. Turbo-Collection MUST NOT copy a Content File that its TC Copy's
manifest does not list (`verify-spec.md` R-INT-8), and MUST report each such
file as an error, unless that Run writes over it from that Run's other TC Copy
(R-BACKUP-4).

> **Example.** A file that corrupted silently in one TC Copy is caught as it is
> copied, and no manifest of whichever TC Copy it is copied to lists it, so it
> is not in its Collection there. A file a person put into a TC Copy with a file
> manager, at a path where its partner TC Copy holds nothing, is reported as an
> error, and no backup carries it to another TC Copy. What an interrupted backup
> left half-written at `photo.jpg`'s path is written over by whichever backup
> runs next, which reports nothing about it.

**R-BACKUP-13.** Where mirroring copies a Content File into a directory, it MUST
leave that directory's manifests in both TC Copies holding identical entries for
that file. Turbo-Collection MUST take that entry, every field included
(`meta-file-spec.md` R-MFILE-5, R-MFILE-10, R-MFILE-11), from a manifest in
whichever TC Copy that file is copied from, and MUST NOT compute that entry
anew. Where a TC Copy that file is copied to has no manifest for that directory,
Turbo-Collection MUST write one there, holding every field of its counterpart in
that file's source TC Copy, with `files` holding only entries of files mirroring
copied there.

> **Example.** A photo's manifest entry holds a `date` its import source
> supplied. A backup copies that photo to a new TC Copy, and its entry goes with
> it, `date` included, which no reading of that new TC Copy's files could
> recover.

**R-BACKUP-14.** Where one directory's manifests in both TC Copies name
different Layouts or different Import Sources (`meta-file-spec.md` R-MFILE-9,
`specId`), Turbo-Collection MUST copy no Content File into that directory in
either TC Copy, MUST report that directory as an error, and MUST still mirror
every other directory. A Run that reports such a directory MUST exit with a
non-zero status.

**R-BACKUP-15.** Turbo-Collection MUST refuse to mirror two TC Copies unless
their ignore files hold identical patterns in identical order
(`meta-file-spec.md` R-MFILE-20), where a TC Copy with no ignore file holds no
pattern. Turbo-Collection MUST refuse before it writes into either TC Copy, and
MUST report each TC Copy's ignore file.

> **Example.** A pattern added to a working TC Copy's `.tcignore` and not to its
> home TC Copy's stops their next backup, which names both files. Once both hold
> identical patterns, that backup runs. A comment or a blank line that only one
> of them holds changes nothing.
