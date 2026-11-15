# A TC Directory left off a command line is found by searching up from a run's working directory, or is that directory

**Status:** Accepted **Date:** 2026-11-14

Replaces the record of 2026-11-08, under which a run whose search found no TC
Directory ended with an error. An import now makes a TC Copy where it finds none
([the copy-creation decision](2026-11-14-copy-creation-decision.md)), and given
no TC Directory, it makes one where init would given no directory: in its
working directory.

A run whose command line leaves out an optional TC Directory acts on whichever
TC Directory its working directory is or lies inside, looking at that directory
and then at each one above it, as git looks for a repository (`R-CLI-22`). A run
that finds none takes its working directory in that TC Directory's place, so an
import or a backup acts there as it would on any directory it is given that is
not a TC Directory: it makes a TC Copy there, or ends with an error before it
writes anything but its log (`R-SRC-27`, `R-BACKUP-1`). Import's TC Directory is
optional (`R-SRC-25`), and so is backup's second directory (`R-BACKUP-1`).

- **A search finds at most one TC Copy.** No TC Copy lies inside another
  (`R-CLI-18`), and a run that meets one inside another still ends with an
  error.
- **A person working inside a TC Copy means that TC Copy.** An import only adds
  files, and reports what it added.
- **A working directory that holds a file is not made a TC Copy.** A person who
  forgets to change directory, and imports from a home folder, gets an error
  listing every file in the way, and nothing is written (`R-INIT-3`). Only an
  empty working directory becomes a TC Directory, and an empty one is most often
  a folder made for it.
- **Importing from inside a TC Copy stays refused** (`R-LOCALFOLDER-2`), so
  `import .` from a folder inside a TC Copy cannot import that TC Copy into
  itself. So does importing a folder that would contain the TC Copy an import
  makes, such as `import ..` from an empty folder (`R-SRC-27`).
- **A working directory whose path passes through a link** ends its run with an
  error, as a given directory's path does (`R-CLI-20`), so a search never
  follows a link.
- **Init keeps its own rule.** Given no directory, it acts on its working
  directory and searches nothing (`R-INIT-2`), since a directory inside a TC
  Copy cannot become a TC Directory (`R-CLI-18`).
- **Verify and status** take no TC Directory on their command lines yet, and
  verify acts on every connected TC Copy (`R-VERIFY-1`). Once a command line of
  theirs names a TC Directory, that TC Directory is optional by this same rule
  (owner), and a working directory in no TC Copy is refused there, since neither
  creates a TC Copy (`R-CLI-14`).

## Rejected

- **An error where a search finds no TC Directory.** The rule from 2026-11-08
  until 2026-11-14. Once an import makes a TC Copy where it finds none, that
  error would make an import given no TC Directory the one import that needs an
  init first, and init's refusal of a directory that holds a file already stops
  a run from a wrong folder.
- **A working directory alone, with no search.** A run from a folder inside a TC
  Copy would be refused, though which TC Copy it means is unambiguous, and
  `R-CLI-18` already needs that same search.
- **Counting a command line's directories**, as in "one or two directories".
  Each is named by its role: a directory to import from, then an optional TC
  Directory (owner).

## Touches

`turbo-collection-core-spec.md`: `R-CLI-22`, added on 2026-11-08, and since
2026-11-14 taking a run's working directory where a search finds none.
`import-spec.md`: `R-SRC-25` and `R-SRC-27`. `backup-spec.md`: `R-BACKUP-1`.
[The backup mirror record](2026-10-22-backup-mirror-decision.md), edited in
place.
