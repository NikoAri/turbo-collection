> **Version:** that of [`turbo-collection-spec.md`](turbo-collection-spec.md),
> of which this file is a part.

## 7. Backup

### 7.1 Mirroring (`R-MIRROR-*`)

The semantics of the mirror mechanism, as distinct from the storage layout
contract in `turbo-collection-spec.md` Section 6. Mirroring is symmetric between
peer copies, and is what the **backup** operation (R-CLI-5) performs.

**R-MIRROR-1.** When mirroring two Copies, Turbo-Collection MUST copy to each
Copy every Content File the other holds that is absent at it. Where the
manifests of the two Copies state different checksums for a Content File at one
path, Turbo-Collection MUST NOT copy that file to either Copy, MUST NOT
overwrite it in either Copy, and MUST report the difference (R-INT-7), whether
both Copies hold that file or only one does.

> **Example.** Two copies hold different bytes at the same path: neither is
> overwritten, and the difference is reported. So it is where one Copy has lost
> its file and its manifest still states a checksum that the other Copy's file
> does not have: that file is not copied there.

**R-MIRROR-2.** Mirroring MUST be read-only with respect to every **content
file** already present in a copy. It MUST NOT modify, rename, move, or delete
one. Mirroring MUST record each arrival it makes in that directory's receipt
(R-REC-5). Into a Copy, mirroring MUST write only these files:

- each Content File it copies to that Copy (R-MIRROR-1);
- a manifest, or an entry added to one, as R-MIRROR-10 states;
- an arrival file or an error file of that Run, and each receipt file the other
  Copy holds that this Copy lacks (`meta-file-spec.md` R-MFILE-13,
  `verify-spec.md` R-REC-6, R-REC-9);
- in a Copy that the backup creates, its configuration file and its ignore file
  (`turbo-collection-core-spec.md` R-CLI-13);
- a file it has not finished writing, in the `.turbo-collection/tmp/` directory
  of that Copy (R-MIRROR-6).

**R-MIRROR-3.** Turbo-Collection MUST NOT delete a file in any copy, and MUST
NOT provide a configuration setting or a command-line flag that permits deletion
in a copy. The single exception is R-MIRROR-8.

**R-MIRROR-4.**  
**Idempotence.**  
Mirroring copies already in agreement MUST transfer no file data.

**R-MIRROR-5.** Turbo-Collection MUST support more than one copy and MUST treat
each independently: a failure against one MUST NOT prevent the attempt against
another, and MUST still be reported.

**R-MIRROR-6.** An interrupted run (power loss, disconnected drive, termination)
MUST leave a copy in a state from which a subsequent run converges to a correct
mirror. A run MUST NOT leave a partially-written file that a later run would
mistake for a complete one. Turbo-Collection MUST therefore write each Content
File, manifest and receipt file that mirroring writes into a Copy first into the
`.turbo-collection/tmp/` directory at the root of that Copy (`meta-file-spec.md`
R-MFILE-2), and MUST move it to its path only once it is completely written.

> **Example.** A backup is stopped while it copies `photo.jpg`. What it wrote so
> far is in `.turbo-collection/tmp/`, and nothing is at the path of `photo.jpg`,
> so the next backup finds that file absent and copies it again.

**R-MIRROR-7.**  
**Dry-Run**  
Turbo-Collection MUST support a Dry-Run mode that reports exactly what a real
run would transfer, and mutates nothing.

**R-MIRROR-8.**  
**deletion exception for incomplete work.**  
Turbo-Collection MAY remove a file from the `.turbo-collection/tmp/` directory
at the root of a Copy, which holds only files that a Run has not finished
writing (R-MIRROR-6). Turbo-Collection MUST NOT remove anything else.

> **Example.** A half-written `photo.jpg` left in `.turbo-collection/tmp/` by an
> interrupted run may be removed; `photo.jpg` at its path may not.

**R-MIRROR-9.** Turbo-Collection MUST verify a Content File against its Copy's
manifest as it copies that file to another Copy. Turbo-Collection MUST NOT move
a file it copies to that file's path (R-MIRROR-6) where the file's checksum does
not match that manifest, MUST NOT copy a Content File that its Copy's manifest
does not list (`verify-spec.md` R-INT-8), and MUST report each such file as an
error.

> **Example.** A file that corrupted silently in one copy is caught before it
> reaches a fresh copy. A file a person put into a Copy with a file manager is
> reported as an error, and no backup carries it to another Copy.

**R-MIRROR-10.** Where mirroring copies a Content File into a directory, it MUST
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

**R-MIRROR-11.** Where the manifests of one directory in the two Copies name a
different Layout or a different Import Source (`meta-file-spec.md` R-MFILE-9,
`specId`), Turbo-Collection MUST copy no Content File into that directory in
either Copy, MUST report that directory as an error, and MUST still mirror every
other directory. A Run that reports such a directory MUST exit with a non-zero
status.

**R-MIRROR-12.** Turbo-Collection MUST refuse to mirror two Copies unless their
ignore files hold the same patterns in the same order (`meta-file-spec.md`
R-MFILE-20), where a Copy with no ignore file holds no pattern. Turbo-Collection
MUST refuse before it writes into either Copy, and MUST report the ignore file
of each Copy.

> **Example.** A pattern added to the working Copy's `.tcignore` and not to the
> home Copy's stops the next backup of the two, which names both files. Once the
> two hold the same patterns, the backup runs. A comment or a blank line that
> only one of them holds changes nothing.
