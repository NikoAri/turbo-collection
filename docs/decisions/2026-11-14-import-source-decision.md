# A photo is filed by its month alone, and its manifest records where it came from

**Status:** Accepted **Date:** 2026-11-14

**Replaces `2026-08-22-import-source-decision.md`**, which made an import source
a path segment: `YYYY/YYYY-MM/<import-source>/<original filename>`. That
conclusion reversed. Every file in this version arrives through Import Source
`local-folder`, an iPhone's photos among them, so that segment named one
mechanism shared by every photo and told a reader nothing. Its reason, that an
import source is the one fact about an arrival a file cannot state about itself,
still holds, and a manifest now keeps that fact without a directory.

A photo's place in a collection is `YYYY/YYYY-MM/<original filename>`
(`R-PHOTO-3`), whichever import source supplied it. Each directory's manifest
records which import source placed that directory (`importSource.specId`,
`R-MFILE-9`), and each entry records that file's supplied path (`suppliedPath`,
`R-MFILE-10`), such as `moon-photos/phone/IMG_0101.JPG`. Where a photo was read
from stays known whichever directory holds it, under either layout.

**Two different photos with one name in one month.** A second camera's
`IMG_0101.JPG` is common. The photo arriving later goes in a subdirectory of
that month, named by the fewest of its supplied path's last directories that
differ from those of the photo already there (`R-PHOTO-11`):
`trip/phone/IMG_0101.JPG` beside `trip/camera/IMG_0101.JPG` is stored in
`2019/2019-07/phone/`. Where no directory differs, that photo is left out and
reported (`R-SRC-23`). This is the one place a path depends on what a TC Copy
already holds (`R-SRC-10`). An import takes its items in one order on every
computer (`R-SRC-28`), so two TC Copies importing one folder give each photo one
path. TC Copies that import two such photos separately, in opposite order, meet
a reported conflict at their next backup, and nothing is lost
([the peer-model decision](2026-09-05-peer-model-decision.md)).

## Why _import source_

An **import source** is one way of getting original bytes in, such as iCloud or
a camera card, and one importer reaches exactly one. _Acquisition route_, its
earlier name, gave a second Latin root to the act the project already calls
**import** (`language-requirement.md` R-LANG-6). A bare _source_ reads as source
code, and a qualifier, not a second noun, is what cures a word that is too
general. A receipt is read without a specification beside it, so its field is
`importSource`, carrying that qualifier too.

## Rejected

- **The import source as a directory** (`2019/2019-07/local-folder/`), this
  record's previous answer. It names a mechanism every photo shares, and a
  manifest keeps that fact.
- **An imported folder's name, or any batch name, as a directory**
  (`2019/2019-07/moon-photos/`, `Card25`). A folder's name is a property of one
  transfer, not of a photo. Importing overlapping folders would store a photo
  once per folder. Measured on 2026-11-14: a second import of eight photos from
  a copy of their folder under another name added none.
- **An import source's directory only once a second import source arrives, or
  only where names clash.** A path would depend on what a TC Copy holds. Nothing
  in a TC Copy moves, so photos already filed stay where they are, and moving
  one waits for deletions and reorganizations, which the peer-model decision
  defers.
- **A photo's whole supplied directory path for a name already held**
  (`2019/2019-07/trip/phone/`). Longer than a clash needs.
- **Leaving out a second photo with a name already held**, as `R-SRC-23` did
  before `R-PHOTO-11`. A second camera's photos would never be kept.
- **A supplied path in each import's arrival receipt** (`importSourceDetails`).
  A receipt is one file per arrival and per TC Copy, so a photo's origin would
  be one file among several, where a manifest holds it beside that photo's
  checksum.
- **Capturing device as a directory** (`canon-eos-r6`, from Exif Make and
  Model). Derivable from a photo itself, and it needs an `unknown-device`
  directory for screenshots and scans and a registry to tell two identical
  camera bodies apart.
- **`specs/sources/`, `specs/routes/` and `specs/source-routes/`** as names for
  importer specifications. Each is too general or pairs two nouns that each name
  this category.
- **A vendor surface level above import sources.** The project has no use for a
  vendor as an entity. Two ways into one vendor that deliver different bytes are
  two import sources.

## Consequences accepted

A second import source filing photos into a month whose manifest names another
is refused for each such file (`R-SRC-24`), since a manifest names one import
source. Recording an import source per file waits for a later version.

## Touches

`photo-path-layout-spec.md`: `R-PHOTO-3` amended, `R-PHOTO-11` added, and
_Supplied path_ defined. `meta-file-spec.md`: `R-MFILE-10` gains `suppliedPath`,
and _Supplied path_ defined. `import-spec.md`: `R-SRC-10` amended, `R-SRC-28`
added. `turbo-collection-spec.md` Section 3: _Supplied Path_ defined. Code:
`scripts/photo-path-layout.ts`, `scripts/import.ts` and `scripts/meta-files.ts`,
with their tests, and `samples/`.
