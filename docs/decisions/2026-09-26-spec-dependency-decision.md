# A specification depends on another by naming its MAJOR line in the header

**Status:** Accepted
**Date:** 2026-09-26

The peer-model pass of 2026-09-05 established that per-instance import source specifications may
factor shared mechanics into a base specification and depend on it, and named the formal dependency
mechanism as a deferred pass. This is that pass. The concrete case it serves: `icloud-personal` and
`icloud-work` each own a specification and each depend on a shared `icloud` base that holds the
account-independent mechanics.

The decision adds exactly one requirement, `R-PUB-13`. Everything else the pass needed turned out to
be answered by machinery already present, which is the main finding.

## What a dependency is, and where it is declared

A **normative dependency** is another normative document a document relies on to determine its own
obligations. It is declared in the depending document's header, beside `Satisfies:` and the other
relationship pointers already used there, as a `Depends on:` field naming the depended-on document's
identifier and the MAJOR line depended on. Ordinary cross-citations, the "see also" and rationale
pointers documents make of each other constantly, are informative and are not declared.

The declaration is required, not a convention, because `turbo-collection-spec.md` R-META-1 makes the
set of documents that bind the implementation *jointly sufficient*, and sufficiency is worth little
if a reader holding one document cannot tell which others belong in the set. A future reader
recovering the data needs the document to state what else it must be read with. This is the same job
an ISO standard's normative-references clause does, scaled to a header field because our documents
carry roughly one dependency each rather than dozens.

## A MAJOR line, not an exact version

A dependency names a MAJOR line (the `icloud` base's 1.x line), not a pinned version. A depending
document is present-tense (R-PUB-4): it tracks the current text of that line and needs no re-issue
when the dependency only adds to it, because additions are MINOR and everything conforming still
conforms (R-PUB-1). Only a MAJOR change of the dependency raises a question, and that question is
answered by the depending document's own bump test, the same test every change passes. Nothing new
governs the ripple.

A depending document may lag behind a dependency's newer MAJOR line **with no time limit**. It still
resolves, because a superseded line's terminal text is archived whole (R-PUB-5), and the artifact
trail already records which line actually governed any given import, so a deadline would buy nothing.

This is deliberately the opposite of what a meta file records. A manifest pins an exact
`{specId, version}` (`meta-file-spec.md` R-MFILE-9) because it is a dated claim about the bytes in one
directory, where tracking the latest text would be wrong. Living specification to living
specification is a line reference; stored artifact to specification is an exact pin. The distinction
is the standards world's dated-versus-undated reference, arrived at independently.

## Rejected

- **A convention rather than a requirement.** Cheaper by one rule, but it gives a future reader no
  guarantee the header is complete, so the R-META-1 closure would be sufficient only for someone who
  already knew the set. Discoverability was the whole point of formalizing what the peer-model pass
  had left informal.
- **Reusing the manifest's `{specId, version}` shape verbatim** for spec-to-spec, as the backlog item
  first proposed. Rejected once the line-not-pin decision landed: a living specification tracks a line,
  so it reuses the `specId` identifier but names a MAJOR line where the manifest names an exact
  version. Same identifier, different second element, because the two answer different questions.
- **A general versioned-dependency system across the whole normative set.** The four core documents
  already cite one another informally and R-META-1 already makes them jointly sufficient; that is not
  broken, and formalizing it would be machinery earning nothing. The mechanism is scoped to genuine
  dependencies, of which the import-source-to-base relationship is today the only one.
- **A "base" spec as a smuggled-in shared kind.** The peer-model pass rejected a shared `icloud`
  *kind* above the instances. A base specification is not that: the rejected kind was a manifest
  binding (an artifact naming a category), while a base is an authoring convenience (shared prose one
  document owns and others depend on). The manifest still binds only to the instance.

## Consequences accepted

The mechanism is defined before the specification it will first serve exists. The `icloud` base and
the two per-instance specifications are still stubs, so `R-PUB-13` has no dependency to point at yet;
the `Depends on:` header will be written when those documents are filled. Defining the rule first is
deliberate, so the filling has a settled convention to follow.

## Touches

`R-PUB-13` added to `version-requirement.md` Section 4, and the **Normative dependency** term to its
Section 2. No behavior changes and no other requirement is amended. The rule is stated in the
project's own terms; ISO and RFC practice informed it but are not cited normatively.
