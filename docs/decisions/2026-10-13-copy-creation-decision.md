# Init creates the first copy in an empty directory; backup creates every later copy

**Status:** Accepted
**Date:** 2026-10-13

Replaces the record of 2026-10-12, under which the first copy was named `main` unless told
otherwise, and only the last segment of a path was ever created. Both reversed, and _Rejected_ says
why.

A directory becomes a copy when Turbo-Collection writes its configuration, which carries the name
every receipt will use for that copy. Init and backup do that, and no other operation ever does:

- **`init`** creates the **first** copy, in the directory it is given, or in the current directory
  where it is given none. A name given on the command line names the copy. Without one, the copy
  takes the name of its directory, in lower case and with a hyphen for each run of anything that is
  not a letter or a digit; a name that cannot be used is an error, and there is no prompt. A
  description may be given, and none is written otherwise. Init writes a configuration file and a
  starter ignore file, and nothing else. It refuses a directory that holds a file, at any depth,
  unless a starter ignore pattern matches that file: a file an operating system left behind does
  not stand in the way, and a folder of photographs picked by mistake is left as it was. That is
  the one check init makes. A directory that is already a copy holds its configuration file, and
  one that contains a copy holds that copy's files, so init stops on both and changes nothing,
  which protects the name a copy's receipts already carry.
- **`backup`** creates **every later** copy. Given a directory that is a copy, it mirrors it; given
  one that is empty or does not exist, it creates a copy there and fills it; given anything else, it
  refuses and lists what the directory holds. "Empty" means holding nothing except files the
  existing copy's ignore file ignores, and the new copy starts with a duplicate of that ignore file.
  A name is required on the run that creates a copy, and creation needs exactly one existing copy,
  which settles whose ignore file is inherited.
- **`import`** never creates a copy. A directory that is not a copy is an error.

Files a person already has enter a copy as every other file does, by an import.

These smaller rules complete it.

**Init may take a name from its directory; backup never does.** Init follows a flow people already
know from `yarn init`: run in a directory, it names what it makes after that directory and asks
nothing. That suits the first copy. A later copy is named for where it rests, which only the
operator knows, and two drives that each hold a folder of one name would give two copies one name,
which stops every run (`R-MFILE-19`). So backup has no default, and a guessed one would be permanent
in every receipt.

**A name is lower case letters, digits and hyphens.** One form serves a name a person types and a
name taken from a directory, and neither needs quoting on a command line. A letter outside ASCII is
not converted and not guessed at: it is an error that asks for a name, because one spelling per name
is what lets a receipt's filename match on every machine. A description takes any script.

**Every directory a path needs is created.** `init a/b/c` creates all three, and backup does the
same, so a person meets one behavior in both operations.

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
- **A default name of `main` for the first copy.** The rule until 2026-10-13, on the ground that a
  directory's name describes a drive or a tool and not a copy. Reversed for the first copy, where
  the familiar flow of `yarn init` was worth more, and kept for every later copy, as above.
- **Creating only the last segment of a path.** The rule until 2026-10-13. Its ground was a
  removable drive's mount point, which exists only while that drive is connected: creating a whole
  missing path could build a copy on whatever disk the parent resolves to, with the drive it was
  meant for sitting unplugged. Reversed so that a path given to init or to backup is simply
  created, and the two agree. Nothing in this rule now stops that case.
- **Checks of their own for a copy at, under or above the directory.** The rule until 2026-10-13,
  when init was kept to one check: a directory that holds a file is not made a copy. That check
  already stops a directory that is a copy and one that contains a copy. It does not stop a
  directory inside a copy, and nothing else does.
- **A question for the name, as `npm init` asks.** Familiar, but `yarn init` asks nothing, and no
  operation may need a prompt (`R-CLI-8`).
- **A directory name used unchanged, or refused where it cannot be a name.** Unchanged, it breaks
  the name rule at the first space. Refused, the first command fails for anyone whose folder is
  named `My Photos`.
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

`turbo-collection-core-spec.md`: `R-CLI-5` names init; `R-CLI-11` (init: its directory, its name,
its description, and its refusal of a directory that holds a file), `R-CLI-13` (backup creating a
copy) and `R-CLI-14` (no other operation creates one; every directory a path needs is created).
`R-CLI-12`, under which init performed an in-place import, was removed on 2026-10-12. The in-place
import source specification was withdrawn with it, and so was `R-FOUND-2` in
`as-found-path-layout-spec.md`. `turbo-collection-spec.md`: the glossary holds _Init_ and _Ignored
file_. `meta-file-spec.md`: `R-MFILE-19` states that a name is set once, at creation, and what it
may hold; `R-MFILE-20` and `R-MFILE-21` carry the starter ignore file and the rule that an ignored
file never enters a copy
([the starter-ignore-file decision](2026-10-02-starter-ignore-file-decision.md)). The setup
procedure's `R-SET-15` runs init, and its `R-SET-10` and `R-SET-11` create the later copies by
backup.
