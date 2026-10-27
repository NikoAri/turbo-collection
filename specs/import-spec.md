> **Version:** that of [`turbo-collection-spec.md`](turbo-collection-spec.md),
> of which this file is a part.

## 5. Import (`R-SRC-*`)

Turbo-Collection's Core must be indifferent to whether a photo arrived by cable,
from iCloud, through a OneDrive sync folder, or from something not yet invented.

This contract is specified completely enough (R-META-1) that **anyone can write
an Importer from this document alone, without modifying any other Importer.**
That is what extensibility means here. How importers are loaded is a binding
(`turbo-collection-spec.md` Section 12), not a requirement.

**R-SRC-25.**  
**Import Operation**  
In an **import**, Turbo-Collection MUST take two directories from that import's
command line: first a directory to import from, then a TC Directory, naming
which TC Copy to import into. Turbo-Collection MUST import into that TC Copy,
drawing from Import Source `local-folder`
([`local-folder-import-source-spec.md`](importers/local-folder/local-folder-import-source-spec.md))
with that directory to import from as that Import Source's setting (R-SRC-3).
Turbo-Collection MUST end an import not given exactly two directories with an
error, before that import writes anything.

> **Example.** `turbo-collection import D:\moon-laptop E:\photos` imports from
> `D:\moon-laptop` into a TC Copy at `E:\photos`, and where `E:\photos` is not a
> TC Directory, is refused and imports nothing (R-CLI-14). Given
> `D:\moon-laptop` alone, an import ends with an error and imports nothing.

**R-SRC-1.** Files MUST enter a collection only by Import. Turbo-Collection's
Core MUST contain no logic specific to any individual import source, device,
vendor, or service, other than which Import Source an import draws from
(R-SRC-25).

**R-SRC-2.** Adding support for a new Import Source MUST require writing only a
new Importer and a way for a Run to name that Import Source (R-SRC-25). Adding
an Import Source MUST NOT require changing any existing Importer.

**R-SRC-3.** An Import Source's settings, such as a directory to import from,
MUST be supplied to Turbo-Collection as data rather than hardcoded in code.

**R-SRC-4.** Multiple import sources MUST be able to coexist and MUST be
importable independently. One import source's failure MUST NOT prevent import
from another, and MUST still be reported.

**R-SRC-5.** An Importer MUST supply each item as plain files. An Importer
SHOULD supply every file unaltered, without transcoding, recompressing, or
stripping metadata, and where an Import Source offers a file in more than one
version SHOULD take its unaltered version. This is a best effort:
Turbo-Collection guarantees nothing about what an Import Source delivers, and
preserves exactly what an Importer supplies (R-COL-2). A vendor tool MAY be
required to perform an Import. A vendor tool MUST NOT be required to read a
stored file. Where an Import Source delivers content only inside a proprietary
container, its Importer MUST unpack it to plain files within that Import, and
MUST refuse where it cannot.

**R-SRC-7.** In an Import, Turbo-Collection MUST NOT delete, modify, move, or
rename a file at an Import Source that Turbo-Collection did not itself create.
An Importer MAY create files and directories of its own at an Import Source, and
MAY remove what it created.

> **Example.** An Importer may create an export folder and remove it afterward.
> It may not rename a folder a camera wrote, because that moves every file in
> it.

**R-SRC-8.** Import MUST be idempotent. Importing one item twice MUST NOT
produce a duplicate in its Collection, and re-running an interrupted import MUST
converge rather than accumulate.

**R-SRC-9.** An item consisting of multiple files that are semantically one
thing (for example, a still image and its paired motion clip) MUST be imported
atomically: either all of its parts arrive, or none do. An importer MUST NOT
split such an item silently.

**R-SRC-10.** An item's Collection path MUST be a pure function of that item's
own bytes, whatever metadata its import source supplies with it, and that import
source, under whichever layout governs that item (R-SRC-15, R-SRC-20).

> **Example.** No `-2` suffix to disambiguate import order, and no directory
> named for a label a person adds after import.

**R-SRC-12.**  
**Import is additive.**  
Import MUST add files to a collection, and MUST NOT delete, move, rename, or
modify a file already in that collection. If an import source no longer holds an
item that collection already holds, Turbo-Collection MUST take no action and
MUST NOT report a discrepancy.

**R-SRC-13.** Turbo-Collection MUST NOT compute, record, or report which items
an import source no longer supplies. Turbo-Collection MUST hold no record of an
import source's contents between runs, and MUST establish that an item is
already imported by inspecting its collection rather than by comparing against
that import source's previous state.

**R-SRC-14.** Turbo-Collection MUST support a Dry-Run Mode for import that
reports every item a real import would add to its collection, and mutates
nothing.

> **Example.** Before freeing space at an import source, an import dry-run that
> reports zero pending items shows everything there has already reached its
> collection.

**R-SRC-15.** Every import source specification MUST state, as a rule on an
Import's items, which one Layout is that Import's primary layout. A layout
specification MUST state which items its layout is able to place, as a condition
on an item's own bytes and any metadata its import source supplies with it.
Turbo-Collection MUST determine an item's collection path under its Import's
primary layout, wherever that layout is able to place that item. R-SRC-20
governs an item that layout is not able to place.

> **Example.** Every iCloud Import has photo-path layout as its primary layout.
> A local-folder Import has photo-path layout where its directory holds a photo,
> and supplied-path layout where it holds none
> (`local-folder-import-source-spec.md` R-LOCALFOLDER-5). Either way, one Import
> has one primary layout.

**R-SRC-16.** On importing into an existing import-source directory,
Turbo-Collection MUST compare its running import source's version against
whatever `importSource.version` that directory's manifest records
(`meta-file-spec.md` R-MFILE-9). If they share one MAJOR line
(`version-requirement.md` R-PUB-1), Turbo-Collection MAY reuse that directory,
and where it writes to it MUST re-stamp `importSource.version` to its running
version. If that running version begins a new MAJOR line, Turbo-Collection MUST
NOT reuse that directory, and MUST place imported content under a different
import-source `specId`. What compatibility an import source guarantees within a
MAJOR line is stated by that import source's own specification;
Turbo-Collection's core does not adjudicate it.

**R-SRC-17.** An importer MUST NOT write into a TC Copy of a collection, and
MUST NOT create, modify, or delete any meta file. Turbo-Collection alone writes
collection content and meta files: an importer supplies an item's content, and
Turbo-Collection reads it, determines that item's collection path (R-SRC-10),
and writes it.

**R-SRC-18.** An importer MAY declare how many items it expects to supply in a
run. Where it does, Turbo-Collection MUST compare that count against how many
items it actually received from that importer, and MUST report any mismatch.

**R-SRC-20.**  
**Floor.**  
Where an Import's primary layout is not able to place an item of that Import,
Turbo-Collection MUST place that item under supplied-path layout
(`supplied-path-layout-spec.md`), and MUST report every item placed this way.
Turbo-Collection MUST NOT leave an item out of a collection because a layout is
not able to place it.

> **Example.** A PDF on a camera card is not a photograph, so photo-path layout
> cannot place it; it is stored under supplied-path layout and reported, never
> skipped.

**R-SRC-21.** An importer MUST supply, with every file of every item, whatever
path that file has at its import source, relative to a root that import source's
specification states. This path is metadata its import source supplies
(R-SRC-10).

> **Example.** A supplied path is what lets supplied-path layout place any item,
> so no item is ever without a place to go.

**R-SRC-22.** **Regular files only.** Where an Import would read a directory
entry that is neither a regular file nor a directory, such as a symbolic link, a
junction, a device, a socket, or a named pipe, Turbo-Collection MUST fail that
Import, MUST add no file to its Collection in that Import, and MUST report every
such entry. Turbo-Collection MUST NOT follow such an entry. Turbo-Collection
MUST pass over an entry that matches a pattern in an ignore file of whichever TC
Copy is being imported into (`meta-file-spec.md` R-MFILE-21), and MUST NOT fail
an Import on account of such an entry.

> **Example.** A folder holds a symbolic link named `latest` that points at
> another folder. An Import of that folder fails, names `latest`, and adds
> nothing. Once a pattern matching `latest` is in a receiving TC Copy's ignore
> file, that TC Copy's next Import passes over it and takes in everything else.

**R-SRC-23.** **Import never overwrites.** Where an Import would store a file at
a path at which a TC Copy being imported into already holds a Content File in
its Collection (R-TGT-13) with differing content, Turbo-Collection MUST NOT
overwrite that Content File (R-SRC-12), MUST leave that arriving file out of
that Collection, and MUST report every such file. Turbo-Collection MUST still
import every other file of that Import. A Run in which an Import reports such a
file MUST exit with a non-zero status.

> **Example.** A folder is imported, a document in it is then edited, and that
> folder is imported again. Its Collection keeps that document's first version
> at that path, its edited file is reported and stays out, and every new file in
> that folder is still taken in. No second name is invented for that edited file
> (R-SRC-10).

**R-SRC-24.** **One directory, one provenance.** Where an Import would add a
file to a directory whose manifest names another Import Source or another Layout
(`meta-file-spec.md` R-MFILE-9), Turbo-Collection MUST NOT add that file to that
directory, MUST NOT change what that manifest names, MUST leave that file out of
its Collection, and MUST report every such file. Turbo-Collection MUST still
import every other file of that Import. A Run in which an Import reports such a
file MUST exit with a non-zero status.

**R-SRC-26.** **A file that cannot be read or written.** Where Turbo-Collection
cannot read a file an Importer supplies, or cannot write it into its TC Copy,
Turbo-Collection MUST leave that file out of its Collection, MUST report it, and
MUST record it in an error file (`meta-file-spec.md` R-MFILE-16) in whichever
directory that file was to go to, making that directory where needed. A file
whose size or modification time changes while Turbo-Collection reads it counts
as one it cannot read. Turbo-Collection MUST still import every other file of
that Import, and a Run in which an Import leaves such a file out MUST exit with
a non-zero status. Where that TC Copy is unreachable, read-only or full,
Turbo-Collection MUST end that Run with an error.
