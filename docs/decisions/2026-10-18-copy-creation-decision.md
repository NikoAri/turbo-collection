# Init creates the first copy in an empty directory; backup creates every later copy

**Status:** Accepted
**Date:** 2026-10-18

Replaces the record of 2026-10-17. Init has no dry run, and it lists every file that stops it. The
dry run came in on 2026-09-30, when init took in the files already in its directory and a dry run
could list them, and with that parked it had nothing left to show.

A directory becomes a copy when Turbo-Collection writes its configuration, which states the
collection the copy belongs to and the name every receipt will use for that copy
([the collection-naming decision](2026-10-14-collection-naming-decision.md)). Init and backup do
that, and no other operation ever does:

- **`init`** creates the **first** copy of a new collection, in the directory it is given, or in
  the current directory where it is given none. It generates the collection's `collectionId`.
  `--name` names the collection, and without it the collection takes its directory's name as it
  stands. `--copy` names the copy, and without it the copy is `main`. A name that cannot be used is
  an error, and there is no prompt. Init writes a configuration file and a starter ignore file, and
  nothing else. It refuses a directory that holds a file, at any depth, unless a starter ignore
  pattern matches that file, and lists every such file: a file an operating system left behind does
  not stand in the way, and a folder of photographs picked by mistake is left as it was. A directory
  that is already a copy holds its configuration file, and one that contains a copy holds that
  copy's files, so init stops on both and changes nothing, which protects the name a copy's
  receipts already carry. A directory inside a copy is refused as well, before init makes any
  directory.
- **`backup`** creates **every later** copy. Given a directory that is a copy, it mirrors it; given
  one that is empty or does not exist, it creates a copy there and fills it; given anything else, it
  refuses and lists what the directory holds. "Empty" means holding nothing except files the
  existing copy's ignore file ignores, and the new copy starts with a duplicate of that ignore file
  and with the existing copy's `collectionId` and `collectionName`. A name is required on the run
  that creates a copy, and creation needs exactly one existing copy, which settles whose ignore file
  and whose collection are inherited.
- **`import`** never creates a copy. A directory that is not a copy is an error.

Files a person already has enter a copy as every other file does, by an import.

These smaller rules complete it.

**Init takes the collection's name from its directory; no operation takes a copy's name from one.**
Init follows a flow people already know from `yarn init`: run in a directory, it names what it
makes after that directory and asks nothing. A directory's name, such as `Family Photos`, says what
is kept, which is the collection. A copy is named for where it rests, which only the operator knows,
and two drives that each hold a folder of one name would give two copies one name, which stops every
run (`R-MFILE-19`). So the first copy is `main`, the hub, and backup has no default: a guessed name
would be permanent in every receipt.

**A copy's name may be in any script.** It is kept as typed, in Unicode Normalization Form C, and
holds no control character and none of `< > : " / \ | ? *`, the characters some operating system
refuses in a filename, because receipt filenames carry it (`R-MFILE-19`). Two names that differ only
by letter case are one name, on every computer whatever its language. A collection's name appears
in no filename and has only to be non-empty.

**Every directory a path needs is created.** `init a/b/c` creates all three, and backup does the
same, so a person meets one behavior in both operations.

**No copy lies inside another.** Every run refuses a directory inside a copy, init and backup
included, before it makes a directory or writes a file, and a run that finds a configuration file
below a copy's root fails too (`R-CLI-18`). This holds for two copies of one collection as it does
for copies of two collections. A copy inside another keeps its meta files in that copy's
directories, so runs of both would write one manifest, and for two collections each of those runs
would hold only its own collection's lock.

**Init has no dry run.** Init writes its configuration file and ignore file into an empty directory,
writes nothing when it fails, and leaves a copy that can be deleted while nothing refers to it. A
dry run would report only what a person can already see, and `yarn init` offers none either.

**A replacement drive takes the dead copy's name.** Receipts record where content was placed, never
that a copy survives (`R-REC-8`), a release already requires a real verification, and location
receipts exist to record which volumes have stood behind a name (`R-MFILE-26`). So a reused name
vouches for nothing it should not. The one duplicate-name rule is the existing refusal when two
connected copies state one name (`R-MFILE-19`).

## Rejected

- **Init takes in what its directory already holds.** The rule from 2026-09-30 until 2026-10-12. It
  had itself overturned "init requires an empty directory", on the ground that a directory already
  full of photographs is the ordinary starting point. Reversed because init then does one small
  thing, because an init run on the wrong directory fails where it would have recorded every file
  beneath it for good, and because taking files in where they sit needs an in-place import, which
  waits for a later version. A directory full of photographs is still the ordinary starting point:
  it is brought in by an import.
- **A dry run of init.** The rule from 2026-09-30 until 2026-10-18. It came in with init's taking in
  the files already in its directory, which a dry run could list. With that parked, it cost a flag
  and code to report what a person can already see.
- **The first copy named after its directory.** The rule on 2026-10-13. A directory's name says
  what is kept, which is the collection; a copy is named for where it rests.
- **A directory's name converted to lower case and hyphens.** The rule on 2026-10-13, so that one
  spelling would serve every machine. It garbled a name in any other script, and a filename needs
  only a short list of characters kept out.
- **Creating only the last segment of a path.** The rule until 2026-10-13. Its ground was a
  removable drive's mount point, which exists only while that drive is connected: creating a whole
  missing path could build a copy on whatever disk the parent resolves to, with the drive it was
  meant for sitting unplugged. Reversed so that a path given to init or to backup is simply
  created, and the two agree. Nothing in this rule now stops that case.
- **Checks of their own for a copy at or under the directory.** The rule until 2026-10-13. The
  check for a file already stops a directory that is a copy and one that contains a copy.
- **Naming only the first file that stops init.** It says why init stopped, but a person clearing
  stray files would need one run per file. Listing every file takes one run, as backup's refusal
  lists what its directory holds.
- **Letting a directory inside a copy be made a copy.** The rule from 2026-10-13 until 2026-10-17,
  when init checked only for files and nothing else stopped one. Reversed for the reason under
  _No copy lies inside another_, above.
- **A question for the name, as `npm init` asks.** Familiar, but `yarn init` asks nothing, and no
  operation may need a prompt (`R-CLI-8`).
- **The first import or backup creates the first copy from a name argument.** It makes a routine
  operation able to turn any unmarked directory into a copy. Creation is a deliberate act with its
  own operation.
- **Init for every copy, with backup never creating one.** It adds a step whose only output is an
  empty copy that the next backup fills anyway. Backup detects the state of each directory instead,
  as a build tool tells a full build from an incremental one.
- **A later copy's name taken from its directory.** See above: two copies would share one name.
- **Numbered default names for later copies** (`copy-2`). A permanent name that says nothing about
  where a copy lives.
- **Retiring a dead copy's name, a name check, or a `--replace` flag.** Each guarded against a
  receipt vouching for a new drive, which a receipt never does.
- **Refusing a path the tool judges wrong.** The tool cannot know intent, so it checks only facts it
  can verify.

## Touches

`init-spec.md`: `R-INIT-1` to `R-INIT-4` (init: what it writes, its directory, its refusal of a
directory that holds a file and its report of every such file, the `collectionId` it generates, and
its two names), which were `R-CLI-11` and a sentence of `R-MFILE-19` until 2026-10-18.
`turbo-collection-core-spec.md`: `R-CLI-5` names init, and makes dry run a mode of import and
backup only; `R-CLI-13` (backup creating a copy), `R-CLI-14` (no other operation creates one; every
directory a backup's path needs is created) and `R-CLI-18` (no copy inside another, for every run).
`R-CLI-12`, under which init performed an in-place import, was removed on 2026-10-12. The in-place
import source specification was withdrawn with it, and so was `R-FOUND-2` in
`as-found-path-layout-spec.md`. `turbo-collection-spec.md`: the glossary holds _Init_ and _Ignored
file_. `meta-file-spec.md`: `R-MFILE-19` states that a copy's identity is set once, at creation,
that backup passes the `collectionId` on, and what a copy's name may hold; `R-MFILE-20` and
`R-MFILE-21` carry the starter ignore file and the rule that an ignored file never enters a copy
([the starter-ignore-file decision](2026-10-18-starter-ignore-file-decision.md)). The setup
procedure's `R-SET-15` runs init, and its `R-SET-10` and `R-SET-11` create the later copies by
backup.
