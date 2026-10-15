# A run's log is one JSON document in the operating system's directory for temporary files

**Status:** Accepted
**Date:** 2026-10-14

A run writes its log into the operating system's directory for temporary files, on the computer
performing it (`R-LOG-5`), as one JSON document. Inside that directory, an init run whose ID is
`20261014T153012Z-3f9a` writes `turbo-collection/logs/20261014T153012Z-3f9a-init.log.json`.

**Every run writes a log, including runs that promise to write nothing.** `R-LOG-1` requires a log
of every run. A dry run mutates nothing (`R-SRC-14`, `R-MIRROR-7`), status is read-only
(`R-CLI-10`), and an init run by mistake fails and writes nothing (`R-CLI-11`). A log beside a copy
would write a file on a drive in each of those runs. A log in the directory for temporary files
breaks none of those promises, and a run can open it before it knows which directory it acts on.

**A borrowed computer keeps the log, and that costs little.** A log is observability only
(`R-LOG-2`). What bears on whether material at an import source can be deleted is recorded in
receipts, inside each copy (`R-LOG-5`), so what a later run or a person needs travels with the
drives.

**The name is the run's ID, then its operation.** Every receipt a run writes carries the same ID
(`R-MFILE-13`), so a receipt leads to the log of the run that wrote it, and the names sort in the
order runs started. `.log.json` says what the file is and how to read it, as `.arrival.json` does
for a receipt, and a `logs` directory says what it holds.

**One JSON document, because a program reads the log too.** The tests check what a run logged, and
Node reads JSON with nothing beyond its own standard library. What `R-LOG-1` asks a log to record
is a summary of the run, which one document holds.

## Rejected

- **A log on a drive that holds a copy, beside the copy.** It brought the log of a run on a borrowed
  computer home with the drives. It lost because it writes a file on a drive in every run that
  promises to write nothing there, and because a copy at a drive's root leaves no place on that
  drive outside the copy.
- **A log inside a copy.** A manifest would change at every run for a file nothing may depend on,
  and a backup would carry every log to every drive. `R-LOG-5` still forbids it.
- **Lines of text.** A person reads them as they are, and a program has to pick them apart by
  pattern, which breaks when the wording changes.
- **JSON Lines, one JSON object per line.** OpenTelemetry's file exporter and Pino write it, and a
  run that is killed keeps every line before it. A file of such lines is not one JSON value, so no
  JSON reader opens it whole, and a `.json` name would mislead.
- **YAML.** Node reads it only with a third-party package, and a value without quotes can change
  type: a YAML 1.1 reader takes `no` as false.
- **npm's log name: the start time, with `_` in place of `:` and `.`.** It sorts the same way, and
  matches nothing else a run writes.

## Touches

`turbo-collection-core-spec.md`: `R-LOG-5` requires the operating system's directory for temporary
files, where it had allowed a log elsewhere on a drive that holds a copy, or on the computer.
[`design-record.md`](../design-record.md) Section 2, "The computer is equipment, not
infrastructure", no longer says logs are written to the drives, and its architecture diagram names
the log's directory. `samples/logs/` holds the log of the init run that made `sample-main`.
