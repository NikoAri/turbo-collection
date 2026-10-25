# TypeScript best practice: errors

How TypeScript under [`scripts/`](../../scripts/) says that something went
wrong. This document binds nothing, and no code cites it.

## The practice

**A thing that goes wrong is an error. Code under `scripts/` throws it as a
`TcError`, and Node reports it.**

```ts
if (tcCopyName === "" || CharacterNotInTcCopyName.test(tcCopyName)) {
  throw new TcError(
    `"${givenName}" cannot be a TC Copy's name. A name is not empty, and holds no control character and none of < > : " / \\ | ? *.`,
  );
}
```

`TcError` is in
[`scripts/helpers/tc-error.ts`](../../scripts/helpers/tc-error.ts). It adds a
name to `Error`, and nothing else:

```ts
export class TcError extends Error {
  override name = "TcError";
}
```

Every error that code under `scripts/` throws is a `TcError`, whether in an
operation, a helper, a sample or a test. There is one class. A name a person
gave wrong and a fault in the code are both a `TcError`, and the word in names,
comments and messages is _error_.

A `catch` that throws again with more to say throws a `TcError`, with the lower
error as its `cause`:

```ts
} catch (e) {
  throw new TcError(
    `no published version of ${packageName} satisfies ${requestedRange}: npmViewOutputJson: ${npmViewOutputJson}`,
    { cause: e },
  );
}
```

An error that stops a run is not caught on its way out. Node prints it and exits
with status 1:

```
TcError: "a/b" cannot be a TC Copy's name. A name is not empty, and holds no control character and none of < > : " / \ | ? *.
    at tcCopyNameFor (file:///C:/turbo-collection/scripts/init.ts:157:11)
    at initializeTc (file:///C:/turbo-collection/scripts/init.ts:221:22)
    at runCommand (file:///C:/turbo-collection/scripts/turbo-collection.ts:204:5)

Node.js v24.20.0
```

Where an error has a `cause`, Node prints that lower error under it, after
`[cause]:`.

The message is written for a person: what is wrong, and what to do about it
where there is something to do.

A test asserts on an error with `assert.throws` and a pattern over its message.

## Why

`TcError` is a convenience. `error instanceof TcError` tells an error that code
under `scripts/` threw from one that Node or a third-party dependency threw, and
a report or a log that begins `TcError:` tells a reader the same.

There is one class, and it behaves as `Error` does, so a reader needs no map of
error classes to follow a failure.

`TcError` sets its `name`, so the first line of `stack` and of `String(error)`
begins `TcError:`. Without it both begin `Error:`, while Node's report begins
`TcError:` either way (measured under Node v24.20.0).

What a `catch` throws again is thrown by code under `scripts/`, so it is a
`TcError`. The lower error stays whole as its `cause`, where Node's report shows
it, and where a filter still finds what Node or a third-party dependency threw.

Node's report loses nothing. The message stands on the line that begins
`TcError:`, and the stack trace under it says where the error was raised, which
is what finds a real fault. A report trimmed to one line would hide that trace
for a real fault as well as for an ordinary mistake.

An uncaught error also ends the run with a non-zero exit status with no code
written for it, which is what `turbo-collection-core-spec.md` R-CLI-1 asks of a
run that could not do what it was asked.

## What it does not reach

- **An error that Node or a third-party dependency throws.** It goes on its way
  as it was thrown. A `catch` that only gave it a new class would hide where it
  came from, so it is never caught just to be thrown again as a `TcError`.
- **The `catch` around reading the command line**, which writes the usage text
  to standard error and throws the same error again. A command line that cannot
  be read, an unknown option or command among them, ends the run before it has a
  log (`logging-spec.md` R-LOG-10), so Node's report, with its stack trace,
  follows the usage text.
- **A failure the code goes on from.** A `catch` that turns a missing file into
  a warning and carries on is not an error stopping a run.
- **The `catch` around `main` that writes an error into the run's log and throws
  it again**, since `logging-spec.md` R-LOG-4 asks for every failure in the log.
  The same error goes on its way out, so Node still reports its message and
  stack trace, and the run still exits with status 1. Only the source line Node
  quotes above them becomes a line of Node's own. Standard error then holds the
  message twice, first as the `error` entry's line (`logging-spec.md` R-LOG-9),
  then in Node's report with the stack trace under it, and both stay.
- **`ExitSignal`**, which stands in for `process.exit` in the npm updater's
  [test](../../scripts/test/package-json-npm-updater.test.ts): throwing it ends
  a call the way an exit would end the process. It reports no failure, so it
  extends `Error` directly.

## What holds it

Nothing checks this mechanically. Whoever reads a change holds the practice. A
search for `new Error(` under `scripts/`, outside `node_modules/`, finds a throw
that was missed.
