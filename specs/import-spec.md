> **Version:** that of [`turbo-collection-spec.md`](turbo-collection-spec.md),
> of which this file is a part.

## 5. Import (`R-SRC-*`)

The Core must be indifferent to whether a photo arrived by cable, from iCloud,
through a OneDrive sync folder, or from something not yet invented.

This contract is specified completely enough (R-META-1) that **anyone can write
an Importer from this document alone, without modifying Turbo-Collection's
core.** That is the extensibility that matters. How importers are loaded is a
binding (`turbo-collection-spec.md` Section 12), not a requirement.

**R-SRC-25.**  
**Import Operation**  
In an **import**, Turbo-Collection MUST import into the Copy given to that
import. Where an import is given no Copy, Turbo-Collection MUST treat the
current working directory as the Copy given to that import.

> **Example.** An import from `D:\old-laptop`, given no Copy and run in
> `E:\photos`, imports into the Copy at `E:\photos`. The same import run in a
> directory that is not a Copy is refused, and imports nothing (R-CLI-14).

**R-SRC-1.** Files MUST enter the collection only by Import. The Core MUST
contain no logic specific to any individual import source, device, vendor, or
service.

**R-SRC-2.** Adding support for a new Import Source MUST require writing only a
new Importer. It MUST NOT require changing the Core, this specification's
requirements, or any existing importer.

**R-SRC-3.** Which import sources a run draws from, and their settings, MUST be
supplied to Turbo-Collection as data rather than hardcoded in code. An import
source MUST be able to be added or removed without a code change.

**R-SRC-4.** Multiple import sources MUST be able to coexist and MUST be
importable independently. The failure of one import source MUST NOT prevent
import from another, and MUST still be reported.

**R-SRC-5.** An Importer MUST supply each item as plain files. An Importer
SHOULD supply every file unaltered, without transcoding, recompressing, or
stripping metadata, and where an Import Source offers a file in more than one
version SHOULD take the unaltered one. This is a best effort: Turbo-Collection
guarantees nothing about what an Import Source delivers, and preserves exactly
what an Importer supplies (R-COL-2). A vendor tool MAY be required to perform an
Import. A vendor tool MUST NOT be required to read a stored file. Where an
Import Source delivers content only inside a proprietary container, the Importer
MUST unpack it to plain files within the Import, and MUST refuse where it
cannot.

**R-SRC-7.** In an Import, Turbo-Collection MUST NOT delete, modify, move, or
rename a file at an Import Source that Turbo-Collection did not itself create.
An Importer MAY create files and directories of its own at an Import Source, and
MAY remove what it created.

> **Example.** An Importer may create an export folder and remove it afterward.
> It may not rename a folder a camera wrote, because that moves every file in
> it.

**R-SRC-8.** Import MUST be idempotent. Importing the same item twice MUST NOT
produce a duplicate in the Collection, and re-running an interrupted import MUST
converge rather than accumulate.

**R-SRC-9.** An item consisting of multiple files that are semantically one
thing (for example, a still image and its paired motion clip) MUST be imported
atomically: either all of its parts arrive, or none do. An importer MUST NOT
split such an item silently.

**R-SRC-10.** The Collection path of an item MUST be a pure function of the
item's own bytes, the metadata the import source supplies with it, and that
import source, under the layout that governs that item (R-SRC-15, R-SRC-20).

> **Example.** No `-2` suffix to disambiguate import order, and no directory
> named for a label a person adds after import.

**R-SRC-12.**  
**Import is additive.**  
Import MUST add files to the collection, and MUST NOT delete, move, rename, or
modify a file already in the collection. If an import source no longer holds an
item the collection already holds, Turbo-Collection MUST take no action and MUST
NOT report a discrepancy.

**R-SRC-13.** Turbo-Collection MUST NOT compute, record, or report which items
an import source no longer supplies. Turbo-Collection MUST hold no record of an
import source's contents between runs, and MUST establish that an item is
already imported by inspecting the collection rather than by comparing against a
previous state of the import source.

**R-SRC-14.** Turbo-Collection MUST support a Dry-Run Mode for import that
reports every item a real import would add to the collection, and mutates
nothing.

> **Example.** Before freeing space at an import source, an import dry-run that
> reports zero pending items shows everything there has already reached the
> collection.

**R-SRC-15.** Every import source specification MUST name exactly one Layout as
the primary layout of that import source. A layout specification MUST state
which items its layout is able to place, as a condition on an item's own bytes
and the metadata its import source supplies with it. Turbo-Collection MUST
determine an item's collection path under the primary layout of that item's
import source, wherever that layout is able to place the item. R-SRC-20 governs
an item that layout is not able to place.

> **Example.** Identical photo bytes are filed by date when imported from an
> import source whose primary layout is the photo layout, and keep their place
> in their folder when that folder is imported as a local folder, where the
> layout is the supplied-path layout. Bytes decide where an item goes within a
> layout, never which layout.

**R-SRC-16.** On importing into an existing import-source directory,
Turbo-Collection MUST compare the running import source's version against the
`importSource.version` that directory's manifest records (`meta-file-spec.md`
R-MFILE-9). If they share the same MAJOR line (`version-requirement.md`
R-PUB-1), Turbo-Collection MAY reuse the directory, and where it writes to it
MUST re-stamp `importSource.version` to the running version. If the running
version begins a new MAJOR line, Turbo-Collection MUST NOT reuse the directory,
and MUST place the imported content under a different import-source `specId`.
What compatibility an import source guarantees within a MAJOR line is stated by
that import source's own specification; the core does not adjudicate it.

**R-SRC-17.** An importer MUST NOT write into a copy of the collection, and MUST
NOT create, modify, or delete any meta file. Turbo-Collection alone writes
collection content and meta files: an importer supplies an item's content, and
Turbo-Collection reads it, determines the item's collection path (R-SRC-10), and
performs the write.

**R-SRC-18.** An importer MAY declare the number of items it expects to supply
in a run. Where it does, Turbo-Collection MUST compare that count against the
number of items it actually received from the importer, and MUST report any
mismatch.

**R-SRC-20.**  
**The floor.**  
Where the primary layout of an item's import source is not able to place that
item, Turbo-Collection MUST place the item under the supplied-path layout
(`supplied-path-layout-spec.md`), and MUST report every item placed this way.
Turbo-Collection MUST NOT leave an item out of the collection because a layout
is not able to place it.

> **Example.** A PDF on a camera card is not a photograph, so the photo layout
> cannot place it; it is stored under the supplied-path layout and reported,
> never skipped.

**R-SRC-21.** An importer MUST supply, with every file of every item, the path
that file has at its import source, relative to a root that import source's
specification states. This path is metadata the import source supplies
(R-SRC-10).

> **Example.** A supplied path is what lets the supplied-path layout place any
> item, so no item is ever without a place to go.

**R-SRC-22.** **Regular files only.** Where an Import would read a directory
entry that is neither a regular file nor a directory, such as a symbolic link, a
junction, a device, a socket, or a named pipe, Turbo-Collection MUST fail that
Import, MUST add no file to the Collection in that Import, and MUST report every
such entry. Turbo-Collection MUST NOT follow such an entry. Turbo-Collection
MUST pass over an entry that matches a pattern in the ignore file of the Copy
being imported into (`meta-file-spec.md` R-MFILE-21), and MUST NOT fail an
Import on account of such an entry.

> **Example.** A folder holds a symbolic link named `latest` that points at
> another folder. An Import of that folder fails, names `latest`, and adds
> nothing. Once a pattern matching `latest` is in the Copy's ignore file, the
> next Import passes over it and takes in everything else.

**R-SRC-23.** **Import never overwrites.** Where an Import would store a file at
a path at which the Copy being imported into already holds a Content File in the
Collection (R-TGT-13) with differing content, Turbo-Collection MUST NOT
overwrite that Content File (R-SRC-12), MUST leave the arriving file out of the
Collection, and MUST report every such file. Turbo-Collection MUST still import
every other file of that Import. A Run in which an Import reports such a file
MUST exit with a non-zero status.

> **Example.** A folder is imported, a document in it is then edited, and the
> folder is imported again. The Collection keeps the first version at that path,
> the edited file is reported and stays out, and every new file in the folder is
> still taken in. No second name is invented for the edited file (R-SRC-10).

**R-SRC-24.** **One directory, one provenance.** Where an Import would add a
file to a directory whose manifest names another Import Source or another Layout
(`meta-file-spec.md` R-MFILE-9), Turbo-Collection MUST NOT add that file to that
directory, MUST NOT change what that manifest names, MUST leave that file out of
the Collection, and MUST report every such file. Turbo-Collection MUST still
import every other file of that Import. A Run in which an Import reports such a
file MUST exit with a non-zero status.

**R-SRC-26.** **A file that cannot be read or written.** Where Turbo-Collection
cannot read a file an Importer supplies, or cannot write it into the Copy,
Turbo-Collection MUST leave that file out of the Collection, MUST report it, and
MUST record it in an error file (`meta-file-spec.md` R-MFILE-16) in the
directory that file was to go to, making that directory where needed. A file
whose size or modification time changes while Turbo-Collection reads it counts
as one it cannot read. Turbo-Collection MUST still import every other file of
that Import, and a Run in which an Import leaves such a file out MUST exit with
a non-zero status. Where the Copy is unreachable, read-only or full,
Turbo-Collection MUST end that Run with an error.
