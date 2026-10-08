# Turbo-Collection runs under more than one operating system, and which ones is a binding

**Status:** Accepted
**Date:** 2026-10-08

Turbo-Collection is required to be operable under more than one operating system, and a copy
written to under one is usable under another. The requirement names no operating system. The
bindings section of the core specification names two, Windows and macOS.

**A procedure already promised this.** The off-site copy never travels, so the working copy is taken
to it and backed up on whatever computer is there. The off-site procedure tells an operator that any
computer will do, including one the operator does not own (`R-OFF-2`). No specification backed that
sentence until now.

**What is written does not depend on where it was written.** The name and content of every file a
run writes into a copy are the same under every operating system, so a copy carries no mark of which
one wrote to it. That is what lets copies written under different operating systems be mirrored with
each other, and what lets a sample copy written under one serve as a test under every other.

**Which operating systems is a binding.** Operating systems come and go over the decades this
project plans for, so the list sits beside the mirror engine and the runtime, where a change touches
one section and no requirement. Linux is the likely next entry and is left out until someone wants
it, because each named operating system is one more under which every test has to pass.

## Rejected

- **Naming the operating systems in the requirement.** A requirement that names products is dated
  the day one of them is retired, and adding an operating system would be a change to a requirement
  where nothing about behavior changed.
- **A binding and no requirement.** Nothing would then forbid a manifest or a receipt that only one
  operating system reads back, and the promise in the off-site procedure would still rest on
  nothing.
- **Three operating systems from the start.** Nobody wants Linux yet, and naming it would oblige
  testing under it.
- **Settling now how the program reaches a borrowed computer.** Packaged executables, or a runtime
  and a checkout, is a question for when there is something to ship.

## Touches

`turbo-collection-spec.md`: `R-CLI-15` added; Section 12 gains an operating-systems row and a
paragraph stating that the list is a binding.
