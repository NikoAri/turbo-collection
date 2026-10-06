# Reader's guide to the specifications

Where things are, and what each part covers. This guide binds nothing and states no rule; it points
at documents that do. Why a rule is what it is belongs in [`design-record.md`](design-record.md) and
in [`decisions/`](decisions/), never here.

## Which document does what

| Document | Job | Binds | May code cite it |
|---|---|---|---|
| [`specs/turbo-collection-spec.md`](../specs/turbo-collection-spec.md) | What must be true of Turbo-Collection itself. | implementation | yes |
| [`specs/meta-file-spec.md`](../specs/meta-file-spec.md) | What is written: every meta file's name, place, and contents. Its version is the meta file format version. | implementation | yes |
| [`specs/photo-path-layout-spec.md`](../specs/photo-path-layout-spec.md) | Where a photograph or a video goes inside a copy. | implementation | yes |
| [`specs/as-found-path-layout-spec.md`](../specs/as-found-path-layout-spec.md) | Where a file goes when it is kept at the path its import source supplied: files taken in where they already sit, and the floor beneath every other layout. | implementation | yes |
| `specs/import-sources/<import-source>/*-spec.md` | What may be assumed about getting original bytes out of one import source, and which layout governs its items. | implementation | yes |
| `specs/import-sources/<import-source>/*-procedure.md` | Steps a human operator follows to import from that import source. | operator | no |
| [`specs/procedures/*-procedure.md`](../specs/procedures/) | What a person does, one document per sitting: setup, import, backup, off-site, release. Steps only; reasoning lives in [`decisions/`](decisions/). | operator | no |
| [`specs/language-requirement.md`](../specs/language-requirement.md) | How a normative document is written, so its English stays interpretable across decades. | document authors | no |
| [`specs/version-requirement.md`](../specs/version-requirement.md) | How a normative document is numbered, published, archived, and corrected. | document authors | no |
| [`specs/traceability-requirement.md`](../specs/traceability-requirement.md) | How documents, requirements, and code cite and trace to one another: which document binds what, that the set is sufficient, and that code cites only it. | document authors | no |
| [`specs/durability-requirement.md`](../specs/durability-requirement.md) | The durability axioms every specification and design must satisfy: plain data, redundancy, re-verification, declared guarantees, recoverability, no destruction. | document authors | no |
| `docs/` | Explanation, rationale, and navigation. | nothing | no |

A **normative document** is any document stating requirements with stable IDs, so it is broader than
a specification: procedures and authoring standards are normative too. Only a document whose filename
ends in `-spec.md` may be cited by code.

Filenames carry the classification, so it survives a file being separated from its directory:
`-spec.md` binds the implementation, `-procedure.md` binds an operator, `-requirement.md` binds
document authors, `-decision.md` binds nobody.

## Requirement-ID prefixes

Every prefix resolves to exactly one document.

| Prefix | Document | Covers |
|---|---|---|
| `R-COL-*` | `turbo-collection-spec.md` | collection invariants |
| `R-SRC-*` | `turbo-collection-spec.md` | import |
| `R-TGT-*` | `turbo-collection-spec.md` | storage (the prefix dates from when a copy was called a target) |
| `R-MIRROR-*` | `turbo-collection-spec.md` | mirror semantics |
| `R-INT-*` | `turbo-collection-spec.md` | integrity and fixity |
| `R-NAME-*` | `turbo-collection-spec.md` | filename safety |
| `R-REC-*` | `turbo-collection-spec.md` | when a receipt is written, and what it may be taken to prove |
| `R-CFG-*` | `turbo-collection-spec.md` | configuration |
| `R-LOG-*` | `turbo-collection-spec.md` | logging |
| `R-CLI-*` | `turbo-collection-spec.md` | command line and operations |
| `R-VER-*` | `turbo-collection-spec.md` | this specification's version, and version stamps |
| `R-MFILE-*` | `meta-file-spec.md` | every meta file's name, place, and contents |
| `R-PHOTO-*` | `photo-path-layout-spec.md` | photo layout |
| `R-FOUND-*` | `as-found-path-layout-spec.md` | as-found layout |
| `R-INPLACE-*` | `import-sources/in-place/in-place-import-source-spec.md` | files already inside a copy, taken in where they sit |
| `R-SET-*` | `procedures/turbo-collection-setup-procedure.md` | buying, labeling and filling drives, once |
| `R-IMP-*` | `procedures/turbo-collection-import-procedure.md` | getting photos off an import source into a collection |
| `R-BAK-*` | `procedures/turbo-collection-backup-procedure.md` | bringing the home copy up to date |
| `R-OFF-*` | `procedures/turbo-collection-offsite-procedure.md` | bringing the off-site copy up to date |
| `R-REL-*` | `procedures/turbo-collection-release-procedure.md` | destroying a copy held outside a collection |
| `R-LANG-*` | `language-requirement.md` | how a normative document is written |
| `R-PUB-*` | `version-requirement.md` | how a normative document is versioned and published |
| `R-META-*` | `traceability-requirement.md` | how documents, requirements, and code trace to one another |
| `R-DUR-*` | `durability-requirement.md` | durability axioms every specification and design must satisfy |

Not yet assigned: the iCloud and local-folder import source specifications under
`specs/import-sources/` are stubs, and each states that its prefix is unassigned. No album layout specification exists yet.

## Map of the core specification

| Section | Covers |
|---|---|
| 0 | Conventions |
| 1 | Scope, non-goals, and why invocation is external |
| 2 | Two Turbo-Collection-specific principles (the project-wide axioms are now `R-DUR`) |
| 3 | Terminology, self-contained |
| 4 | Collection invariants, which outrank everything else |
| 5 | Import |
| 6 | Storage |
| 7 | Preservation requirements: mirroring, integrity, filename safety, receipts |
| 8 | Operation: configuration, logging, command line, and the distinct read-only inspections |
| 9 | This specification's own version, and version stamps |
| 10 | Extension points: what each deferred goal would cost |
| 11 | Contracts, summarized in tables |
| 12 | Current bindings. Volatile by design |
| 13 | Conformance, in both directions |

Section 12 is the only section expected to change as tools change. Nothing above it depends on any
entry in it. Dated assumptions those bindings rest on are kept in
[`design-record.md`](design-record.md) Section 13.

## Where to start

Reading the whole core specification takes an hour and is the honest answer for an implementer.
Otherwise:

- **What is this project?** [`../README.md`](../README.md), then [`design-record.md`](design-record.md) sections 1 to 4.
- **Why is it built this way?** [`design-record.md`](design-record.md), then [`decisions/`](decisions/) for anything decided since.
- **What am I allowed to build?** Core specification sections 4 to 8, then section 11 for contracts.
- **What does a file on a drive mean?** [`../specs/meta-file-spec.md`](../specs/meta-file-spec.md) for manifests, receipts and configuration; a layout specification for where content sits.
- **How do I get photos out of a vendor?** The specification for that import source, paired with its procedure.
- **How do I change a normative document?** [`../specs/language-requirement.md`](../specs/language-requirement.md) for wording, [`../specs/version-requirement.md`](../specs/version-requirement.md) for numbering and publication.
