# Init creates the first copy and takes in what is already there; backup creates every later copy

**Status:** Accepted
**Date:** 2026-09-30

A directory becomes a copy when Turbo-Collection writes its configuration, which carries the name
every receipt will use for that copy. Two operations do that, and no other ever does:

- **`init`** creates the **first** copy, in the directory it is given. The name defaults to `main`
  and a name given on the command line overrides it; there is no prompt. Files already in that
  directory are **adopted in place**, in the same operation: they become content of the copy without
  moving, recorded as an import. Where no ignore file exists, init writes a starter one before
  adopting, so files an operating system scatters are not taken in as permanent content. Run on a
  directory that is already a copy, init fails and changes nothing, which protects the name that
  copy's receipts already carry. It refuses a directory inside a copy or containing one.
- **`backup`** creates **every later** copy. Given a directory that is a copy, it mirrors it; given
  one that is empty or does not exist, it creates a copy there and fills it; given anything else, it
  refuses and lists what the directory holds. "Empty" means holding nothing except files the
  existing copy's ignore file ignores, and the new copy starts with a duplicate of that ignore file.
  A name is required on the run that creates a copy, and creation needs exactly one existing copy,
  which settles whose ignore file is inherited.
- **`import`** never creates a copy. A directory that is not a copy is an error.

Three smaller rules complete it.

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

- **Init requires an empty directory.** The first recommendation, to keep found files from becoming
  permanent unexplained extras. Overturned: a directory already full of photographs is the ordinary
  starting point, and adopting those files as an import explains every one of them.
- **Adopted files move into the date layout.** A person's existing arrangement is information, and
  moving files is the one thing an add-only tool does not do. Adopted files stay where they sit
  ([the layout-selection decision](2026-10-03-layout-selection-decision.md)).
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

`turbo-collection-spec.md`: `R-CLI-5` gains init; `R-CLI-11` (init), `R-CLI-12` (adoption),
`R-CLI-13` (backup creating a copy) and `R-CLI-14` (no other operation creates one; last path
segment only) added; `R-SRC-7` amended for adoption; the glossary gains _Init_, _Adoption_ and
_Ignored file_. `meta-file-spec.md`: `R-MFILE-19` states that a name is set once, at creation;
`R-MFILE-20` and `R-MFILE-21` carry the starter ignore file and the rule that an ignored file never
enters a copy ([the starter-ignore-file decision](2026-10-02-starter-ignore-file-decision.md)).
`as-found-path-layout-spec.md` is the layout of an adoption. The setup procedure gains `R-SET-15`
and its `R-SET-10` and `R-SET-11` create the later copies by backup.
