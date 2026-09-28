# Turbo-Collection copy: `off-site`

A plain-files, self-verifying archive of photographs and videos. Nothing here needs
Turbo-Collection to read: any file manager browses it, any SHA-256 tool verifies it.

## How it is organized

Content files live under `<YYYY>/<YYYY>-<MM>/<import source>/`: first the year, then the
year-month, then the way a file entered the archive. For example `2026/2026-07/icloud/`
holds photos taken in July 2026 that arrived from iCloud. Filenames are labels; identity
is the SHA-256 checksum.

Each content directory carries a `.turbo-collection/` subdirectory holding `manifest.json`
(every file with its size, SHA-256, and date) and a set of immutable per-event receipt
files, named `receipt-<runId>-<collectionName>.arrival.json` and
`receipt-<runId>-<collectionName>.error.json`, recording each arrival of the content at a copy
and any error.

The copy root has its own `.turbo-collection/` subdirectory holding
`turbo-collection-config.json` (this copy's name and the meta-file format version) and any
location receipts. Everything Turbo-Collection writes for itself lives in a
`.turbo-collection/` directory; the rest is content you can browse.

## How to verify it

From any content directory, `sha256sum *` and compare against `manifest.json`. A copy is
intact when every content file matches its recorded checksum.
