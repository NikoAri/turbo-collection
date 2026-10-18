## Init (`R-INIT-*`)

**R-INIT-1.** **Init Operation** Turbo-Collection MUST provide an **init**
operation that makes the directory it is given a copy, by writing into that
directory a configuration file (`meta-file-spec.md` R-MFILE-17) and an ignore
file holding the starter patterns that `meta-file-spec.md` describes
(R-MFILE-20).

**R-INIT-2.** Init MUST create a directory it is given that does not exist, with
every directory above it that does not exist. Where it is given no directory,
init MUST act on the current working directory.

**R-INIT-3.** Init MUST refuse a directory that holds any file, at any depth,
other than one a starter pattern matches, and MUST report every such file.

> **Example.** An init run by mistake on a folder of photographs fails and
> writes nothing. A folder that holds only a `.DS_Store` its operating system
> left there is made a copy. A directory that is already a copy holds its
> configuration file, so an init of it fails the same way.

**R-INIT-4.** Turbo-Collection MUST generate a new `collectionId` for a Copy
that init creates. Init MUST take the new Collection's `collectionName` from a
name given on the command line for the Collection and, where none is given, from
the name of the new Copy's directory, unchanged. Init MUST take the new Copy's
`copyName` from a name given on the command line for the Copy and, where none is
given, MUST set `copyName` to `main`. Where a name is not valid
(`meta-file-spec.md` R-MFILE-18, R-MFILE-19), init MUST refuse, and MUST report
which name is not valid.

> **Example.** An init of a folder named `Photos (2019)`, given neither name,
> makes a Copy named `main` of a Collection named `Photos (2019)`.
