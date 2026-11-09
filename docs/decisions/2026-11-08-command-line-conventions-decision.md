# The command line follows POSIX's utility conventions, with GNU's long options

**Status:** Accepted **Date:** 2026-11-08

Turbo-Collection reads a command line as POSIX.1-2024's Utility Syntax
Guidelines describe, gives each option a long name as the GNU Coding Standards
describe, writes help in POSIX's synopsis notation, and answers `--help` and
`--version` as GNU asks (`R-CLI-23`). No RFC covers command lines. POSIX is the
standard, and its
[Chapter 12](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap12.html)
has no long option, which
[GNU's Section 4.8](https://www.gnu.org/prep/standards/html_node/Command_002dLine-Interfaces.html)
adds. Both are decades old, both name an edition, and a person who knows either
command-line tradition meets nothing new.

What this asks of the command line:

- **`--help` and `--version` pass over whatever else a command line holds**, so
  `backup --help` shows help as `--help` does. GNU: "Other options and arguments
  should be ignored once this is seen". Two things still count: options that say
  where a run's log goes and what it shows, since every run writes a log
  (`R-LOG-1`, `R-LOG-10`), and an option or command Turbo-Collection does not
  have, which is still an error (`R-LOG-10`).
- **`-n` is `--dry-run`**, as `make` has it in GNU's
  [table of long options](https://www.gnu.org/prep/standards/html_node/Option-Table.html),
  and `--name` has no short form.
- **Help writes options before operands**:
  `turbo-collection init [options] [<tc-directory>]`. POSIX's Section 12.1 shows
  "utility_name [options] [operands]" for a utility "with very complex
  arguments", and its Guideline 9 puts options first. Options after operands are
  still read, as GNU's parsers read them.
- **A placeholder in angle brackets**, such as `<tc-directory>`, is Section
  12.1's own notation, as are brackets for what is optional.

## Rejected

- **Citing clig.dev.** A good guide that agrees with both standards, but a web
  page that changes, with no edition to name. Read, not cited.
- **docopt's notation.** A library's, last released as 0.6.2. POSIX's Section
  12.1 already holds the notation it uses.
- **POSIX alone.** Its Guideline 3 allows single-character options only.
- **Guidelines 1 and 2**, on a utility's name: two to nine lowercase letters and
  digits, which `turbo-collection` is not. The name is the project's.
- **`-n` for `--name`.** It took the letter that GNU's table and clig.dev both
  give to `--dry-run`, which every command takes.
- **`[options]` after the operands.** It read as docopt does, not as POSIX does.
- **`--help` passing over the log's options too**, as GNU says of every option.
  A help run writes a log, and `--log-dir` says where.

## Touches

`turbo-collection-core-spec.md`: `R-CLI-23`. `scripts/turbo-collection.ts`:
`parseCliArgs` and help text.
