# Overlapping runs are kept apart by a log created exclusively, a configuration file written first, and a lock per collection

**Status:** Accepted
**Date:** 2026-10-20

Replaces the 2026-10-17 record, under which a run claimed its ID by making a directory of its own. A
run no longer makes one ([the log-location decision](2026-10-20-log-location-decision.md)), so
creating its log claims the ID instead.

Runs of Turbo-Collection may overlap on one computer. They are kept apart where two runs can meet,
and every such rule is in `parallel-safety-spec.md`.

- **A run's ID.** Two runs started in one second can draw one ID. A run creates its log, named by
  its ID (`R-LOG-6`), only where nothing is at that path, and draws a new ID where something is
  (`R-PARALLEL-1`). Creating a file only where none exists fails where one does, so of two runs
  writing into one log directory exactly one creates it.
- **Making a directory a copy.** An init, or a backup creating a copy, writes that copy's
  configuration file before any other file in it, and only where none exists. A run that finds one
  in place ends with an error, having written nothing else there (`R-PARALLEL-2`, `R-PARALLEL-3`).
  Two such runs meet on a directory, which no lock names: init has no collection until its
  configuration file exists, and a backup holds the lock of its own collection.
- **Acting on a copy.** Every run but init holds the lock of each collection whose copy it reads or
  writes, status and verify included (`R-PARALLEL-4`). A run that finds a lock held ends at once and
  names the collection, and also the process that holds the lock where the run can learn it
  (`R-PARALLEL-5`). The computer releases a lock when its run ends, however it ends, so a crash
  leaves nothing for a person to clean up (`R-PARALLEL-6`).

**The lock relies on every file belonging to one copy.** No copy lies inside another (`R-CLI-18`,
[the copy-creation decision](2026-10-18-copy-creation-decision.md)), no run follows a link inside a
copy (`R-CLI-19`, [the non-regular-files decision](2026-10-18-non-regular-files-decision.md)), and
no import reads a folder that is a copy, lies inside one or holds one (`R-LOCALFOLDER-2`). A
configuration is validated before its `collectionId` names a lock (`R-CFG-3`).

**The lock relies on a run doing its own writing.** A process that a run starts can keep running
after that run has ended, while the computer releases the lock when the run ends, so such a process
could still be writing into a copy when the next run takes the lock. Turbo-Collection starts no
process that writes into a copy (`R-PARALLEL-8`), so it copies files itself
([the mirror engine decision](2026-10-17-mirror-engine-decision.md)).

**The specification states behavior.** How each operating system holds a lock belongs in
`docs/typescript-best-practice/`. How a refused run learns the process ID of the holder is left for
later: the holder has to publish it, and until that is built a refusal says the process ID is not
known. A process ID helps a person find the run in the way, and nothing breaks without it.

**Out of scope:** runs of other accounts and runs under `sudo` on one computer, runs in WSL against
runs in Windows, and two versions of Turbo-Collection running at once. A copy is on an external hard
drive, which one computer reaches at a time.

## Rejected

- **A lock file deleted at the end, as git does.** A crash leaves it behind, and someone then has to
  judge whether its run is still alive.
- **Judging a lock by a process ID.** A process ID passes to another program once its process ends.
  A process ID only names the holder in an error; the computer decides whether a lock is held.
- **A lock inside a copy.** A read-only run would write into the copy, and a leftover would travel
  with the drive.
- **A heartbeat.** A run busy with work that does not yield misses its own refresh.
- **Waiting for a lock.** When a run happens is up to whatever starts it (`R-CLI-2`), so a run that
  cannot start ends and says why.
- **A global lock.** It refuses an init of an unrelated directory while another init runs, and
  misses a backup creating a copy unless backup takes it too, after which a long backup refuses
  every init on the computer.
- **A lock named after a directory.** One directory has many paths: letter case, links, a drive
  letter, a network path.
- **A lock taken by init.** It guards nothing: no other run can find a new collection before its
  configuration file exists.
- **The ignore file before the configuration file.** A run that loses the race could leave its
  ignore file in the winner's copy.
- **Many readers and one writer, so status and verify could run beside a backup.** Too complex for
  what it buys, and a verify reading a file a backup is still writing could report damage that is
  not there.

## Touches

`parallel-safety-spec.md`: Section 8.6, `R-PARALLEL-1` to `R-PARALLEL-8`. `logging-spec.md`:
`R-LOG-6`. `turbo-collection-core-spec.md`: `R-CFG-3` lets a run make its log directory and write its
log before it validates configuration; `R-CLI-18` and `R-CLI-19`.
`local-folder-import-source-spec.md`: `R-LOCALFOLDER-2`. [`spec-guide.md`](../spec-guide.md): a row
for `parallel-safety-spec.md` in each of its tables.
