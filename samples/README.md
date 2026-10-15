# Samples

One small collection, held as two peer copies: [`sample-main`](sample-main/) and
[`sample-off-site`](sample-off-site/). Every content file is a short placeholder, so each checksum
in a manifest is real and any SHA-256 tool verifies it.

The collection holds content from more than one import source, side by side.

| Where                      | Layout                 | Import source  | What it shows                                                                             |
| -------------------------- | ---------------------- | -------------- | ----------------------------------------------------------------------------------------- |
| `2025/`, `2026/`           | `photo-path-layout`    | `icloud`       | Photographs filed by the month they were taken.                                           |
| `local-folder/old-laptop/` | `as-found-path-layout` | `local-folder` | A folder brought in from outside the copy, kept in its own shape under its import source. |

## What happened, run by run

| Run                     | Date       | Operation                                     | What it left behind                                          |
| ----------------------- | ---------- | --------------------------------------------- | ------------------------------------------------------------ |
| `20251220T114502Z-9e0d` | 2025-12-20 | init, which made `main`                       | `.tcignore` and the configuration file; a log in `logs/`     |
| `20251220T114705Z-1a2b` | 2025-12-20 | import from iCloud into `main`                | `2025/2025-12/icloud/`                                       |
| `20260814T180422Z-3f9a` | 2026-08-14 | import from iCloud into `main`                | `2026/2026-07/icloud/`, `2026/2026-08/icloud/`, and an error |
| `20260814T181033Z-7c4e` | 2026-08-14 | backup, which created `off-site`              | everything so far reaches `off-site`                         |
| `20260905T101542Z-5d1c` | 2026-09-05 | import of the folder `old-laptop` into `main` | `local-folder/old-laptop/`                                   |
| `20260921T090251Z-2b7d` | 2026-09-21 | backup                                        | the new tree reaches `off-site`                              |

Each run that brought content to a copy left one arrival file in every directory it touched, named
for the run and for the copy the content reached. An import arrival names a layout and an import
source; a backup arrival names neither, because it carried over content another copy already held.

## Things worth noticing

- **A manifest names the specification that governs its directory.** In
  `local-folder/old-laptop/Woodwork/birdhouse/` the manifest says `"specId": "local-folder"`. The
  folder's own name, `old-laptop`, is simply the next directory down.
- **A directory holding only other directories has no manifest.** `local-folder/`,
  `local-folder/old-laptop/` and `local-folder/old-laptop/Woodwork/` carry no `.turbo-collection/`
  of their own.
- **The copy root holds no content file.** Its `.turbo-collection/` holds the configuration file and
  the location receipts, and no manifest. `.tcignore` is a meta file, so no manifest lists it. A
  `README.md` at a copy's root would be content: Turbo-Collection writes none of its own.
- **A run's log is on the computer that performed it, never in a copy** (`R-LOG-5`). `logs/` stands
  for that computer's temporary directory, and holds the log of the init run, named by its run ID as
  receipts are. The logs of later runs are not shown.
- **Some manifests carry no `date`.** A folder of files associates no time with a file except a
  filesystem timestamp, and a manifest never records one of those (`R-MFILE-11`). The iCloud
  manifests carry the date iCloud supplied.
