> **Version:** that of [`turbo-collection-spec.md`](turbo-collection-spec.md),
> of which this file is a part.

## Parallel safety

### 8.6 Parallel safety (`R-PARALLEL-*`)

**R-PARALLEL-1.** Turbo-Collection MUST create a Run's log (`logging-spec.md`
R-LOG-6) only where nothing exists at that log's path. Where something exists at
that path, Turbo-Collection MUST give that Run another ID, and create that Run's
log under its new ID.

> **Example.** Two Runs started in one second draw one ID,
> `20261015T215020Z-3b52`. Whichever Run creates
> `turbo-collection/logs/tc-20261015T215020Z-3b52.log.json` first keeps that ID.
> A Run that comes second takes a new ID and creates its log under that one.

**R-PARALLEL-2.** Where Turbo-Collection makes a directory a Copy
(`init-spec.md` R-INIT-1, `backup-spec.md` R-BACKUP-1), Turbo-Collection MUST
write that Copy's configuration file (`meta-file-spec.md` R-MFILE-17) before any
other file it writes into that directory. Turbo-Collection MUST write that
configuration file only where nothing exists at its path.

**R-PARALLEL-3.** Where a Run is making a directory a Copy and something already
exists at that Copy's configuration file's path, Turbo-Collection MUST end that
Run with an error, and MUST NOT write any other file into that directory.

> **Example.** An init and a backup are each given an empty directory,
> `archive/photos`, at one moment, and each finds it empty. That init writes its
> configuration file first, then its ignore file. That backup finds that init's
> configuration file in place, ends with an error, and has written no file into
> `archive/photos`.

**R-PARALLEL-4.** Every Run other than an init MUST hold its Collection's lock
on whichever computer that Run is performed on, for as long as that Run reads or
writes a Copy of that Collection. Before holding that lock, a Run MAY read a
Copy's configuration file, to learn which Collection that Copy belongs to.

**R-PARALLEL-5.** Turbo-Collection MUST NOT let two Runs on one computer hold
one Collection's lock at once. Where a Run finds its Collection's lock held,
Turbo-Collection MUST end that Run at once with an error, and MUST NOT wait for
that lock. That error MUST state that Collection's `collectionName` and
`collectionId` (`meta-file-spec.md` R-MFILE-18). Where Turbo-Collection can
learn a process ID of whichever Run holds that lock, that error MUST state that
process ID. Where Turbo-Collection cannot learn that process ID, that error MUST
state that it is not known.

> **Example.** While a backup of a Collection runs, a status of that Collection
> started on that computer ends at once with an error that names that Collection
> and that backup's process ID. Started again once that backup has ended, that
> status reports.

**R-PARALLEL-6.** Turbo-Collection MUST hold a Collection's lock in a form that
a computer releases when whichever Run holds that lock ends, however that Run
ends.

> **Example.** A backup is ended partway through by a person closing its window.
> Whichever backup of that Collection comes next on that computer takes its lock
> at once, with nothing for a person to do first.

**R-PARALLEL-7.** Turbo-Collection MUST confirm that a Run holds its
Collection's lock before that Run reads or writes a Copy of that Collection,
other than that Copy's configuration file, and MUST end that Run with an error
where that confirmation fails.

**R-PARALLEL-8.** Turbo-Collection MUST NOT start a process that writes into a
Copy.

> **Example.** A backup writes files into a Copy of a Collection itself, rather
> than handing them to a copying program. Where that backup ends with an error
> partway through, nothing is left writing into that Copy, so whichever Run next
> takes that Collection's lock is alone in writing there.
