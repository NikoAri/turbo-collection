# The specification names concrete things, and has no ports

**Status:** Accepted
**Date:** 2026-10-05

**Replaces the vocabulary of [the peer-model decision](2026-09-05-peer-model-decision.md)**, which
kept a _Storage port_ after retiring _Target_. The peer model stands; the port does not.

A read of the core specification's glossary found several words doing no work, or the wrong work.
What survives:

- **Import source**: the outside origin where content lives, such as an iPhone, iCloud, a camera
  card, or an existing archive.
- **Importer**: the component that reads one import source and brings its content in.
- **Import**: the verb, and the operation.
- **Medium**: where a copy is stored, such as a local drive, a removable drive, or a cloud bucket.
  A copy's **storage** declares what its medium can guarantee.
- **Mirror engine**: the tool that brings copies into agreement.

**There is no bare "source".** The word alone reads as source code, and before this date it also
named a port, an adapter, and the origin, three things at once. Every use is now _import source_ or
_importer_.

**There are no ports and no adapters in the specification.** A port is a notion of how a program is
structured: an interface of the orchestrator core. That sits badly in a document whose own position
is that the orchestrator is small, disposable, and regenerable, and whose subject is data and
contracts. Of the five ports the specification had named, one was an interface that genuinely varies
(storage); the others were the mirror tool, a fixed hash, and plain infrastructure. So the
specification states **contracts** and names the concrete thing on each side of one.

_Ports and adapters_ remains the architecture described in
[`design-record.md`](../design-record.md) Section 5, as rationale. It is how the code is expected to
be shaped, and it is no longer vocabulary a requirement uses.

## Rejected

- **Renaming "adapter" to "importer" everywhere.** Most uses of _adapter_ were the storage side and
  the mirror tool, neither of which imports anything. The move is to concrete nouns, one per thing.
- **"Store" for a copy's storage.** It reads as the stored data, and invites the question of whether
  the store is the collection. It is neither the collection nor a copy, so the word was dropped.
- **Keeping the Storage port as the one surviving port.** One port is still a program-structure word
  in a document about data.
- **One name for a layout convention and a layout specification.** They stay two: a convention is a
  path rule, and a specification is the document that defines one and carries a version. They map
  one to one, which is why they feel redundant, and the meta files record both.

## Touches

`turbo-collection-spec.md`: the glossary loses _Port_, _Adapter_ and _Storage port_ and gains
_Medium_; Section 5 is _Import_ and Section 6 is _Storage_; the `R-SRC-*` and `R-TGT-*` bodies say
_importer_ and _a copy's storage_; Section 11 is _Contracts_; the scope diagram shows peer copies
without fixing how many. Requirement IDs are unchanged, so `R-SRC-*` and `R-TGT-*` keep prefixes that
no longer match a term (`language-requirement.md` `R-LANG-20`). `meta-file-spec.md`, both layout
specifications, the import source specifications, the procedures, `spec-guide.md` and `README.md`
were swept to match.
