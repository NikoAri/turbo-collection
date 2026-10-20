# A run logs one JSON object per line to the directory for temporary files, and text to the terminal

**Status:** Accepted
**Date:** 2026-10-19
**Replaces:** the 2026-10-14 record of the same topic, which made a log one JSON document, named by
the run's ID and its operation in a `logs` directory, and rejected JSON Lines. It had read a request
for `.json` as one document per run, where one object per line was meant.

A run makes a directory of its own, `turbo-collection/runs/<runId>/` in the operating system's
directory for temporary files, on the computer performing it (`R-LOG-5`, `R-LOG-6`), and writes its
log there as `tc-<runId>.log.json`: one JSON object per line, each line an entry (`R-LOG-7`). With
`--log-dir`, the log goes into a directory a person names instead, and the run's own directory stays
where it was (`R-LOG-10`). Each entry is also written to the terminal as a line of text: an error to
standard error, anything else to standard output, and a verbose entry only with `--verbose`
(`R-LOG-9`). A run with ID `20261018T142205Z-3f9a` writes
`turbo-collection/runs/20261018T142205Z-3f9a/tc-20261018T142205Z-3f9a.log.json` in the directory for
temporary files.

**Every run writes a log, including runs that promise to write nothing.** `R-LOG-1` requires a log of
every run, and a run that only shows help or reports the version is a run too. A dry run mutates
nothing (`R-SRC-14`, `R-MIRROR-7`), status is read-only (`R-CLI-10`), and an init run by mistake fails
and writes nothing (`R-INIT-3`). A log in the directory for temporary files breaks none of those
promises, and a run can open it before it knows which directory it acts on (`R-CFG-3`).

**A borrowed computer keeps the log, and that costs little.** A log is observability only
(`R-LOG-2`). What bears on whether material at an import source can be deleted is recorded in
receipts, inside each copy (`R-LOG-5`), so what a later run or a person needs travels with the
drives.

**One object per line, because entries arrive one at a time.** A run adds each entry at the end and
changes none (`R-LOG-7`), so nothing is rewritten, and a run killed outright keeps every line it
wrote. Each line is JSON, which Node reads with its standard library alone; a program reads the file
a line at a time, since several lines are not one JSON value. Every entry holds `date` and `event`,
with `outcome` where it records a failure and `verbose` where it holds detail (`R-LOG-8`), and a run
begins with `run-start` and ends with `run-end` (`R-LOG-11`).

**A directory per run, and the run's ID in the log's name.** Making the directory claims the run's ID
on that computer (`R-PARALLEL-1`), and anything else a run keeps for itself goes there. The log's
name repeats the ID, so a log separated from its directory still leads to the receipts its run wrote
(`R-MFILE-13`). `tc-` says whose file it is, in a directory a person names, and `.log.json` says what
the file is, as `.arrival.json` does for a receipt.

**The terminal shows a person what went wrong, and detail on request.** Errors go to standard error
and are never verbose, so every one reaches the screen (`R-LOG-8`, `R-LOG-9`). Detail, such as
`run-start`, the configuration and the count per ignore pattern, is verbose (`R-LOG-11`, `R-LOG-13`,
`R-LOG-14`): the file always holds it, and `--verbose` shows it too.

**Nothing removes an old log.** The directory for temporary files is the operating system's to
clean, and a directory named with `--log-dir` is its owner's. A run that removes nothing cannot
remove a directory another run is still writing into. No requirement asks for removal, so code may
not do it (`R-META-3`). That cleaning may be rare: a Windows computer checked on 2026-10-19 held
items more than two years old in its directory for temporary files.

## Rejected

- **A log on a drive that holds a copy, beside the copy.** It brought the log of a run on a borrowed
  computer home with the drives. It lost because it writes a file on a drive in every run that
  promises to write nothing there, and because a copy at a drive's root leaves no place on that
  drive outside the copy.
- **A log inside a copy.** A manifest would change at every run for a file nothing may depend on,
  and a backup would carry every log to every drive. `R-LOG-5` still forbids it.
- **One JSON document per run.** A program reads it whole, but a run has to rewrite the file to add
  an entry, and a run killed while rewriting it leaves a broken file or none.
- **Lines of plain text in the file.** A program has to pick them apart by pattern, which breaks when
  the wording changes. Text goes to the terminal instead.
- **YAML.** Node reads it only with a third-party package, and a value without quotes can change
  type: a YAML 1.1 reader takes `no` as false.
- **One fixed name for every run's log.** A run would either replace the last run's log or rewrite
  the whole file to add itself.
- **The operation in the name.** A run may perform more than one operation, and one that fails on
  its command line performs none. The command line is in `run-start` instead.
- **`log.json` inside the run's directory**, named by kind since the directory carries the ID. A log
  separated from its directory would lose the ID.
- **npm's log name: the start time, with `_` in place of `:` and `.`.** It sorts the same way, and
  matches nothing else a run writes.
- **Keeping a run's last logs and removing the rest, as npm keeps ten.** Removal could reach a
  directory another run is still writing into, and the operating system cleans its directory for
  temporary files itself.

## Touches

`logging-spec.md`: `R-LOG-5` and `R-LOG-6` give way to `--log-dir`, `R-LOG-6` names the log
`tc-<runId>.log.json`, `R-LOG-7` to `R-LOG-14` are added, and `R-LOG-1` no longer says plain text.
`turbo-collection-core-spec.md`: the Logger contract's postcondition. `turbo-collection-spec.md`
Section 12: the Logger row. [`design-record.md`](../design-record.md): Section 2, "The computer is
equipment, not infrastructure", does not say logs are written to the drives, its architecture
diagram names the log's directory, and its table of pieces names the format.
`samples/runs/20251220T114502Z-9e0d/` holds the log of the init run that made `sample-main`.
