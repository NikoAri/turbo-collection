# TypeScript best practice: errors

How TypeScript under [`scripts/`](../../scripts/) says that something went wrong. This document
binds nothing, and no code cites it.

## The practice

**A thing that goes wrong is an error. It is thrown as a plain `Error`, and Node reports it.**

```ts
if (copyName === "" || CharacterNotInCopyName.test(copyName)) {
  throw new Error(
    `"${givenName}" cannot be a copy's name. A name is not empty, and holds no control character and none of < > : " / \\ | ? *.`,
  );
}
```

There is one kind. No class extends `Error` to mark what a person did wrong apart from what the
code did wrong, and the word in names, comments and messages is _error_.

An error that stops a run is not caught on its way out. Node prints it and exits with status 1:

```
Error: "a/b" cannot be a copy's name. A name is not empty, and holds no control character and none of < > : " / \ | ? *.
    at copyNameFor (file:///C:/turbo-collection/scripts/init.ts:122:11)
    at initializeTc (file:///C:/turbo-collection/scripts/init.ts:150:20)
    at main (file:///C:/turbo-collection/scripts/turbo-collection.ts:92:20)

Node.js v24.20.0
```

The message is written for a person: what is wrong, and what to do about it where there is
something to do.

A test asserts on an error with `assert.throws` and a pattern over its message.

## Why

`throw new Error(message)` is the language's own form, so a reader needs no map of error classes
to follow a failure.

Node's report loses nothing. The message stands on the line that begins `Error:`, and the stack
trace under it says where the error was raised, which is what finds a real fault. A report trimmed
to one line would hide that trace for a real fault as well as for an ordinary mistake.

An uncaught error also ends the run with a non-zero exit status with no code written for it, which
is what `turbo-collection-core-spec.md` R-CLI-1 asks of a run that could not do what it was asked.

## What it does not reach

- **An error in the command line itself**, such as an unknown option or an unknown command. The
  usage text is what answers it, so it is reported with that text and a non-zero exit status, and
  no stack trace.
- **A failure the code goes on from.** A `catch` that turns a missing file into a warning and
  carries on is not an error stopping a run.
- **A `catch` that throws again with more to say.** Naming the package or the file that a lower
  error was about is still one plain `Error` on its way out.
- **The `catch` around `main` that writes an error into the run's log and throws it again**, since
  `logging-spec.md` R-LOG-4 asks for every failure in the log. The same error goes on
  its way out, so Node still reports its message and stack trace, and the run still exits with
  status 1. Only the source line Node quotes above them becomes a line of Node's own.

## What holds it

Nothing checks this mechanically. Whoever reads a change holds the practice.
