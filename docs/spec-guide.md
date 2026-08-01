# Reader's guide to the specifications

Where things are, and what each part covers. This guide binds nothing and states no rule; it points
at documents that do. Why a rule is what it is belongs in [`design-record.md`](design-record.md) and
in [`decisions/`](decisions/), never here.

## Which document does what

| Document | Job | Binds | May code cite it |
|---|---|---|---|
| [`specs/turbo-collection-spec.md`](../specs/turbo-collection-spec.md) | What must be true of Turbo-Collection itself. | implementation | yes |
| `specs/sources/<surface>/*-spec.md` | What may be assumed about getting original bytes out of one vendor surface. | implementation | yes |
| `specs/sources/<surface>/*-procedure.md` | Steps a human operator follows to acquire from that surface. | operator | no |
| [`specs/language-requirement.md`](../specs/language-requirement.md) | How a normative document is written, so its English stays interpretable across decades. | document authors | no |
| [`specs/version-requirement.md`](../specs/version-requirement.md) | How a normative document is numbered, published, archived, and corrected. | document authors | no |
| `docs/` | Explanation, rationale, and navigation. | nothing | no |

A **normative document** is any document stating requirements with stable IDs, so it is broader than
a specification: procedures and authoring standards are normative too. Only a document whose filename
ends in `-spec.md` may be cited by code.

Filenames carry the classification, so it survives a file being separated from its directory:
`-spec.md` binds the implementation, `-procedure.md` binds an operator, `-decision.md` binds nobody.

## Requirement-ID prefixes

Every prefix resolves to exactly one document.

| Prefix | Document | Covers |
|---|---|---|
| `R-META-*` | `turbo-collection-spec.md` | document self-sufficiency and classification |
| `R-COL-*` | `turbo-collection-spec.md` | collection invariants |
| `R-SRC-*` | `turbo-collection-spec.md` | Source port |
| `R-TGT-*` | `turbo-collection-spec.md` | Target port |
| `R-MIRROR-*` | `turbo-collection-spec.md` | mirror semantics |
| `R-INT-*` | `turbo-collection-spec.md` | integrity and fixity |
| `R-NAME-*` | `turbo-collection-spec.md` | filename safety |
| `R-CFG-*` | `turbo-collection-spec.md` | configuration |
| `R-LOG-*` | `turbo-collection-spec.md` | logging |
| `R-CLI-*` | `turbo-collection-spec.md` | command line |
| `R-VER-*` | `turbo-collection-spec.md` | artifact version stamps, format generations, migration |
| `R-LANG-*` | `language-requirement.md` | how a normative document is written |
| `R-PUB-*` | `version-requirement.md` | how a normative document is versioned and published |
| `R-ICLOUD-*` | `specs/sources/icloud/` | iCloud surface (planned, stub not yet filled) |
| `R-ALBUM-*` | `specs/layout/` | album layout convention (planned) |
| `R-PHOTO-*` | `specs/layout/` | photo layout convention (planned) |

## Map of the core specification

| Section | Covers |
|---|---|
| 0 | How to use the document, and its conventions |
| 1 | Scope, non-goals, and why invocation is external |
| 2 | Guiding principles the requirements derive from |
| 3 | Terminology, self-contained |
| 4 | Collection invariants, which outrank everything else |
| 5 | Source port |
| 6 | Target port |
| 7 | Mirroring, integrity, filename safety |
| 8 | Configuration, logging, command line, and three distinct read-only inspections |
| 9 | This specification's own version, artifact stamps, format generations and migration |
| 10 | Extension points: what each deferred goal would cost |
| 11 | Port contracts, summarized in tables |
| 12 | Current bindings and dated assumptions. Volatile by design |
| 13 | Conformance, in both directions, and traceability |
| 14 | Open questions |
| 15 | Change ledger |

Section 12 is the only section expected to change as tools change. Nothing above it depends on any
entry in it.

## Where to start

Reading the whole core specification takes an hour and is the honest answer for an implementer.
Otherwise:

- **What is this project?** [`../README.md`](../README.md), then [`design-record.md`](design-record.md) sections 1 to 4.
- **Why is it built this way?** [`design-record.md`](design-record.md), then [`decisions/`](decisions/) for anything decided since.
- **What am I allowed to build?** Core specification sections 4 to 8, then section 11 for port contracts.
- **How do I get photos out of a vendor?** The source specification for that surface, paired with its procedure.
- **How do I change a normative document?** [`../specs/language-requirement.md`](../specs/language-requirement.md) for wording, [`../specs/version-requirement.md`](../specs/version-requirement.md) for numbering and publication.
