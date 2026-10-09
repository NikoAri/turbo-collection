# An error file keeps import errors and mirror errors in separate lists

**Status:** Accepted
**Date:** 2026-10-04

An error file holds two arrays, `importErrors` and `mirrorErrors`, and an error is of one kind or
the other by which array it sits in (`R-MFILE-16`). An error object of either kind states one thing,
a `message` a person can read. What else each kind records is left until real errors show what is
needed.

**The two kinds mean different things for the safety of data, so structure carries the difference.**
An import error is content that never entered the collection, so its import source may hold the only
copy of it. A mirror error is content one copy already holds that failed to reach another, so the
content itself is safe. A `message` is best effort and may be incomplete, so a fact this important
cannot live only in it.

## Rejected

- **One `errors` array, with import and mirror told apart by whether an error names an import
  source.** The earlier form. It made the one fact that matters for safety an inference from an
  optional field.
- **One array, with each error tagged by a `kind` field.** It carries the difference in structure
  too, and adds a field to do what two arrays do without one.
- **Fields for the file concerned, the import source, and opaque detail.** These were specified
  before any error had been produced. A field is added when a real error shows what it has to hold.

## Touches

`meta-file-spec.md`: `R-MFILE-16` rewritten to `importErrors` and `mirrorErrors`, each error object
requiring `message` alone, and `R-MFILE-13` reworded so that a mirror error is recorded in an error
file on the copy mirrored from. The error example in that document and the sample error receipts
follow.
