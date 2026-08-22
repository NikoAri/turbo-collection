# package.json

Why [`package.json`](package.json) looks the way it does. It binds nothing; it explains.

The theme is that **non-default configuration has to earn its keep**. Every flag and every key is
something to maintain, something that can drift out of step with the tool, and something a reader
has to work out later. Several things that looked necessary in this file turned out not to be, and
the reasoning is recorded here so they do not come back by habit.

## The scripts carry no flags

```
lint             npm run lint:typecheck && npm run lint:format && npm run lint:spell
lint:typecheck   tsc
lint:format      prettier --write .
lint:spell       cspell .
test             node --test
```

Each is the tool's default behavior pointed at the current directory. `node --test` takes no path
either: it discovers `test/` and any `*.test.ts` on its own.

**`tsc` takes no arguments on purpose.** Given no input files it reads
[`tsconfig.json`](tsconfig.json), which is where `noEmit`, `strict` and `erasableSyntaxOnly` live.
`--noEmit` was on this line once and was removed as redundant. Note the trap that replaces it: **name
a file on this command line and TypeScript ignores `tsconfig.json` entirely**, silently dropping
every setting in it. Keep the command argument-free.

**`prettier --write .` resolves from this directory**, which is the only thing keeping it away from
the normative documents in [`../specs`](../specs) and [`../docs`](../docs). Those are hand-authored
under [`language-requirement.md`](../specs/language-requirement.md), their table alignment is
deliberate, and formatting them rewrites 26 files and 46 lines of the core specification alone. A
`.prettierignore` file used to sit here claiming to enforce that boundary. It did not: the
confinement comes from the current directory, and the ignore file was documentation wearing a
config file's clothes.

Prettier also runs entirely on its defaults. There is no `.prettierrc` and no `prettier` key,
because every setting it offers is a preference, and not having preferences about formatting is the
reason to use it.

## `cspell .` finds its configuration by walking up the directory tree

This is the one behavior worth writing down, because it looks like magic and it is the reason this
line needs neither `--config` nor `--root`.

There is no `cspell.json` in this directory. The configuration lives at the repository root, in
[`../cspell.json`](../cspell.json), and cspell finds it by searching upward from where it runs.

Demonstrated rather than assumed, in a scratch tree:

| Where the config sat            | Result for a word only that config allows |
| ------------------------------- | ----------------------------------------- |
| Three directories above the run | accepted                                  |
| Removed entirely                | flagged as an unknown word                |
| One directory above the run     | accepted                                  |

**Nothing local stops the search.** Neither a `.git` directory nor an intervening `package.json`
halts it, tested both ways: a config placed _above_ a git repository still applied to files inside
it. That is exactly why this directory picks up the root configuration despite holding a
`package.json` of its own.

The filenames cspell will accept, read out of the installed `cspell-lib` rather than from memory:

```
cspell.json    cspell.jsonc    cspell.yaml    cspell.yml
cspell.config.json    cspell.config.jsonc    cspell.config.yaml
cspell.config.yml     cspell.config.js
```

each also accepted with a leading dot, as `.cspell.json` and so on.

Two consequences worth keeping in mind. The search is **not bounded by the project**, so a stray
configuration file in a parent directory would apply silently, and where the walk finally stops was
not established. And the spell check here is scoped to **this directory only**. The whole repository
is checked from the repository root instead, with `npx cspell .`, because that is where the prose
is and it is a different job for a different reader: somebody running `npm run lint` is editing code
here, not editing specifications.

Sourcing note: `cspell.org` returned 404 on every documentation path tried on 2026-08-22, so the
above rests on the behavior of the installed version and on the filename list inside the package.
That is the exact version in use, which is good evidence, but it is not a vendor promise and may
change.

## `version` is not the specification's version

They are different numbers for different things, and they should be free to diverge.

`turbo-collection-spec.md` R-LOG-3 requires a run's log to record **both** the Turbo-Collection
version and the specification version it conforms to. That obligation only means something if the
two are separate. Their bump tests differ as well: the specification's is artifact-driven (R-VER-1,
MAJOR when an artifact written under the previous version would parse differently), while this one
would follow the command line contract. Coupling them would force meaningless bumps in both
directions, since a prose correction to the specification changes no code and a bug fix here changes
no document.

**No `-draft` suffix here, unlike the specification.** It was tried on 2026-08-22 and dropped the
same day. In `version-requirement.md` that suffix is a normative trigger: `R-PUB-3` makes publication
happen the moment a stamp without it escapes, and `R-PUB-2` freezes the text from then on. Nothing
here works that way, so the suffix would have implied a coupling this section exists to deny. The
`0.x` major already says everything it was saying, per semver.org: "Major version zero (0.y.z) is
for initial development. Anything MAY change at any time."

**Still open:** nothing decides how this number bumps. R-VER-1 governs the specification and the
`R-PUB-*` rules govern documents, but no requirement states a bump test for the implementation, and
R-LOG-3 asks for the version without saying how it is chosen. Settle that when logging lands.

Also still open: when a `--version` flag exists, decide whether it prints this number, the
specification version, or both. R-LOG-3 wants both in a log, so probably both.

## What is deliberately absent

**No `version` was tried, and reversed.** It was removed on 2026-08-22 as inert metadata and restored
the same day. npm tolerates its absence for `install` and `run`, but `npm publish --dry-run` crashes
without it, reporting `Cannot read properties of null (reading 'prerelease')` rather than anything a
reader could act on.

**No `private`.** It was here until 2026-08-22 and was removed as the first casualty of the rule at
the top of this file. npm documents the key as preventing `npm publish`, but that could not be
verified: with the key present, `npm publish --dry-run` exits 0 and still enumerates a tarball
without ever mentioning `private`, so the dry run does not exercise the check, and the real path was
not tried for the obvious reason.

An **unverified guard against an action nobody plans to take** is exactly what "non-default needs a
really good reason" excludes. Publishing to npm is not a plan for this tool, and if it ever becomes
one, the key comes back with a test behind it. Note the field is unrelated to the source being open:
the repository is public and MIT licensed either way.

**No `bin`.** It does nothing until the package is installed globally or linked, and neither has ever
happened. Declaring a capability that is never exercised is what R-META-3 calls unauthorized: add the
requirement, or remove the code, and there is no third option. When the tool is really installed, a
`bin` entry is what turns `node turbo-collection.ts` into `turbo-collection`.

**No `engine-strict`.** The `engines` field records the Node 24 floor but nothing enforces it, by
the owner's decision on 2026-08-22: nobody is expected to run an older Node, so it is not a scenario
worth covering. For the record of what enforcement would have bought, `.npmrc` with
`engine-strict=true` turns npm's `EBADENGINE` warning into a non-zero exit, which converts a later
and more confusing failure (`ERR_UNKNOWN_FILE_EXTENSION` on a `.ts` file, which names neither Node
nor its version) into an accurate one at install time.

## Dependencies

Runtime dependencies are **zero and must stay zero**, which is what `turbo-collection-spec.md`
Section 12.1 binds. The four development dependencies never ship and never run against a collection:
`typescript` and `@types/node` type check source that Node already understands, and `prettier` and
`cspell` check formatting and spelling.
