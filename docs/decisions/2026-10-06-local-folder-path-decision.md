# A local folder is stored under its own name, and a clash is reported, not prevented

**Status:** Accepted
**Date:** 2026-10-06

A file imported from a local folder is stored at `local-folder/<folder name>/<path inside the
folder>`: the imported folder's own name leads every supplied path. A folder named `old-laptop` is
stored as `local-folder/old-laptop/`, with its own shape beneath.

**The simplest rule that works goes first.** One segment, taken from the folder itself, with no
setting and nothing to resolve. It is enough for a first implementation, whose job is to prove the
basics of import.

Two costs are accepted.

- **Two folders with one name share a directory.** A file with one path and one content in both is
  one file. A file whose path already holds different content stays out, the conflict is reported,
  and the run exits non-zero (`R-SRC-23`). Nothing prevents the clash; it is made visible.
- **A folder with no name is refused.** A drive root has no name to lead a path, so its folders are
  imported one at a time, and a loose file in a root has no way in.

## Rejected

- **The computer's name and the folder's full path as the leading segments.** Left for a later
  version, not turned down. It gives a drive root a path and keeps same-named folders apart with no
  setting. Its own costs: one removable drive read from a second computer is stored twice, and an
  operating system may give two removable drives one drive letter.
- **A name given by an operator on the command line.** It works, at the price of a setting.

## Touches

`local-folder-import-source-spec.md`: `R-LOCALFOLDER-6`, and the refusal of a folder with no name in
`R-LOCALFOLDER-2`.
