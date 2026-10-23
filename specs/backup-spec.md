> **Version:** that of [`turbo-collection-spec.md`](turbo-collection-spec.md),
> of which this file is a part.

## 7. Backup (`R-BACKUP-*`)

**R-BACKUP-1.**  
**Backup Operation**  
Turbo-Collection MUST refuse a **backup** unless that backup is given exactly
two directories, at least one of them a Copy, and MUST mirror the two (Section
7.1). Turbo-Collection MUST refuse a backup of two Copies unless both state the
same `collectionId`, comparing the values character for character
(`meta-file-spec.md` R-MFILE-18). On that refusal, Turbo-Collection MUST report
the `collectionId` and `collectionName` of both Copies. Where one of the two
directories is not a Copy, Turbo-Collection MUST, before mirroring, create a new
Copy there if that directory does not exist or holds no file at any depth except
files matching a pattern in the ignore file of the other directory, the existing
Copy. Turbo-Collection MUST refuse to create a new Copy unless a name for the
new Copy is given on the command line; that name becomes the new Copy's
`copyName`. Turbo-Collection MUST refuse a name that is not valid, or that is
the existing Copy's `copyName` without regard to letter case
(`meta-file-spec.md` R-MFILE-19), before it makes a directory or writes a file.
Turbo-Collection MUST refuse a backup given a name for a new Copy where that
backup creates no Copy. To create a new Copy, Turbo-Collection MUST write into
its directory a configuration file (`meta-file-spec.md` R-MFILE-17, R-MFILE-19)
and, where the existing Copy has an ignore file, a duplicate of that ignore file
(R-MFILE-20). Turbo-Collection MUST refuse to act on a directory given to a
backup that is not a Copy and that holds any file not matching such a pattern,
and MUST report every such file.

> **Example.** A backup creates a copy only in an empty directory, so files
> already there are not pulled into the collection by the two-way mirror. Two
> folders named `Photos`, each made a Copy by its own init, belong to different
> Collections, so a backup given both refuses and copies nothing, although both
> state the `collectionName` `Photos`. A backup given the working Copy `main`
> and an empty directory makes that directory a Copy named `home` when given
> that name, and refuses the name `MAIN` before it makes anything.

**R-BACKUP-2.** Where backup creates a directory, Turbo-Collection MUST also
create every directory above it that does not exist.

> **Example.** A backup given `archive/photos`, where `archive` does not exist,
> creates both directories.

**R-BACKUP-3.** Turbo-Collection MUST NOT require network access to back up to a
locally-attached copy.

### 7.1 Mirroring

The semantics of the mirror mechanism, as distinct from the storage layout
contract in `turbo-collection-spec.md` Section 6. Mirroring is symmetric between
peer copies, and is what the **backup** operation (R-CLI-5) performs.

**R-BACKUP-4.** When mirroring two Copies, Turbo-Collection MUST copy to each
Copy every Content File the other holds and it does not, where a Copy holds a
Content File only where that file is at its path and a manifest of its directory
lists it (`turbo-collection-spec.md` R-TGT-13). Where the manifests of the two
Copies state different checksums for a Content File at one path,
Turbo-Collection MUST NOT copy that file to either Copy, MUST NOT overwrite it
in either Copy, and MUST report the difference (R-INT-7), whether both Copies
hold that file or only one does.

> **Example.** Two copies hold different bytes at the same path: neither is
> overwritten, and the difference is reported. So it is where one Copy has lost
> its file and its manifest still states a checksum that the other Copy's file
> does not have: that file is not copied there.

**R-BACKUP-5.** Mirroring MUST NOT modify, rename, move, or delete a **content
file** already present in a copy, except as `turbo-collection-spec.md` R-TGT-13
states. Mirroring MUST record each arrival it makes in that directory's receipt
(R-REC-5). Into a Copy, mirroring MUST write only these files:

- each Content File it copies to that Copy (R-BACKUP-4);
- a manifest, or an entry added to one, as R-BACKUP-13 states;
- an arrival file or an error file of that Run, and each receipt file the other
  Copy holds that this Copy lacks (`meta-file-spec.md` R-MFILE-13,
  `verify-spec.md` R-REC-6, R-REC-9);
- in a Copy that the backup creates, its configuration file and its ignore file
  (R-BACKUP-1).

**R-BACKUP-6.** Turbo-Collection MUST NOT delete a file in any copy, and MUST
NOT provide a configuration setting or a command-line flag that permits deletion
in a copy.

**R-BACKUP-7.**  
**Idempotence.**  
Mirroring copies already in agreement MUST transfer no file data.

**R-BACKUP-8.** Turbo-Collection MUST support more than one copy and MUST treat
each independently: a failure against one MUST NOT prevent the attempt against
another, and MUST still be reported.

**R-BACKUP-9.** An interrupted run (power loss, disconnected drive, termination)
MUST leave a copy in a state from which a subsequent run converges to a correct
mirror. A run MUST NOT leave a partially-written file that a later run would
mistake for a complete one. Mirroring MUST write each file straight to its path
in a Copy, and MUST list a Content File it writes in a manifest only as
`turbo-collection-spec.md` R-TGT-13 states.

> **Example.** A backup is stopped while it copies `photo.jpg`. What it wrote so
> far is at the path of `photo.jpg`, and no manifest lists it, so it is not in
> the Collection, and the next backup writes `photo.jpg` over it.

**R-BACKUP-10.**  
**Dry-Run**  
Turbo-Collection MUST support a Dry-Run mode that reports exactly what a real
run would transfer, and mutates nothing.

**R-BACKUP-12.** Turbo-Collection MUST verify a Content File against its Copy's
manifest as it copies that file to another Copy. Where that file's checksum does
not match its own Copy's manifest, Turbo-Collection MUST NOT list it in a
manifest of the Copy it is copied to, and MUST report it as an error.
Turbo-Collection MUST NOT copy a Content File that its Copy's manifest does not
list (`verify-spec.md` R-INT-8), and MUST report each such file as an error,
unless that Run writes over it from the other Copy (R-BACKUP-4).

> **Example.** A file that corrupted silently in one copy is caught as it is
> copied, and no manifest of the fresh copy lists it, so it is not in the
> Collection there. A file a person put into a Copy with a file manager, at a
> path where the other Copy holds nothing, is reported as an error, and no
> backup carries it to another Copy. What an interrupted backup left
> half-written at the path of `photo.jpg` is written over by the next backup,
> which reports nothing about it.

**R-BACKUP-13.** Where mirroring copies a Content File into a directory, it MUST
leave the manifests of that directory in both Copies holding the same entry for
that file. Turbo-Collection MUST take that entry from the manifest of the Copy
the file is copied from, every field included (`meta-file-spec.md` R-MFILE-5,
R-MFILE-10, R-MFILE-11), and MUST NOT compute that entry anew. Where the Copy
the file is copied to has no manifest for that directory, Turbo-Collection MUST
write one there, holding every field of the other Copy's manifest, with `files`
holding only the entries of the files mirroring copied there.

> **Example.** A photo's manifest entry holds a `date` its import source
> supplied. A backup copies the photo to a new Copy, and the entry goes with it,
> `date` included, which no reading of the new Copy's files could recover.

**R-BACKUP-14.** Where the manifests of one directory in the two Copies name a
different Layout or a different Import Source (`meta-file-spec.md` R-MFILE-9,
`specId`), Turbo-Collection MUST copy no Content File into that directory in
either Copy, MUST report that directory as an error, and MUST still mirror every
other directory. A Run that reports such a directory MUST exit with a non-zero
status.

**R-BACKUP-15.** Turbo-Collection MUST refuse to mirror two Copies unless their
ignore files hold the same patterns in the same order (`meta-file-spec.md`
R-MFILE-20), where a Copy with no ignore file holds no pattern. Turbo-Collection
MUST refuse before it writes into either Copy, and MUST report the ignore file
of each Copy.

> **Example.** A pattern added to the working Copy's `.tcignore` and not to the
> home Copy's stops the next backup of the two, which names both files. Once the
> two hold the same patterns, the backup runs. A comment or a blank line that
> only one of them holds changes nothing.
