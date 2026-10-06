# Turbo-Collection copy: `off-site`

A plain-files, self-verifying archive. Nothing here needs Turbo-Collection to read: any file
manager browses it, any SHA-256 tool verifies it.

## How it is organized

Every directory that holds content files carries a `.turbo-collection/` subdirectory. Its
`manifest.json` lists every file in that directory with its size and SHA-256 checksum, and names
two things: the layout that decided where those files sit, and the import source they came from.
Filenames are labels; identity is the SHA-256 checksum.

Where a file sits follows from the layout its directory's manifest names:

- `photo-path-layout`: `<YYYY>/<YYYY>-<MM>/<import source>/`, by the month a photograph or a video
  was taken. For example `2026/2026-07/icloud/` holds photos taken in July 2026 that arrived from
  iCloud.
- `as-found-path-layout`: the path a file had where it was found. A file brought in from outside
  sits under a directory named for its import source, such as `local-folder/`. A file that was
  already inside this copy when it was taken in, import source `in-place`, stays exactly where it
  was.

Beside each manifest is a set of immutable per-event receipt files, named
`receipt-<runId>-<collectionName>.arrival.json` and `receipt-<runId>-<collectionName>.error.json`,
recording each arrival of that directory's content at a copy, and any error.

The copy root has its own `.turbo-collection/` subdirectory holding `turbo-collection-config.json`
(this copy's name and the meta-file format version) and any location receipts. Apart from this file
and `.tcignore`, everything Turbo-Collection writes for itself lives in a `.turbo-collection/`
directory; the rest is content you can browse.

## How to verify it

From any content directory, `sha256sum *` and compare against `manifest.json`. A copy is intact
when every content file matches its recorded checksum.
