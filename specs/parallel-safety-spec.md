## Parallel safety

### 8.6 Parallel safety (`R-PARALLEL-*`)

**R-PARALLEL-1.** Turbo-Collection MUST make a Run's directory
(`logging-spec.md` R-LOG-6) only where nothing exists at the path of that
directory. Where something exists at that path, Turbo-Collection MUST give the
Run another ID, and make the Run's directory under the new ID.

> **Example.** Two Runs started in one second draw the same ID,
> `20261015T215020Z-3b52`. The Run that makes
> `turbo-collection/runs/20261015T215020Z-3b52/` first keeps that ID. The other
> Run takes a new ID and makes its directory under that one.

**R-PARALLEL-2.** Where Turbo-Collection makes a directory a Copy
(`turbo-collection-core-spec.md` R-CLI-11, R-CLI-13), Turbo-Collection MUST
write that Copy's configuration file (`meta-file-spec.md` R-MFILE-17) before
any other file it writes into that directory. Turbo-Collection MUST write that
configuration file only where nothing exists at its path.

**R-PARALLEL-3.** Where a Run is making a directory a Copy and something
already exists at the path of that Copy's configuration file, Turbo-Collection
MUST end that Run with an error, and MUST NOT write any other file into that
directory.

> **Example.** An init and a backup are each given the empty directory
> `archive/photos` at one moment, and each finds it empty. The init writes its
> configuration file first, then its ignore file. The backup finds the init's
> configuration file in place, ends with an error, and has written no file into
> `archive/photos`.

**R-PARALLEL-4.** Every Run other than an init MUST hold its Collection's lock
on the computer that Run is performed on, for as long as that Run reads or
writes a Copy of that Collection. Before holding that lock, a Run MAY read a
Copy's configuration file, to learn which Collection that Copy belongs to.

**R-PARALLEL-5.** Turbo-Collection MUST NOT let two Runs on one computer hold
one Collection's lock at the same time. Where a Run finds its Collection's lock
held, Turbo-Collection MUST end that Run at once with an error, and MUST NOT
wait for the lock.

> **Example.** While a backup of a Collection runs, a status of that Collection
> started on the same computer ends at once with an error. Started again once
> the backup has ended, the status reports.

**R-PARALLEL-6.** Turbo-Collection MUST hold a Collection's lock in a form that
the computer releases when the Run holding that lock ends, however that Run
ends.

> **Example.** A backup is ended partway through by a person closing its
> window. The next backup of that Collection on that computer takes the lock at
> once, with nothing for a person to do first.

**R-PARALLEL-7.** Turbo-Collection MUST confirm that a Run holds its
Collection's lock before that Run reads or writes a Copy of that Collection,
other than that Copy's configuration file, and MUST end that Run with an error
where that confirmation fails.
