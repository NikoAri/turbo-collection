# Samples

One small collection, held as two peer copies: [`sample-main`](sample-main/) and
[`sample-off-site`](sample-off-site/). Every content file is a short placeholder, so each checksum
in a manifest is real and any SHA-256 tool verifies it.

The collection holds content from three import sources, side by side.

| Where                       | Layout                 | Import source  | What it shows                                                                               |
| --------------------------- | ---------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| `2025/`, `2026/`            | `photo-path-layout`    | `icloud`       | Photographs filed by the month they were taken.                                             |
| `local-folder/old-laptop/`  | `as-found-path-layout` | `local-folder` | A folder brought in from outside the copy, kept in its own shape under its import source.   |
| `Manuals/`, `groceries.txt` | `as-found-path-layout` | `in-place`     | Files a person put into the copy with a file manager, taken in exactly where they sit.      |

## What happened, run by run

| Run                     | Date       | Operation                                  | What it left behind                                          |
| ----------------------- | ---------- | ------------------------------------------ | ------------------------------------------------------------ |
| `20251220T114705Z-1a2b` | 2025-12-20 | import from iCloud into `main`             | `2025/2025-12/icloud/`                                       |
| `20260814T180422Z-3f9a` | 2026-08-14 | import from iCloud into `main`             | `2026/2026-07/icloud/`, `2026/2026-08/icloud/`, and an error |
| `20260814T181033Z-7c4e` | 2026-08-14 | backup, which created `off-site`           | everything so far reaches `off-site`                         |
| `20260905T101542Z-5d1c` | 2026-09-05 | import of the folder `old-laptop` into `main` | `local-folder/old-laptop/`                                |
| `20260920T164009Z-8e2f` | 2026-09-20 | in-place import on `main`                  | `Manuals/appliances/` and `groceries.txt` are recorded       |
| `20260921T090251Z-2b7d` | 2026-09-21 | backup                                     | both new trees reach `off-site`                              |

Each run that brought content to a copy left one arrival file in every directory it touched, named
for the run and for the copy the content reached. An import arrival names a layout and an import
source; a backup arrival names neither, because it carried over content another copy already held.

## Things worth noticing

- **A manifest names the specification that governs its directory.** In
  `local-folder/old-laptop/Woodwork/birdhouse/` the manifest says `"specId": "local-folder"`. The
  folder's own name, `old-laptop`, is simply the next directory down.
- **A directory holding only other directories has no manifest.** `local-folder/`,
  `local-folder/old-laptop/`, `local-folder/old-laptop/Woodwork/` and `Manuals/` carry no
  `.turbo-collection/` of their own.
- **An in-place import wrote no content file.** The manuals were already in `Manuals/appliances/`
  when the run started. The run added a manifest and an arrival beside them, and nothing moved.
- **A file at the copy root is content like any other.** `groceries.txt` is listed by a manifest in
  the root's `.turbo-collection/`, which also holds the configuration file and the location
  receipts. `.tcignore` is a meta file, so no manifest lists it. A `README.md` at a copy's root would
  be content too: Turbo-Collection writes none of its own.
- **Some manifests carry no `date`.** A folder of files associates no time with a file except a
  filesystem timestamp, and a manifest never records one of those (`R-MFILE-11`). The iCloud
  manifests carry the date iCloud supplied.
