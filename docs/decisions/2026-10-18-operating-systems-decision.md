# Turbo-Collection runs under more than one operating system, and which ones is a binding

**Status:** Accepted **Date:** 2026-10-18

Replaces the record of 2026-10-08, under which Section 12 named Windows and
macOS, and Linux was left out until someone wanted it. Linux is named now,
because the collection lock, whose form differs by operating system, is built
for Linux as well.

Turbo-Collection is required to be operable under more than one operating
system, and a TC Copy written to under one is usable under another. The
requirement names no operating system. Section 12 of `turbo-collection-spec.md`,
its bindings, names Windows, macOS and Linux.

**A procedure already promised this.** The off-site TC Copy never travels, so
the working TC Copy is taken to it and backed up on whatever computer is there.
The off-site procedure tells an operator that any computer will do, including
one the operator does not own (`R-OFF-2`). `R-CLI-15` is what backs that
sentence.

**What is written does not depend on where it was written.** The name and
content of every file a run writes into a TC Copy are the same under every
operating system, so a TC Copy carries no mark of which one wrote to it. That is
what lets TC Copies written under different operating systems be mirrored with
each other, and what lets a sample TC Copy written under one serve as a test
under every other.

**Which operating systems is a binding.** Operating systems come and go over the
decades this project plans for, so the list sits beside the mirror engine and
the runtime, where a change touches no requirement of a specification. Section
12's table names them and calls them the supported operating systems, and the
setup procedure's `R-SET-1` names them for a person choosing a computer.
Everything else says a supported operating system, so a change to the list
touches only those. Each named operating system is one more under which every
test has to pass, so one is named once someone wants it.

## Rejected

- **Naming the operating systems in the requirement.** A requirement that names
  products is dated the day one of them is retired, and adding an operating
  system would be a change to a requirement where nothing about behavior
  changed.
- **A binding and no requirement.** Nothing would then forbid a manifest or a
  receipt that only one operating system reads back, and the promise in the
  off-site procedure would still rest on nothing.
- **A lock written for Linux, and Linux left out of the list.** Its Linux form
  would run where no test is required to pass, so nothing would notice it break.
- **The list repeated wherever operating systems come up.** Each repetition is
  one more place a change to the list has to reach, and one more that can be
  missed.
- **Settling now how the program reaches a borrowed computer.** Packaged
  executables, or a runtime and a checkout, is a question for when there is
  something to ship.

## Touches

`turbo-collection-core-spec.md`: `R-CLI-15`. `turbo-collection-spec.md`: Section
12, whose operating-systems row names the supported operating systems, whose
file-manipulation row refers to them, and whose paragraph states that the list
is a binding. `turbo-collection-setup-procedure.md`: `R-SET-1`, which names
them, and the note on exFAT, which refers to them. `docs/design-record.md`: the
filesystem row.
