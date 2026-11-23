# Init or an import creates the first TC Copy; backup creates every later TC Copy

**Status:** Accepted **Date:** 2026-11-21

Replaces the record of 2026-11-14, under which backup required a name for every
TC Copy it created. That record held that a guessed name would be permanent in
every receipt, and that two drives each holding a folder of one name would give
two TC Copies one name. A backup now names a later TC Copy after its TC
Directory, and numbers that name where it is taken, which answers the second for
every TC Copy made from one hub. `--tc-copy` still names a TC Copy for where it
rests.

A directory becomes a TC Directory when Turbo-Collection writes its
configuration, which states the collection its TC Copy belongs to and the name
every receipt will use for that TC Copy
([the collection-naming decision](2026-10-25-collection-naming-decision.md)).
Init, import and backup do that, and no other operation ever does:

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
  directory. Init is where a person chooses either name, or edits a TC Copy's
  ignore file before anything enters it (`R-MFILE-21`).
- **`import`** also creates the **first** TC Copy of a new collection, where the
  directory it imports into does not exist or is not a TC Directory, as init
  would given that directory and no name, and then imports into it (`R-SRC-27`).
  Its collection takes its directory's name, and its TC Copy is `main`. Every
  check init makes comes before an import writes anything but its log, and so
  does a refusal of a directory to import from that would contain that new TC
  Copy. Its report and its dry run name the TC Directory it makes and both names
  it writes. Import takes no `--name` or `--tc-copy`, so names are chosen in one
  place.
- **`backup`** creates **every later** TC Copy. Given a TC Directory, it mirrors
  it; given one that is empty or does not exist, it creates a TC Copy there and
  fills it; given anything else, it refuses and lists what the directory holds.
  "Empty" means holding nothing except files the existing TC Copy's ignore file
  ignores, and a new TC Copy starts with a duplicate of that ignore file and
  with the existing TC Copy's `collectionId` and `collectionName`. A new TC Copy
  takes its name from `--tc-copy`, or else from its TC Directory, numbered where
  that name is taken. Creation needs exactly one existing TC Copy, which settles
  whose ignore file and whose collection are inherited.

Files a person already has enter a TC Copy as every other file does, by an
import.

These smaller rules complete it.

**A TC Copy is named after its directory, except the first.** Init follows a
flow people already know from `yarn init`: run in a directory, it names what it
makes after that directory and asks nothing. A first TC Copy's directory already
names its collection, such as `Family Photos`, so that TC Copy is `main`, the
hub, and an import that creates a TC Copy names both as init does given no name.
A later TC Copy sits in a folder a person made on a drive, and a backup takes
that folder's name, so no one has to invent a name for every drive. Where a
person wants a name for where a TC Copy rests, such as `home` or `off-site`,
`--tc-copy` gives it.

**A taken name is numbered, not refused.** A name is taken where the existing TC
Copy holds it, or a receipt file in that TC Copy carries it, without regard to
letter case (`R-BACKUP-1`). A backup leaves both its TC Copies holding every
receipt file (`R-REC-6`), so a hub holds a name for each TC Copy made from it:
`F:\photos` becomes `photos`, and then `G:\photos` becomes `photos-2`, a pattern
people know from copying folders. Only a number after a final `-` is raised, so
`photos-2` gives `photos-3`, and `Photos 2019` gives `Photos 2019-2` rather than
a name that reads as another year. A name given with `--tc-copy` is checked
against that existing TC Copy's name alone, so that a replacement drive can take
a dead TC Copy's name. Two TC Copies made from TC Copies that have not met since
can still share a name, and a run that connects them refuses (`R-MFILE-19`).

**A TC Copy's name may be in any script.** It is kept as typed, in Unicode
Normalization Form C, and holds no control character and none of
`< > : " / \ | ? *`, the characters some operating system refuses in a filename,
because receipt filenames carry it (`R-MFILE-19`). Two names that differ only by
letter case are one name, on every computer whatever its language. A
collection's name appears in no filename and has only to be non-empty. A drive's
root has no name of its own, so a backup into one is given `--tc-copy`.

**Every directory a path needs is created.** `init a/b/c` creates all three, and
an import and a backup do the same, so a person meets one behavior in every
operation that creates a TC Copy.

**An import given no TC Directory makes one in its working directory where a
search finds none**
([the working-directory decision](2026-11-14-working-directory-decision.md)), as
init does given no directory (`R-INIT-2`). A working directory that holds a file
stops it, as it stops init (`R-INIT-3`), so an import run by mistake from a home
folder writes nothing.

**Two imports making one TC Copy at once cannot both succeed.** A TC Copy's
configuration file is written first, and only where nothing exists, so the
second ends with an error (`R-PARALLEL-2`, `R-PARALLEL-3`). A collection's lock
cannot keep them apart, since each such import generates a `collectionId` of its
own.

**No TC Copy lies inside another.** Every run refuses a directory inside a TC
Copy, init, import and backup included, before it makes a directory or writes a
file, and a run that finds a configuration file below a TC Directory fails too
(`R-CLI-18`). This holds for two TC Copies of one collection as it does for TC
Copies of two collections. A TC Copy inside another keeps its meta files in that
TC Copy's directories, so runs of both would write one manifest, and for two
collections each of those runs would hold only its own collection's lock.

**Init has a dry run, as import and backup do.** `--dry-run` is an option of
every command. Given it, init makes every check it makes before it writes, fails
where init would, and otherwise names the TC Directory it would make and the
names it would write, making no directory and writing nothing but its run's log
(`R-INIT-5`). Those checks find what a person cannot see at a glance: a TC Copy
in a directory above (`R-CLI-18`), a hidden file that stops init (`R-INIT-3`), a
link in a path (`R-CLI-20`), and a name that cannot be used (`R-INIT-4`). A dry
run reports no `collectionId`, since a real init generates its own. An import
that would make a TC Copy reports in its dry run what init's would, and what it
would import (`R-SRC-27`).

**A replacement drive takes the dead TC Copy's name**, given with `--tc-copy`.
Receipts record where content was placed, never that a TC Copy survives
(`R-REC-8`), a release already requires a real verification, and location
receipts exist to record which volumes have stood behind a name (`R-MFILE-26`).
So a reused name vouches for nothing it should not. Besides a default name's
number, the one rule against a shared name is the refusal when two connected TC
Copies state one name (`R-MFILE-19`).

## Rejected

- **A later TC Copy's name required on the run that creates it.** The rule until
  2026-11-21, on the ground that a guessed name would be permanent in every
  receipt and that two drives each holding a folder of one name would give two
  TC Copies one name. Reversed because numbering a taken name answers the
  second, and a folder's name is one a person already chose.
- **Refusing a default name that is taken.** A number lets that backup through,
  as a copied folder gets one.
- **Raising any number at a name's end.** `Photos 2019` would become
  `Photos 2020`, which reads as another year's photographs.
- **Import never creating a TC Copy, so that init comes first.** The rule until
  2026-11-14, on the ground that creation is a deliberate act with its own
  operation, and that a routine operation able to create one could turn any
  unmarked directory into a TC Directory. Reversed because init's refusal of a
  directory that holds a file stops an import as it stops init. A mistyped
  directory that does not exist becomes a stray collection, which import's
  report names and which costs a deletion, since an import leaves its files
  where they were (`R-SRC-7`).
- **An import that creates a TC Copy only in a directory its command line
  names.** It would end a run that forgot to change directory with "no TC
  Directory found" rather than init's list of files in the way. Init's refusal
  already stops that run, and its error can say both.
- **Import with a `--name` and a `--tc-copy` of its own.** Names would be chosen
  in two places, and each option would need an error for an import into a TC
  Copy that already exists.
- **Init takes in what its directory already holds.** The rule from 2026-09-30
  until 2026-10-12. It had itself overturned "init requires an empty directory",
  on the ground that a directory already full of photographs is the ordinary
  starting point. Reversed because init then does one small thing, because an
  init run on the wrong directory fails where it would have recorded every file
  beneath it for good, and because taking files in where they sit needs an
  in-place import, which waits for a later version. A directory full of
  photographs is still the ordinary starting point: it is brought in by an
  import.
- **Init without a dry run.** The rule from 2026-10-18 until 2026-11-08, on the
  ground that init writes into an empty directory and leaves nothing a person
  cannot see or delete. What init checks is not what a person sees, and one
  `--dry-run` for every command is one behavior to learn.
- **The first TC Copy named after its directory.** The rule on 2026-10-13. Its
  directory's name already names its collection, and `main` says which TC Copy
  is the hub.
- **A directory's name converted to lower case and hyphens.** The rule on
  2026-10-13, so that one spelling would serve every machine. It garbled a name
  in any other script, and a filename needs only a short list of characters kept
  out.
- **Creating only the last segment of a path.** The rule until 2026-10-13. Its
  ground was a removable drive's mount point, which exists only while that drive
  is connected: creating a whole missing path could build a TC Copy on whatever
  disk the parent resolves to, with the drive it was meant for sitting
  unplugged. Reversed so that a path given to init, to an import or to a backup
  is simply created, and all three agree. Nothing in this rule now stops that
  case.
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
- **Init for every TC Copy, with backup never creating one.** It adds a step
  whose only output is an empty TC Copy that the next backup fills anyway.
  Backup detects the state of each directory instead, as a build tool tells a
  full build from an incremental one.
- **Numbered default names for later TC Copies** (`copy-2`). A permanent name
  that says nothing about its TC Copy, where a folder's name says what a person
  called it.
- **Retiring a dead TC Copy's name, a check of a given name against receipts, or
  a `--replace` flag.** Each guarded against a receipt vouching for a new drive,
  which a receipt never does.
- **Refusing a path the tool judges wrong.** The tool cannot know intent, so it
  checks only facts it can verify.

## Touches

`init-spec.md`: `R-INIT-1` to `R-INIT-4` (init: what it writes, its directory,
its refusal of a directory that holds a file and its report of every such file,
the `collectionId` it generates, and its two names), which were `R-CLI-11` and a
sentence of `R-MFILE-19` until 2026-10-18, and `R-INIT-5`, its dry run.
`import-spec.md`: `R-SRC-27` (an import making a TC Copy, its checks, its report
and its dry run), and `R-SRC-25`'s example. `turbo-collection-core-spec.md`:
`R-CLI-5` names init, and makes dry run a mode of init, import and backup;
`R-CLI-14` (no operation but init, import and backup creates a TC Copy),
`R-CLI-18` (no TC Copy inside another, for every run) and `R-CLI-22` (a run's
working directory, where a search finds no TC Directory). `backup-spec.md`:
`R-BACKUP-1` (backup creating a TC Copy, and its name: given, or its TC
Directory's, numbered where taken) and `R-BACKUP-2` (every directory a backup's
path needs is created), which were `R-CLI-13` and a sentence of `R-CLI-14` until
2026-10-21. `parallel-safety-spec.md`: `R-PARALLEL-2` (a configuration file
written first, by init, an import or a backup). `R-CLI-12`, under which init
performed an in-place import, was removed on 2026-10-12. The in-place importer
specification was withdrawn with it, and so was `R-FOUND-2` in
`supplied-path-layout-spec.md`. `turbo-collection-spec.md`: the glossary holds
_Init_ and _Ignored file_. `meta-file-spec.md`: `R-MFILE-19` states that a TC
Copy's identity is set once, at creation, that backup passes the `collectionId`
on, and what a TC Copy's name may hold; `R-MFILE-20` and `R-MFILE-21` carry the
starter ignore file and the rule that an ignored file never enters a TC Copy
([the starter-ignore-file decision](2026-10-18-starter-ignore-file-decision.md)).
The setup procedure's `R-SET-15` runs init, and its `R-SET-10` and `R-SET-11`
create the later TC Copies by backup.
