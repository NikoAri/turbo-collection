> **Version:** that of [`turbo-collection-spec.md`](turbo-collection-spec.md),
> of which this file is a part.

## Init (`R-INIT-*`)

**R-INIT-1.** **Init Operation** Turbo-Collection MUST provide an **init**
operation that makes a directory it is given a TC Directory, by writing into
that directory a configuration file (`meta-file-spec.md` R-MFILE-17) and an
ignore file holding every starter pattern that `meta-file-spec.md` describes
(R-MFILE-20).

**R-INIT-2.** Init MUST create a directory it is given that does not exist, with
every directory above it that does not exist. Where it is given no directory,
init MUST act on its current working directory.

**R-INIT-3.** Init MUST refuse a directory that holds any file, at any depth,
other than one a starter pattern matches, and MUST report every such file.

> **Example.** An init run by mistake on a folder of photographs fails and
> writes nothing. A folder that holds only a `.DS_Store` its operating system
> left there is made a TC Directory. A directory that is already a TC Directory
> holds its configuration file, so an init of it fails too.

**R-INIT-4.** Turbo-Collection MUST generate a new `collectionId` for a TC Copy
that init creates. Init MUST take a new Collection's `collectionName` from a
name given on its command line for that Collection and, where none is given,
from that TC Copy's TC Directory's name, unchanged. Init MUST take that TC
Copy's `tcCopyName` from a name given on its command line for that TC Copy and,
where none is given, MUST set `tcCopyName` to `main`. Where a name is not valid
(`meta-file-spec.md` R-MFILE-18, R-MFILE-19), init MUST refuse, and MUST report
which name is not valid.

> **Example.** An init of a folder named `Photos (2019)`, given neither name,
> makes a TC Copy named `main` of a Collection named `Photos (2019)`.
