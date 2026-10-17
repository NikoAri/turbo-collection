## Logging

### 8.2 Logging (`R-LOG-*`)

**R-LOG-1.**  
Every run MUST write a plain-text log recording at minimum: start time; end
time; the configuration used; per import source, the count of items imported and
any refused items; per copy, the count and byte total of files transferred;
every error encountered; and the final outcome.

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
files.

**R-LOG-6.** For each Run, Turbo-Collection MUST make a directory
`turbo-collection/runs/<runId>/` within the directory for temporary files that
R-LOG-5 names, where `<runId>` is that Run's ID (`meta-file-spec.md`
R-MFILE-13). Turbo-Collection MUST write a Run's log into that Run's directory,
as `<runId>.log.json`.
