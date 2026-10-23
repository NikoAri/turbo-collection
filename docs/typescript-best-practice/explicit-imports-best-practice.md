# TypeScript best practice: explicit imports

How TypeScript under [`scripts/`](../../scripts/) names what it takes from Node.
This document binds nothing, and no code cites it.

## The practice

**A name that a Node module exports is imported from that module, even where
Node also supplies it as a global.**

```ts
import console from "node:console";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
```

`console`, `process` and `URL` are globals, so a file using them runs without
those imports. It imports them anyway. A test file follows the practice as any
other file does.

A name used only as a type takes `import type`:

```ts
import type { URL } from "node:url";
```

Among the globals this reaches:

| Global                                                                    | Imported from                  |
| ------------------------------------------------------------------------- | ------------------------------ |
| `console`                                                                 | `node:console`, default export |
| `process`                                                                 | `node:process`, default export |
| `URL`, `URLSearchParams`                                                  | `node:url`                     |
| `Buffer`                                                                  | `node:buffer`                  |
| `setTimeout`, `setInterval`, `setImmediate`, and the `clear` form of each | `node:timers`                  |
| `TextEncoder`, `TextDecoder`                                              | `node:util`                    |
| `performance`                                                             | `node:perf_hooks`              |

## Why

A reader who meets `URL` or `process` in the middle of a file finds where it
comes from at the top of that file. With a bare global the answer is that Node
puts it there, and nothing in the file says so.

An import changes no behavior. A module's export and the global are one object,
so a test that replaces `console.log` or `process.exit` is seen by code that
imported either.

## What it does not reach

- **A name JavaScript itself defines**, such as `JSON`, `Map`, `Promise` and
  `Error`. These are the language, and no module exports them.
- **A global that no Node module exports**, such as `fetch`, `structuredClone`
  and `AbortController`. There is nothing to import, so such a name is used as a
  global.

## A line that looks like an import and is not one

```ts
import "node:console";
```

This loads the module and binds no name, so each `console` below it is still the
global. Name what is imported:

```ts
import console from "node:console";
```

## What holds it

Nothing checks this mechanically. `@types/node` declares these globals, so a
bare `process` passes `tsc`. Whoever reads a change holds the practice.
