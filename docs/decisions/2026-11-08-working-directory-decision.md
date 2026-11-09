# A TC Directory left off a command line is found by searching up from a run's working directory

**Status:** Accepted **Date:** 2026-11-08

A run whose command line leaves out an optional TC Directory acts on whichever
TC Directory its working directory is or lies inside, looking at that directory
and then at each one above it, as git looks for a repository (`R-CLI-22`). A run
that finds none ends with an error before it writes anything. Import's TC
Directory is optional (`R-SRC-25`), and so is backup's second directory
(`R-BACKUP-1`).

- **A search finds at most one TC Copy.** No TC Copy lies inside another
  (`R-CLI-18`), and a run that meets one inside another still ends with an
  error.
- **A person working inside a TC Copy means that TC Copy.** An import only adds
  files, and reports what it added.
- **Importing from inside a TC Copy stays refused** (`R-LOCALFOLDER-2`), so
  `import .` from a folder inside a TC Copy cannot import that TC Copy into
  itself.
- **A working directory whose path passes through a link** ends its run with an
  error, as a given directory's path does (`R-CLI-20`), so a search never
  follows a link.
- **Init keeps its own rule.** Given no directory, it acts on its working
  directory and searches nothing (`R-INIT-2`), since a directory inside a TC
  Copy cannot become a TC Directory (`R-CLI-18`).
- **Verify and status** take no TC Directory on their command lines yet, and
  verify acts on every connected TC Copy (`R-VERIFY-1`). Once a command line of
  theirs names a TC Directory, that TC Directory is optional by this same rule
  (owner).

## Rejected

- **A working directory alone, with no search.** A run from a folder inside a TC
  Copy would be refused, though which TC Copy it means is unambiguous, and
  `R-CLI-18` already needs that same search.
- **Counting a command line's directories**, as in "one or two directories".
  Each is named by its role: a directory to import from, then an optional TC
  Directory (owner).

## Touches

`turbo-collection-core-spec.md`: `R-CLI-22`, added. `import-spec.md`:
`R-SRC-25`. `backup-spec.md`: `R-BACKUP-1`.
[The backup mirror record](2026-10-22-backup-mirror-decision.md), edited in
place.
