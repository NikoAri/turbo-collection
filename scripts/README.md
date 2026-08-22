# scripts

The implementation. TypeScript on Node, run directly with no build step.

This directory is the whole Node project: `package.json`, `tsconfig.json` and `node_modules` live
here, not at the repository root, so the root stays a documents repository.

## Setup

### Prerequisites

One prerequisite: **Node 24 or newer**.

On Windows 11:

```Terminal
winget install OpenJS.NodeJS.LTS
```

On macOS:

```Terminal
brew install node
```

The floor is Node 24 because Node strips TypeScript types as it loads each file, and that is enabled
by default only from Node 22.18 and 24 onward. [`package.json`](package.json) records it in
`engines`, which npm reports on but does not enforce.

There is no setup script, deliberately: one `winget install` does not need wrapping.

### Install

From the `scripts` directory:

```Terminal
npm install
```

That installs dev-time dependencies, and is the whole of setup.

## Commands

Run these from this directory.

| Command                    | What it does                                         |
| -------------------------- | ---------------------------------------------------- |
| `npm run lint`             | Types, formatting, and spelling. Reformats in place. |
| `npm run test`             | Run the test suite.                                  |
| `node turbo-collection.ts` | Run the entry point.                                 |

`lint` is three steps, each runnable alone: `lint:typecheck` (`tsc`), `lint:format`
(`prettier --write`), and `lint:spell` (`cspell`). It **rewrites files rather than complaining
about them**: formatting is not a judgment call worth reporting, while types and spelling only
report, because neither can be fixed without deciding what you meant.

Two scopes are worth knowing. Prettier and cspell both cover **this directory only**, so the
normative documents are never reformatted. The whole repository is spell checked from the repository
root instead, where the prose lives:

```Terminal
npx cspell .
```

Why each command carries no flags, how cspell finds its configuration without being told, and what
`package.json` deliberately leaves out: [`package.json.md`](package.json.md).

## What this is today

**A working toolchain and nothing else.** The entry point prints its own name and the suite runs one
empty test. Implementation starts next session.

That is deliberate. What this proves is that Node runs TypeScript with no build step, that `tsc`
checks it, that Prettier and cspell reach it, and that `node --test` discovers `test/`. Those are the
things worth having settled before any requirement is implemented, and they are now settled.

| File                                         | What it holds                                           |
| -------------------------------------------- | ------------------------------------------------------- |
| [`turbo-collection.ts`](turbo-collection.ts) | Entry point. A placeholder.                             |
| [`test/`](test/)                             | Tests. One placeholder, proving the runner works.       |
| [`package.json.md`](package.json.md)         | Why the manifest and the lint commands look as they do. |

## Rules this code is held to

**Cite requirement IDs, and only from a specification.** `R-META-2` restricts code and tests to
documents whose filename ends in `-spec.md`. Never cite `docs/design-record.md`, a decision record,
or a conversation.

**Behavior with no requirement behind it is a defect.** `R-META-3` gives exactly two remedies: add
the requirement, or remove the code. There is no third option, and "it seemed useful" is not one.

**Zero runtime dependencies.** Section 12.1 binds this to TypeScript on Node with the standard
library alone. `typescript` and `@types/node` are development-time only: Node strips types as it
loads each file, so TypeScript is a checker here and never a compiler, and neither package is
present when the tool runs.

**Erasable syntax only.** Type stripping erases; it does not transform. `enum`, `namespace`,
parameter properties and `import =` all type check and then fail to run, so `erasableSyntaxOnly`
in [`tsconfig.json`](tsconfig.json) rejects them at check time instead.

**Never delete.** `R-MIRROR-3` and `R-TGT-8` prohibit deleting a file at a target, with one
carve-out for Turbo-Collection's own temporary files (`R-MIRROR-8`). Section 13 requires a test
asserting no code path deletes. That test cannot be written until there is code to assert about;
write it with the first operation that touches a filesystem, not after.

**Every MUST maps to a test.** Section 13. Nothing to meet yet. When it starts, name the requirement
each test exercises, so the traceability audit Section 13 describes can be run mechanically.

## Before this writes to anything real

**No manifest may be written until the photo layout specification exists.** `R-INT-4` requires every
manifest to state a `layoutConvention`, and no document defines one yet. A manifest written now would
name a convention nothing describes, and `R-INT-10` makes a recorded checksum expensive to correct
afterward.

The specification version is a draft, so `version-requirement.md` `R-PUB-3` leaves the text behind
the number free to change, and `R-VER-5` lets a later build refuse any artifact this one writes.
Scratch data only.
