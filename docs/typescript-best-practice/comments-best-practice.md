# TypeScript best practice: comments

How TypeScript under [`scripts/`](../../scripts/) writes a comment: how wide its
lines run, and where it uses _the_. This document binds nothing, and no code
cites it.

## Width

**No line of a comment is longer than 80 characters, its indentation and its
`//` counted.**

```ts
// Creates a run's log in `logDirectory`, under a new
// run ID, making the directory, with every missing
// directory above it, where it does not exist (R-LOG-6).
```

A comment that would run past 80 characters is wrapped by hand onto the next
line. A comment that follows code on its line counts that code too, so a long
one goes on its own line above the code:

```ts
type TcCliArgs = {
  // --log-dir: where the run's log goes (logging-spec.md R-LOG-10)
  logDir: string | undefined;
};
```

### Why

Prettier formats code to 80 characters, its default width, and leaves a comment
as it was written. A comment wider than that is the one text in a file that runs
past its code, so a reader scrolls sideways for it, and a diff shown side by
side cuts it off.

### What it does not reach

- **A string**, such as an error's message or a test's name. Prettier leaves a
  long string on one line, and so does this practice.
- **A URL or a path longer than the room on its line.** It is not broken, and
  stands on a line of its own.

### What holds it

Nothing checks this mechanically: Prettier does not wrap a comment, and `tsc`
does not read one. Whoever reads a change holds the practice.

## Articles

**A comment uses _the_ only where no more precise word serves.** Such a word is
_each_, _every_, _this_, _its_, a possessive, or a thing's own name, such as a
parameter's. A _the_ whose removal changes no meaning is dropped, and a sentence
that still needs one is often better rewritten:

```ts
// Takes the lock of the collection `tcConfig` belongs to, without waiting.
```

reads, rewritten:

```ts
// Locks `tcConfig`'s collection, without waiting.
```

### Why

_The_ promises a reader one thing they can identify. A comment mostly speaks of
whatever value a function is given, or of one thing it could name outright, so
that promise is usually false or vague. Specifications hold to this same rule,
in [`language-requirement.md`](../../specs/language-requirement.md) R-LANG-18
and R-LANG-19, so a comment reads like each specification it cites.

### What holds it

Nothing checks this mechanically. Whoever reads a change holds the practice.
