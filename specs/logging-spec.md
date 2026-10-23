> **Version:** that of [`turbo-collection-spec.md`](turbo-collection-spec.md),
> of which this file is a part.

## Logging

### 8.2 Logging (`R-LOG-*`)

**R-LOG-1.**  
Every run MUST write a log recording at minimum: start time; end time; the
configuration used; per import source, the count of items imported and any
refused items; per copy, the count and byte total of files transferred; every
error encountered; and the final outcome.

**R-LOG-2.**  
Logs MUST be observability only. The correctness of any copy of the collection
MUST NOT depend on a log file existing or being readable.

**R-LOG-3.** A run's log MUST record the Turbo-Collection version and a version
stamp (R-VER-18) for every specification Turbo-Collection conforms to, so that a
past run's behavior can be reconstructed.

**R-LOG-4.** Failures MUST be reported in the log even when the process exits
non-zero. A crash MUST NOT be the only evidence that something went wrong.

**R-LOG-5.** A log MUST NOT be the only record of an event that changes whether
material at an import source can safely be deleted. Such events are recorded in
receipts (R-MFILE-13); a log MAY additionally record them and MUST NOT be relied
on to. Turbo-Collection MUST NOT write a log inside a copy. Turbo-Collection
MUST write a Run's log into the operating system's directory for temporary
files, unless the command line names another directory for it (R-LOG-10).

**R-LOG-6.** Turbo-Collection MUST use `turbo-collection/logs/`, within the
directory for temporary files that R-LOG-5 names, as a Run's log directory,
unless the command line names another (R-LOG-10). Turbo-Collection MUST write a
Run's log into that Run's log directory, as `tc-<runId>.log.json`, where
`<runId>` is that Run's ID (`meta-file-spec.md` R-MFILE-13), making the log
directory, with every missing directory above it, where it does not exist.

> **Example.** A Run that only shows help, or only reports the version
> (R-CLI-16), still writes its log, and exits with status 0 (R-CLI-1).

> **Example.** Without `--log-dir`, a Run with ID `20261018T142205Z-3f9a` writes
> its log to a path such as one of these, where the part before
> `turbo-collection` is the directory for temporary files:
>
> ```text
> C:\Users\alice\AppData\Local\Temp\turbo-collection\logs\tc-20261018T142205Z-3f9a.log.json
> /tmp/turbo-collection/logs/tc-20261018T142205Z-3f9a.log.json
> /var/folders/15/x8w2kq1n4d0c7mrv5jtg9h3p0000gn/T/turbo-collection/logs/tc-20261018T142205Z-3f9a.log.json
> ```

**R-LOG-7.** A Run's log MUST be text encoded in UTF-8 that holds one JSON
object (RFC 8259) per line, each object followed directly by a line feed
(`U+000A`). During a Run, Turbo-Collection MUST add each entry as a new line at
the end of that Run's log, and MUST NOT change or remove a line already written
there.

**R-LOG-8.** Every entry MUST hold `date`, the instant Turbo-Collection made it,
in the form of a receipt's `date` (`meta-file-spec.md` R-MFILE-14), and `event`,
a name for what it records. An entry MAY hold `outcome`, which MUST be `success`
or `failure`; an entry that holds no `outcome` has the outcome `success`. An
entry MAY hold `verbose`, which MUST be `true` or `false`; an entry is verbose
where its `verbose` is `true`, and not verbose otherwise. An entry whose
`outcome` is `failure` MUST NOT be verbose. An entry MAY hold other fields, as
its `event` needs.

**R-LOG-9.** Turbo-Collection MUST write each entry of a Run's log that is not
verbose also as a line of text a person can read: to standard error where the
entry's `outcome` is `failure`, and otherwise to standard output. It MUST write
a verbose entry to standard output in the same way where the command line holds
`--verbose`, and MUST NOT otherwise.

**R-LOG-10.** Where the command line holds `--log-dir` with a directory,
Turbo-Collection MUST use that directory as the Run's log directory (R-LOG-6).
Where that directory lies inside a Copy, the Run MUST end with an error before
it makes a directory there. Where the Run cannot use that directory, it MUST end
with an error without writing its log into any other directory, as an exception
to R-LOG-1 and R-LOG-4. Where a Run's command line names an option or a command
that Turbo-Collection does not have, or cannot otherwise be read, the Run MUST
end with an error without writing a log, as a further exception to R-LOG-1,
R-LOG-4 and R-LOG-17.

> **Example.** A Run with ID `20261018T142205Z-3f9a`, given `--log-dir D:\logs`,
> writes its log to `D:\logs\tc-20261018T142205Z-3f9a.log.json`, and makes no
> directory in the directory for temporary files.

**R-LOG-11.** A Run's first entry MUST be `run-start`, holding:

- `version`, the Turbo-Collection version
- `specifications`, a list of version stamps (R-VER-18), one for each
  specification Turbo-Collection conforms to (R-LOG-3)
- `arguments`, the command line as a list of its arguments, without the
  program's own path
- `system`, the operating system's name and version
- `runtime`, the name and version of the runtime that runs Turbo-Collection,
  such as `node 24.20.0`

Its last entry MUST be `run-end`, whose `outcome` is `failure` exactly where the
Run exits with a non-zero status (R-CLI-1). `run-start`, and a `run-end` whose
`outcome` is `success`, MUST be verbose.

> **Example.** A Run that succeeds begins and ends its log with lines such as
> these:
>
> ```text
> {"date":"2026-10-18T14:22:05Z","event":"run-start","verbose":true,"version":"0.1.0","specifications":["turbo-collection-spec 1.2.0 (2027-03-01)","meta-file-spec 1.0.0 (2027-03-01)"],"arguments":["init","D:\\Photos"],"system":"Windows_NT 10.0.26200","runtime":"node 24.20.0"}
> {"date":"2026-10-18T14:22:06Z","event":"run-end","verbose":true}
> ```

**R-LOG-12.** Turbo-Collection MUST record each error as an `error` entry whose
`outcome` is `failure`, holding `message`, the error's message, and, where the
error carries one, `stack`, the trace of the calls that led to it.

> **Example.** An init given a directory inside a Copy ends its log with lines
> such as these:
>
> ```text
> {"date":"2026-10-18T14:22:06Z","event":"error","outcome":"failure","message":"D:\\Photos\\2019 lies inside a copy at D:\\Photos","stack":"Error: D:\\Photos\\2019 lies inside a copy at D:\\Photos\n    at …"}
> {"date":"2026-10-18T14:22:06Z","event":"run-end","outcome":"failure"}
> ```

**R-LOG-17.** Where a Run shows a person text that no other entry records, such
as its help or its version report, Turbo-Collection MUST record that text as a
`message` entry that is not verbose, holding `message`, that text.

> **Example.** A Run given `--version` records a line such as this:
>
> ```text
> {"date":"2026-10-18T14:22:05Z","event":"message","message":"turbo-collection 0.1.0\nturbo-collection-spec 0.1.0-draft\n…"}
> ```

**R-LOG-13.** Each time a Run reads or writes a Copy's configuration file,
Turbo-Collection MUST record a verbose `configuration` entry holding `path`, the
file's path, and `configuration`, the configuration it read or wrote.

> **Example.** An init of `D:\Photos`, given the name `Family Photos`, records
> the configuration it wrote with a line such as this:
>
> ```text
> {"date":"2026-10-18T14:22:06Z","event":"configuration","verbose":true,"path":"D:\\Photos\\.turbo-collection\\turbo-collection-config.json","configuration":{"version":"0.1.0-draft","collectionId":"3f2a9c1e-5b7d-4e8a-9c2f-1d6b8e4a7c30","collectionName":"Family Photos","copyName":"main"}}
> ```

**R-LOG-15.** For each Content File a backup copies or an Import writes,
Turbo-Collection MUST record a verbose `transfer` entry holding `from`, the path
that file is read from, `to`, its path in the Copy it is written to, and `size`,
its length in bytes.

**R-LOG-16.** For each of the two Copies a backup mirrors, Turbo-Collection MUST
record a `mirror` entry once it has finished copying into that Copy, holding
`path`, that Copy's root, `copyName`, its name, `files`, how many files the
backup copied into it, and `bytes`, their total length in bytes (R-LOG-1). A
Dry-Run of a backup (`backup-spec.md` R-MIRROR-7) MUST record the entries of
R-LOG-15 and of this requirement for what a real run would copy.

> **Example.** A backup that copies 412 photographs to a Copy named `home`, and
> nothing back, records lines such as these, the first of them once per file:
>
> ```text
> {"date":"2026-10-19T20:14:03Z","event":"transfer","verbose":true,"from":"D:\\Photos\\2024\\2024-08\\sd-card\\IMG_0001.JPG","to":"E:\\Photos\\2024\\2024-08\\sd-card\\IMG_0001.JPG","size":4718592}
> {"date":"2026-10-19T20:14:09Z","event":"mirror","path":"E:\\Photos","copyName":"home","files":412,"bytes":1932735283}
> {"date":"2026-10-19T20:14:09Z","event":"mirror","path":"D:\\Photos","copyName":"main","files":0,"bytes":0}
> ```

**R-LOG-18.** For each directory an Import passes over as a `.turbo-collection`
directory (`local-folder-import-source-spec.md` R-LOCALFOLDER-3),
Turbo-Collection MUST record a verbose `passed-over` entry holding `path`, that
directory's path. Once an Import has finished, Turbo-Collection MUST record an
`import` entry holding `importSource`, that Import Source's identifier, `from`,
the path it read the files from, `to`, the root of the Copy it wrote them to,
`files`, how many files it wrote, `bytes`, their total length in bytes, and
`leftOut`, how many files it left out of the Collection. A Dry-Run of an import
(`import-spec.md` R-SRC-14) MUST record these entries and those of R-LOG-15 for
what a real Import would do.

> **Example.** An import of `D:\old-laptop` into the Copy at `E:\Photos` records
> lines such as these, the first of them once per file:
>
> ```text
> {"date":"2026-10-21T15:02:11Z","event":"transfer","verbose":true,"from":"D:\\old-laptop\\Woodwork\\birdhouse\\drawing.pdf","to":"E:\\Photos\\local-folder\\old-laptop\\Woodwork\\birdhouse\\drawing.pdf","size":48211}
> {"date":"2026-10-21T15:02:12Z","event":"import","importSource":"local-folder","from":"D:\\old-laptop","to":"E:\\Photos","files":212,"bytes":1048576000,"leftOut":0}
> ```
