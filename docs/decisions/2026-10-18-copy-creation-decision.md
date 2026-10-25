# Init creates the first TC Copy in an empty directory; backup creates every later TC Copy

**Status:** Accepted **Date:** 2026-10-18

Replaces the record of 2026-10-17. Init has no dry run, and it lists every file
that stops it. The dry run came in on 2026-09-30, when init took in the files
already in its directory and a dry run could list them, and with that parked it
had nothing left to show.

A directory becomes a TC Directory when Turbo-Collection writes its
configuration, which states the collection its TC Copy belongs to and the name
every receipt will use for that TC Copy
([the collection-naming decision](2026-10-25-collection-naming-decision.md)).
Init and backup do that, and no other operation ever does:

- **`init`** creates the **first** TC Copy of a new collection, in the directory
  it is given, or in the current directory where it is given none. It generates
  the collection's `collectionId`. `--name` names the collection, and without it
  the collection takes its directory's name as it stands. `--tc-copy` names the
  TC Copy, and without it the TC Copy is `main`. A name that cannot be used is
  an error, and there is no prompt. Init writes a configuration file and a
  starter ignore file, and nothing else. It refuses a directory that holds a
  file, at any depth, unless a starter ignore pattern matches that file, and
  lists every such file: a file an operating system left behind does not stand
  in the way, and a folder of photographs picked by mistake is left as it was. A
  directory that is already a TC Directory holds its configuration file, and one
  that contains a TC Copy holds that TC Copy's files, so init stops on both and
  changes nothing, which protects the name a TC Copy's receipts already carry. A
  directory inside a TC Copy is refused as well, before init makes any
  directory.
- **`backup`** creates **every later** TC Copy. Given a TC Directory, it mirrors
  it; given one that is empty or does not exist, it creates a TC Copy there and
  fills it; given anything else, it refuses and lists what the directory holds.
  "Empty" means holding nothing except files the existing TC Copy's ignore file
  ignores, and the new TC Copy starts with a duplicate of that ignore file and
  with the existing TC Copy's `collectionId` and `collectionName`. A name is
  required on the run that creates a TC Copy, and creation needs exactly one
  existing TC Copy, which settles whose ignore file and whose collection are
  inherited.
- **`import`** never creates a TC Copy. A directory that is not a TC Directory
  is an error.

Files a person already has enter a TC Copy as every other file does, by an
import.

These smaller rules complete it.

**Init takes the collection's name from its directory; no operation takes a TC
Copy's name from one.** Init follows a flow people already know from
`yarn init`: run in a directory, it names what it makes after that directory and
asks nothing. A directory's name, such as `Family Photos`, says what is kept,
which is the collection. A TC Copy is named for where it rests, which only the
operator knows, and two drives that each hold a folder of one name would give
two TC Copies one name, which stops every run (`R-MFILE-19`). So the first TC
Copy is `main`, the hub, and backup has no default: a guessed name would be
permanent in every receipt.

**A TC Copy's name may be in any script.** It is kept as typed, in Unicode
Normalization Form C, and holds no control character and none of
`< > : " / \ | ? *`, the characters some operating system refuses in a filename,
because receipt filenames carry it (`R-MFILE-19`). Two names that differ only by
letter case are one name, on every computer whatever its language. A
collection's name appears in no filename and has only to be non-empty.

**Every directory a path needs is created.** `init a/b/c` creates all three, and
backup does the same, so a person meets one behavior in both operations.

**No TC Copy lies inside another.** Every run refuses a directory inside a TC
Copy, init and backup included, before it makes a directory or writes a file,
and a run that finds a configuration file below a TC Directory fails too
(`R-CLI-18`). This holds for two TC Copies of one collection as it does for TC
Copies of two collections. A TC Copy inside another keeps its meta files in that
TC Copy's directories, so runs of both would write one manifest, and for two
collections each of those runs would hold only its own collection's lock.

**Init has no dry run.** Init writes its configuration file and ignore file into
an empty directory, writes nothing when it fails, and leaves a TC Copy that can
be deleted while nothing refers to it. A dry run would report only what a person
can already see, and `yarn init` offers none either.

**A replacement drive takes the dead TC Copy's name.** Receipts record where
content was placed, never that a TC Copy survives (`R-REC-8`), a release already
requires a real verification, and location receipts exist to record which
volumes have stood behind a name (`R-MFILE-26`). So a reused name vouches for
nothing it should not. The one duplicate-name rule is the existing refusal when
two connected TC Copies state one name (`R-MFILE-19`).

## Rejected

- **Init takes in what its directory already holds.** The rule from 2026-09-30
  until 2026-10-12. It had itself overturned "init requires an empty directory",
  on the ground that a directory already full of photographs is the ordinary
  starting point. Reversed because init then does one small thing, because an
  init run on the wrong directory fails where it would have recorded every file
  beneath it for good, and because taking files in where they sit needs an
  in-place import, which waits for a later version. A directory full of
  photographs is still the ordinary starting point: it is brought in by an
  import.
- **A dry run of init.** The rule from 2026-09-30 until 2026-10-18. It came in
  with init's taking in the files already in its directory, which a dry run
  could list. With that parked, it cost a flag and code to report what a person
  can already see.
- **The first TC Copy named after its directory.** The rule on 2026-10-13. A
  directory's name says what is kept, which is the collection; a TC Copy is
  named for where it rests.
- **A directory's name converted to lower case and hyphens.** The rule on
  2026-10-13, so that one spelling would serve every machine. It garbled a name
  in any other script, and a filename needs only a short list of characters kept
  out.
- **Creating only the last segment of a path.** The rule until 2026-10-13. Its
  ground was a removable drive's mount point, which exists only while that drive
  is connected: creating a whole missing path could build a TC Copy on whatever
  disk the parent resolves to, with the drive it was meant for sitting
  unplugged. Reversed so that a path given to init or to backup is simply
  created, and the two agree. Nothing in this rule now stops that case.
- **Checks of their own for a TC Copy at or under the directory.** The rule
  until 2026-10-13. The check for a file already stops a directory that is a TC
  Directory and one that contains a TC Copy.
- **Naming only the first file that stops init.** It says why init stopped, but
  a person clearing stray files would need one run per file. Listing every file
  takes one run, as backup's refusal lists what its directory holds.
- **Letting a directory inside a TC Copy be made a TC Directory.** The rule from
  2026-10-13 until 2026-10-17, when init checked only for files and nothing else
  stopped one. Reversed for the reason under _No TC Copy lies inside another_,
  above.
- **A question for the name, as `npm init` asks.** Familiar, but `yarn init`
  asks nothing, and no operation may need a prompt (`R-CLI-8`).
- **The first import or backup creates the first TC Copy from a name argument.**
  It makes a routine operation able to turn any unmarked directory into a TC
  Directory. Creation is a deliberate act with its own operation.
- **Init for every TC Copy, with backup never creating one.** It adds a step
  whose only output is an empty TC Copy that the next backup fills anyway.
  Backup detects the state of each directory instead, as a build tool tells a
  full build from an incremental one.
- **A later TC Copy's name taken from its TC Directory.** See above: two TC
  Copies would share one name.
- **Numbered default names for later TC Copies** (`copy-2`). A permanent name
  that says nothing about where a TC Copy lives.
- **Retiring a dead TC Copy's name, a name check, or a `--replace` flag.** Each
  guarded against a receipt vouching for a new drive, which a receipt never
  does.
- **Refusing a path the tool judges wrong.** The tool cannot know intent, so it
  checks only facts it can verify.

## Touches

`init-spec.md`: `R-INIT-1` to `R-INIT-4` (init: what it writes, its directory,
its refusal of a directory that holds a file and its report of every such file,
the `collectionId` it generates, and its two names), which were `R-CLI-11` and a
sentence of `R-MFILE-19` until 2026-10-18. `turbo-collection-core-spec.md`:
`R-CLI-5` names init, and makes dry run a mode of import and backup only;
`R-CLI-14` (no other operation creates a TC Copy) and `R-CLI-18` (no TC Copy
inside another, for every run). `backup-spec.md`: `R-BACKUP-1` (backup creating
a TC Copy) and `R-BACKUP-2` (every directory a backup's path needs is created),
which were `R-CLI-13` and a sentence of `R-CLI-14` until 2026-10-21. `R-CLI-12`,
under which init performed an in-place import, was removed on 2026-10-12. The
in-place import source specification was withdrawn with it, and so was
`R-FOUND-2` in `supplied-path-layout-spec.md`. `turbo-collection-spec.md`: the
glossary holds _Init_ and _Ignored file_. `meta-file-spec.md`: `R-MFILE-19`
states that a TC Copy's identity is set once, at creation, that backup passes
the `collectionId` on, and what a TC Copy's name may hold; `R-MFILE-20` and
`R-MFILE-21` carry the starter ignore file and the rule that an ignored file
never enters a TC Copy
([the starter-ignore-file decision](2026-10-18-starter-ignore-file-decision.md)).
The setup procedure's `R-SET-15` runs init, and its `R-SET-10` and `R-SET-11`
create the later TC Copies by backup.
