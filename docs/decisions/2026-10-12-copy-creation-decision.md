# Init creates the first copy in an empty directory; backup creates every later copy

**Status:** Accepted
**Date:** 2026-10-12

Replaces the record of 2026-09-30, under which init also took in whatever its directory already
held. That part reversed, and _Rejected_ says why.

A directory becomes a copy when Turbo-Collection writes its configuration, which carries the name
every receipt will use for that copy. Init and backup do that, and no other operation ever does:

- **`init`** creates the **first** copy, in the directory it is given. The name defaults to `main`
  and a name given on the command line overrides it; there is no prompt. Init writes a
  configuration file and a starter ignore file, and nothing else. It refuses a directory that holds
  a file, at any depth, unless a starter ignore pattern matches that file: a file an operating
  system left behind does not stand in the way, and a folder of photographs picked by mistake is
  left as it was. Run on a directory that is already a copy, init fails and changes nothing, which
  protects the name that copy's receipts already carry. It refuses a directory inside a copy or
  containing one.
- **`backup`** creates **every later** copy. Given a directory that is a copy, it mirrors it; given
  one that is empty or does not exist, it creates a copy there and fills it; given anything else, it
  refuses and lists what the directory holds. "Empty" means holding nothing except files the
  existing copy's ignore file ignores, and the new copy starts with a duplicate of that ignore file.
  A name is required on the run that creates a copy, and creation needs exactly one existing copy,
  which settles whose ignore file is inherited.
- **`import`** never creates a copy. A directory that is not a copy is an error.

Files a person already has enter a copy as every other file does, by an import.

These smaller rules complete it.

**A name comes from the operator, never from a directory.** A directory name describes a drive or a
tool, and is likely identical on every drive while the copies differ. Init has a sensible default
because the first copy is almost always the working one; backup has none, because a later copy is
named for where it rests, which only the operator knows, and a guessed default would be permanent in
every receipt.

**Only the last path segment is ever created.** A removable drive's mount point exists only while
that drive is connected. Creating a whole missing path could therefore build a copy on whatever disk
the parent happens to resolve to, with the drive it was meant for sitting unplugged. Creating one
segment makes a disconnected drive fail instead.

**A replacement drive takes the dead copy's name.** Receipts record where content was placed, never
that a copy survives (`R-REC-8`), a release already requires a real verification, and location
receipts exist to record which volumes have stood behind a name (`R-MFILE-26`). So a reused name
vouches for nothing it should not. The one duplicate-name rule is the existing refusal when two
connected copies state one name (`R-MFILE-19`).

## Rejected

- **Init takes in what its directory already holds.** The rule from 2026-09-30 until this date. It
  had itself overturned "init requires an empty directory", on the ground that a directory already
  full of photographs is the ordinary starting point. Reversed because init then does one small
  thing, because an init run on the wrong directory fails where it would have recorded every file
  beneath it for good, and because taking files in where they sit needs an in-place import, which
  waits for a later version. A directory full of photographs is still the ordinary starting point:
  it is brought in by an import.
- **The first import or backup creates the first copy from a name argument.** It makes a routine
  operation able to turn any unmarked directory into a copy. Creation is a deliberate act with its
  own operation.
- **Init for every copy, with backup never creating one.** It adds a step whose only output is an
  empty copy that the next backup fills anyway. Backup detects the state of each directory instead,
  as a build tool tells a full build from an incremental one.
- **A new copy's name taken from its directory.** See above: the name would describe the drive, not
  the copy.
- **Numbered default names for later copies** (`copy-2`). A permanent name that says nothing about
  where a copy lives.
- **Creating missing parent directories.** See above.
- **Retiring a dead copy's name, a name check, or a `--replace` flag.** Each guarded against a
  receipt vouching for a new drive, which a receipt never does.
- **Refusing a path the tool judges wrong.** The tool cannot know intent, so it checks only facts it
  can verify.

## Touches

`turbo-collection-core-spec.md`: `R-CLI-5` names init; `R-CLI-11` (init, and its refusal of a
directory that holds a file), `R-CLI-13` (backup creating a copy) and `R-CLI-14` (no other operation
creates one; last path segment only). `R-CLI-12`, under which init performed an in-place import, was
removed on 2026-10-12. The in-place import source specification was withdrawn with it, and so was
`R-FOUND-2` in `as-found-path-layout-spec.md`. `turbo-collection-spec.md`: the glossary holds _Init_
and _Ignored file_. `meta-file-spec.md`: `R-MFILE-19` states that a name is set once, at creation;
`R-MFILE-20` and `R-MFILE-21` carry the starter ignore file and the rule that an ignored file never
enters a copy ([the starter-ignore-file decision](2026-10-02-starter-ignore-file-decision.md)). The
setup procedure's `R-SET-15` runs init, and its `R-SET-10` and `R-SET-11` create the later copies by
backup.
