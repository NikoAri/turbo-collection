# Traceability and durability are standards of their own, beside the core specification

**Status:** Accepted
**Date:** 2026-10-05

Two things left `turbo-collection-spec.md` for sibling documents:

- [`specs/traceability-requirement.md`](../../specs/traceability-requirement.md) holds `R-META-1` to
  `R-META-4`: which document binds what, that documents binding the implementation are jointly
  sufficient, that code cites only those, and that every behavior resolves to a requirement.
- [`specs/durability-requirement.md`](../../specs/durability-requirement.md) holds `R-DUR-1` to
  `R-DUR-6`: plain data, redundancy, re-verification, declared guarantees, recoverability without
  the code, and never destroying preserved data. These had been six of the core specification's
  guiding principles.

## The rule that sorts a passage

For any passage in the core specification, ask in order:

1. **Does it describe what the software does?** It stays in a `-spec.md`.
2. **Does it govern how normative documents are written, named, versioned, or cited?** It belongs to
   the `-requirement.md` family: language, version, and now traceability.
3. **Does it govern what design choices a specification or a decision may make?** It is a design
   standard, which is what `durability-requirement.md` is: a member of the same family that binds the
   substance of a design, not the form of a document.
4. **Is it the reason for something?** It belongs in `docs/`.

A `-requirement.md` document binds authors and not the implementation, applies to itself, and is
never cited by code, which `R-META-4` already makes mechanical through the filename.

## Why the durability axioms are requirements and not rationale

They could have stayed as reasoning in `design-record.md`, where the plain-files thesis already
lives. They are requirements because a later specification or decision can be measured against them,
and should be: each trades convenience today for recoverability later, and a clever addition is
exactly what would quietly trade it back. The behavioral requirements that already follow them, one
case at a time, are their instances.

Two principles stayed in the core specification because they describe Turbo-Collection's own
architecture and do not generalize: the core knows nothing of import sources or media, and a record
lives with the data it describes.

## Rejected

- **Moving the core specification's opening section to `docs/`.** It held normative, widely cited
  requirements, and `docs/` binds nothing. The section did not move; it dissolved, each part going
  where the rule above sends it.
- **A "structure" or "principles" document.** Each names a container, not a job. _Traceability_ names
  the one chain the four `R-META` requirements form; _durability_ names what every axiom serves, data
  and its meaning outliving tools.
- **Folding plain data into the traceability document.** It is a design axiom, not a rule about
  citation, and putting it there would rebuild the grab bag being taken apart.
- **A layout requirement document.** Layout binds the implementation, so it is the first case of the
  rule and already lives in `-spec.md` documents.

## Touches

`R-META-1` to `R-META-4` relocated with their IDs unchanged. `R-DUR-1` to `R-DUR-6` are new;
`R-DUR-6` generalizes "only ever adds" and carries the temporary-file carve-out of `R-MIRROR-8` with
it. `turbo-collection-spec.md` Section 0 became _Conventions_, Section 2 kept two principles, and
Section 13 became conformance procedure alone. `spec-guide.md` and `README.md` list both documents.
