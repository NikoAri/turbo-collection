# scripts

The implementation. TypeScript on Node, run directly with no build step.

This directory is the whole Node project: `package.json`, `tsconfig.json` and
`node_modules` live here, not at the repository root, so the root stays a
documents repository.

## Setup

### Prerequisites

One prerequisite: **Node 24.19.0 or newer**.

On Windows 11:

```Terminal
winget install OpenJS.NodeJS.LTS
```

On macOS:

```Terminal
brew install node
```

On Linux, with Homebrew:

```Terminal
brew install node
```

The floor is Node 24.19.0. Two things need a recent Node 24: stripping
TypeScript types as each file loads, enabled by default only from Node 22.18 and
24.0 onward, and the `import.meta.main` run-guard in
[`package-json-npm-updater.ts`](helpers/package-json-npm-updater.ts), added in
Node 24.2.0. 24.19.0 clears both. [`package.json`](package.json) records the
floor in `engines`, and [`.npmrc`](.npmrc) sets `engine-strict=true`, so
`npm install` fails on an older Node rather than only warning.

There is no setup script, deliberately: one `winget install` does not need
wrapping.

### Install

From the `scripts` directory:

```Terminal
npm install
```

That installs every dependency, and is the whole of setup.

## Commands

Run these from this directory.

| Command                        | What it does                                               |
| ------------------------------ | ---------------------------------------------------------- |
| `npm run lint`                 | Types, formatting, and spelling. Reformats in place.       |
| `npm run test`                 | Run the test suite.                                        |
| `npm run test:windows-and-wsl` | Run the test suite under Windows, then under Linux in WSL. |
| `node turbo-collection.ts`     | Run the entry point.                                       |

`lint` is three steps, each runnable alone: `lint:typecheck` (`tsc`),
`lint:format` (`prettier --write`), and `lint:spell` (`cspell`). It **rewrites
files rather than complaining about them**: formatting is not a judgment call
worth reporting, while types and spelling only report, because neither can be
fixed without deciding what you meant.

Two scopes are worth knowing. Prettier and cspell both cover **this directory
only**, so the normative documents are never reformatted. The whole repository
is spell checked from the repository root instead, where the prose lives:

```Terminal
npx cspell .
```

Why each command carries no flags, how cspell finds its configuration without
being told, and what `package.json` deliberately leaves out:
[`package.json.md`](package.json.md).

## What this is today

**`init`, `import` and `backup` work, and nothing else does yet.**
`node turbo-collection.ts init` makes a directory a copy, as `init-spec.md`
describes. `node turbo-collection.ts import local-folder <directory>` imports a
directory's files into the copy it is run in, as `import-spec.md` and the
local-folder specification describe.
`node turbo-collection.ts backup <directory> <directory>` mirrors two copies,
first making one of them a copy where it is an empty directory, as
`backup-spec.md` describes. Status and verify are not written.

Every run, help and version among them, writes its log into
`turbo-collection/logs/` in the directory for temporary files, or into the
directory `--log-dir` names, as `logging-spec.md` describes.

Import and backup hold their collection's lock, a `NamedMutex`, while they read
and write a copy (`parallel-safety-spec.md` R-PARALLEL-4).

| File                                                   | What it holds                                                                                |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [`turbo-collection.ts`](turbo-collection.ts)           | Entry point: reads the command line, makes the run and its log, and runs a command.          |
| [`init.ts`](init.ts)                                   | The init operation.                                                                          |
| [`import.ts`](import.ts)                               | The import operation, which writes each file into the copy, and its manifest and receipts.   |
| [`local-folder-importer.ts`](local-folder-importer.ts) | The local-folder importer: which files of a directory it supplies, and their paths.          |
| [`backup.ts`](backup.ts)                               | The backup operation: its checks, a new copy, and each file, manifest and receipt it writes. |
| [`mirror.ts`](mirror.ts)                               | What a mirror of two copies copies into each, and what it reports instead.                   |
| [`copy-contents.ts`](copy-contents.ts)                 | Reads what a copy holds: each directory's files, manifest and receipt files.                 |
| [`content-files.ts`](content-files.ts)                 | A content file's checksum, and a copy of it written and checked in one read.                 |
| [`meta-files.ts`](meta-files.ts)                       | Reads and checks a configuration file and a manifest, and writes a manifest and receipts.    |
| [`collection-lock.ts`](collection-lock.ts)             | Takes a collection's lock on this computer.                                                  |
| [`logger.ts`](logger.ts)                               | A run's log: where it goes, what an entry holds, and the entries every run writes.           |
| [`paths.ts`](paths.ts)                                 | Checks on a directory a run is given: a link in its path, and a copy above it.               |
| [`versions.ts`](versions.ts)                           | The versions that a run's log records and the version report states.                         |
| [`tcignore.ts`](tcignore.ts)                           | Reads an ignore file, and says whether it ignores a path.                                    |
| [`templates/`](templates/)                             | The starter ignore file that init writes into a copy.                                        |
| [`helpers/`](helpers/)                                 | The script behind `npm run update`, `NamedMutex`, `TcError`, dates and run IDs.              |
| [`sample-usage/`](sample-usage/)                       | Code run by hand to show a helper in use. Nothing imports it, and no test runs it.           |
| [`test/`](test/)                                       | Tests, each named for the requirement it exercises.                                          |
| [`package.json.md`](package.json.md)                   | Why the manifest and the lint commands look as they do.                                      |

## Rules this code is held to

**Cite requirement IDs, and only from a specification.** `R-META-2` restricts
code and tests to documents whose filename ends in `-spec.md`. Never cite
`docs/design-record.md`, a decision record, or a conversation.

**Behavior with no requirement behind it is a defect.** `R-META-3` gives exactly
two remedies: add the requirement, or remove the code. There is no third option,
and "it seemed useful" is not one.

**Standard library first.** Section 12 binds this to TypeScript on Node, and
admits a third-party package only when it implements a documented format the
specification cites, carries no dependencies of its own, and is listed in that
section's table with its license and a link. Such a package is installed with
npm. `ignore`, which matches `.tcignore` patterns, is listed there. `typescript`
and `@types/node` are development-time only: Node strips types as it loads each
file, so TypeScript is a checker here and never a compiler, and neither package
is present when the tool runs.

**Erasable syntax only.** Type stripping erases; it does not transform. `enum`,
`namespace`, parameter properties and `import =` all type check and then fail to
run, so `erasableSyntaxOnly` in [`tsconfig.json`](tsconfig.json) rejects them at
check time instead.

**TypeScript best practices.**
[`docs/typescript-best-practice/`](../docs/typescript-best-practice/) holds how
the TypeScript here is written, one practice to a document. Read each document
there before changing a `.ts` file.

**Never delete.** `R-BACKUP-6` and `R-TGT-7` prohibit deleting a file in a copy.
Section 13 requires a test asserting no code path deletes. That test is not
written. A scan of the source for calls that delete was considered on 2026-10-13
and set aside as too weak: it misses a delete done by a program this code runs,
and a rename or an overwrite that destroys content. A better form is owed. Until
there is one, whoever reads a change holds this rule.

**Every MUST maps to a test.** Section 13. Each test is named for the
requirement it exercises, so the traceability audit Section 13 describes can be
run mechanically.

**Nothing runs by itself.** No CI workflow and no git hook runs the tests or the
lint: every run is one someone starts. `R-CLI-15` has this code operable under
each operating system Section 12 names, so the suite is run on each of them by
hand. From Windows, `npm run test:windows-and-wsl` runs it under Windows and
under Linux in WSL.

## Before this writes to anything real

**No manifest written now is durable.** `R-MFILE-9` requires every manifest to
name the layout specification that placed its directory, with that
specification's version, and every specification is still a draft. A manifest
written now would name a text that is free to change, and `R-INT-10` makes a
recorded checksum expensive to correct afterward.

The specification version is a draft, so `version-requirement.md` `R-PUB-3`
leaves the text behind the number free to change, and `R-MFILE-7` lets a later
build refuse any meta file this one writes. Scratch data only.
