> **Version:** that of [`turbo-collection-spec.md`](turbo-collection-spec.md),
> of which this file is a part.

## Logging

### 8.2 Logging (`R-LOG-*`)

**R-LOG-1.**  
Every run MUST write a log recording at minimum: start time; end time;
configuration used; per import source, how many items were imported and any
refused items; per TC Copy, how many files were transferred and their byte
total; every error encountered; and its final outcome.

**R-LOG-2.**  
Logs MUST be observability only. Whether any TC Copy of a collection is correct
MUST NOT depend on a log file existing or being readable.

**R-LOG-3.** A run's log MUST record Turbo-Collection's version and a version
stamp (R-VER-18) for every specification Turbo-Collection conforms to, so that a
past run's behavior can be reconstructed.

**R-LOG-4.** Failures MUST be reported in a run's log even when its process
exits non-zero. A crash alone MUST NOT be what shows that something went wrong.

**R-LOG-5.** A log MUST NOT be a sole record of an event that changes whether
material at an import source can safely be deleted. Such events are recorded in
receipts (R-MFILE-13); a log MAY additionally record them and MUST NOT be relied
on to. Turbo-Collection MUST NOT write a log inside a TC Copy. Turbo-Collection
MUST write a Run's log into its operating system's directory for temporary
files, unless its command line names another directory for it (R-LOG-10).

**R-LOG-6.** Turbo-Collection MUST use `turbo-collection/logs/`, within
whichever directory for temporary files R-LOG-5 names, as a Run's log directory,
unless that Run's command line names another (R-LOG-10). Turbo-Collection MUST
write a Run's log into that Run's log directory, as `tc-<runId>.log.json`, where
`<runId>` is that Run's ID (`meta-file-spec.md` R-MFILE-13), making that log
directory, with every missing directory above it, where it does not exist.

> **Example.** A Run that only shows help, or only reports its version
> (R-CLI-16), still writes its log, and exits with status 0 (R-CLI-1).

> **Example.** Without `--log-dir`, a Run with ID `20261018T142205Z-3f9a` writes
> its log to a path such as one of these, where whatever comes before
> `turbo-collection` is a directory for temporary files:
>
> ```text
> C:\Users\alice\AppData\Local\Temp\turbo-collection\logs\tc-20261018T142205Z-3f9a.log.json
> /tmp/turbo-collection/logs/tc-20261018T142205Z-3f9a.log.json
> /var/folders/15/x8w2kq1n4d0c7mrv5jtg9h3p0000gn/T/turbo-collection/logs/tc-20261018T142205Z-3f9a.log.json
> ```

**R-LOG-7.** A Run's log MUST be text encoded in UTF-8 that holds one JSON
object (RFC 8259) per line, each object followed directly by a line feed
(`U+000A`). During a Run, Turbo-Collection MUST add each entry as a new last
line of that Run's log, and MUST NOT change or remove a line already written
there.

**R-LOG-8.** Every entry MUST hold `date`, recording when Turbo-Collection made
it, written as a receipt's `date` is (`meta-file-spec.md` R-MFILE-14), and
`event`, a name for what it records. An entry MAY hold `outcome`, which MUST be
`success` or `failure`; an entry that holds no `outcome` has `success` as its
outcome. An entry MAY hold `verbose`, which MUST be `true` or `false`; an entry
is verbose where its `verbose` is `true`, and not verbose otherwise. An entry
whose `outcome` is `failure` MUST NOT be verbose. An entry MAY hold other
fields, as its `event` needs.

**R-LOG-9.** Turbo-Collection MUST write each entry of a Run's log that is not
verbose also as a line of text a person can read: to standard error where that
entry's `outcome` is `failure`, and otherwise to standard output. It MUST write
a verbose entry to standard output likewise where that Run's command line holds
`--verbose`, and MUST NOT otherwise.

**R-LOG-10.** Where a Run's command line holds `--log-dir` with a directory,
Turbo-Collection MUST use that directory as that Run's log directory (R-LOG-6).
Where that directory lies inside a TC Copy, that Run MUST end with an error
before it makes a directory there. Where that Run cannot use that directory, it
MUST end with an error without writing its log into any other directory, as an
exception to R-LOG-1 and R-LOG-4. Where a Run's command line names an option or
a command that Turbo-Collection does not have, or cannot otherwise be read, that
Run MUST end with an error without writing a log, as a further exception to
R-LOG-1, R-LOG-4 and R-LOG-17.

> **Example.** A Run with ID `20261018T142205Z-3f9a`, given `--log-dir D:\logs`,
> writes its log to `D:\logs\tc-20261018T142205Z-3f9a.log.json`, and makes no
> directory in its directory for temporary files.

**R-LOG-11.** A Run's first entry MUST be `run-start`, holding:

- `version`, Turbo-Collection's version
- `specifications`, a list of version stamps (R-VER-18), one for each
  specification Turbo-Collection conforms to (R-LOG-3)
- `arguments`, that Run's command line as a list of arguments, without its
  program's own path
- `system`, its operating system's name and version
- `runtime`, name and version of whichever runtime runs Turbo-Collection, such
  as `node 24.20.0`

Its last entry MUST be `run-end`, whose `outcome` is `failure` exactly where
that Run exits with a non-zero status (R-CLI-1). `run-start`, and a `run-end`
whose `outcome` is `success`, MUST be verbose.

> **Example.** A Run that succeeds begins and ends its log with lines such as
> these:
>
> ```text
> {"date":"2026-10-18T14:22:05Z","event":"run-start","verbose":true,"version":"0.1.0","specifications":["turbo-collection-spec 1.2.0 (2027-03-01)","meta-file-spec 1.0.0 (2027-03-01)"],"arguments":["init","D:\\Photos"],"system":"Windows_NT 10.0.26200","runtime":"node 24.20.0"}
> {"date":"2026-10-18T14:22:06Z","event":"run-end","verbose":true}
> ```

**R-LOG-12.** Turbo-Collection MUST record each error as an `error` entry whose
`outcome` is `failure`, holding `message`, that error's message, and, where that
error carries one, `stack`, a trace of calls that led to it.

> **Example.** An init given a directory inside a TC Copy ends its log with
> lines such as these:
>
> ```text
> {"date":"2026-10-18T14:22:06Z","event":"error","outcome":"failure","message":"D:\\Photos\\2019 lies inside a TC Copy at D:\\Photos","stack":"Error: D:\\Photos\\2019 lies inside a TC Copy at D:\\Photos\n    at …"}
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

**R-LOG-13.** Each time a Run reads or writes a TC Copy's configuration file,
Turbo-Collection MUST record a verbose `configuration` entry holding `path`,
that file's path, and `configuration`, whatever configuration it read or wrote.

> **Example.** An init of `D:\Photos`, given `Family Photos` as a name, records
> what configuration it wrote with a line such as this:
>
> ```text
> {"date":"2026-10-18T14:22:06Z","event":"configuration","verbose":true,"path":"D:\\Photos\\.turbo-collection\\turbo-collection-config.json","configuration":{"version":"0.1.0-draft","collectionId":"3f2a9c1e-5b7d-4e8a-9c2f-1d6b8e4a7c30","collectionName":"Family Photos","tcCopyName":"main"}}
> ```

**R-LOG-15.** For each Content File a backup copies or an Import writes,
Turbo-Collection MUST record a verbose `transfer` entry holding `from`, where
that file is read from, `to`, its path in whichever TC Copy it is written to,
and `size`, its length in bytes.

**R-LOG-16.** For each of two TC Copies a backup mirrors, Turbo-Collection MUST
record a `mirror` entry once it has finished copying into that TC Copy, holding
`path`, that TC Copy's TC Directory, `tcCopyName`, its name, `files`, how many
files that backup copied into it, and `bytes`, their total length in bytes
(R-LOG-1). A Dry-Run of a backup (`backup-spec.md` R-BACKUP-10) MUST record
R-LOG-15's entries and this requirement's for what a real run would copy.

> **Example.** A backup that copies 412 photographs to a TC Copy named `home`,
> and nothing back, records lines such as these, a `transfer` line once per
> file:
>
> ```text
> {"date":"2026-10-19T20:14:03Z","event":"transfer","verbose":true,"from":"D:\\Photos\\2024\\2024-08\\sd-card\\IMG_0001.JPG","to":"E:\\Photos\\2024\\2024-08\\sd-card\\IMG_0001.JPG","size":4718592}
> {"date":"2026-10-19T20:14:09Z","event":"mirror","path":"E:\\Photos","tcCopyName":"home","files":412,"bytes":1932735283}
> {"date":"2026-10-19T20:14:09Z","event":"mirror","path":"D:\\Photos","tcCopyName":"main","files":0,"bytes":0}
> ```

**R-LOG-18.** For each directory an Import passes over as a `.turbo-collection`
directory (`local-folder-import-source-spec.md` R-LOCALFOLDER-3),
Turbo-Collection MUST record a verbose `passed-over` entry holding `path`, that
directory's path. Once an Import has finished, Turbo-Collection MUST record an
`import` entry holding `importSource`, that Import Source's identifier,
`layout`, its primary layout's identifier (`import-spec.md` R-SRC-15), `from`,
which path it read files from, `to`, which TC Directory it wrote them to,
`files`, how many files it wrote, `bytes`, their total length in bytes, and
`leftOut`, how many files it left out of its Collection. A Dry-Run of an import
(`import-spec.md` R-SRC-14) MUST record these entries, R-LOG-15's and R-LOG-19's
for what a real Import would do.

> **Example.** An import of `D:\moon-laptop` into a TC Copy at `E:\Photos`
> records lines such as these, a `transfer` line once per file:
>
> ```text
> {"date":"2026-10-21T15:02:11Z","event":"transfer","verbose":true,"from":"D:\\moon-laptop\\Woodwork\\birdhouse\\drawing.pdf","to":"E:\\Photos\\local-folder\\moon-laptop\\Woodwork\\birdhouse\\drawing.pdf","size":48211}
> {"date":"2026-10-21T15:02:12Z","event":"import","importSource":"local-folder","layout":"supplied-path-layout","from":"D:\\moon-laptop","to":"E:\\Photos","files":212,"bytes":1048576000,"leftOut":0}
> ```

**R-LOG-19.** For each item an Import places under supplied-path layout because
its primary layout is not able to place it (`import-spec.md` R-SRC-20),
Turbo-Collection MUST record a verbose `floored` entry holding `path`, where
that item's file is read from. For each item with an uncertain date
(`photo-path-layout-spec.md` R-PHOTO-8), Turbo-Collection MUST record a verbose
`uncertain-date` entry holding `path`, where that item's file is read from,
`governingTimestamp`, that item's governing timestamp, and `readFrom`, what that
timestamp was read from, such as `filename`.

> **Example.** An import of a camera's folder holding a `notes.txt`, and a photo
> whose Exif states a capture time with no offset, records lines such as these:
>
> ```text
> {"date":"2026-10-26T09:12:40Z","event":"floored","verbose":true,"path":"D:\\camera\\notes.txt"}
> {"date":"2026-10-26T09:12:40Z","event":"uncertain-date","verbose":true,"path":"D:\\camera\\DSC_0042.JPG","governingTimestamp":"2018-05-20T08:00:00","readFrom":"capture time with no offset"}
> ```
