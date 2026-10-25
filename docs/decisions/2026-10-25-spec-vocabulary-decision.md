# The specification names concrete things, and has no ports

**Status:** Accepted **Date:** 2026-10-25

**Replaces the 2026-10-06 record of this name**, adding _TC Copy_ for an
instance of a collection, where the specifications had said _Copy_, and _TC
Directory_ for its root directory. Why _Copy_ went is under Rejected.

**Replaces the vocabulary of
[the peer-model decision](2026-09-05-peer-model-decision.md)**, which kept a
_Storage port_ after retiring _Target_. The peer model stands; the port does
not.

A read of the core specification's glossary found several words doing no work,
or the wrong work. What survives:

- **Import source**: the outside origin where content lives, such as an iPhone,
  iCloud, a camera card, or an existing archive.
- **Importer**: the component that reads one import source and brings its
  content in.
- **Import**: the verb, and the operation.
- **TC Copy**: one instance of a collection, held on one medium; _TC_ stands for
  Turbo-Collection. Each TC Copy has a name of its own (`tcCopyName`).
- **TC Directory**: a TC Copy's root directory, which a command line names.
- **Medium**: where a TC Copy is stored, such as a local drive, a removable
  drive, or a cloud bucket. A TC Copy's **storage** reads and writes that TC
  Copy on its medium.
- **Mirror engine**: the tool that brings TC Copies into agreement.
- **Layout**: a rule that decides where a content file is stored. Each layout is
  defined by its own specification, and "layout specification" is plain English
  for that document, not a second term.

**There is no bare "source".** The word alone reads as source code, and until
2026-10-05 it also named a port, an adapter, and the origin, three things at
once. Every use is now _import source_ or _importer_.

**There is no bare "copy" for an instance.** _Copy_ is a verb throughout these
documents, since an import or a backup copies files, and an ordinary noun, as in
a copy of a specification carried on a drive, so as a term it read as either.
_TC Copy_ names an instance and _TC Directory_ names its root directory, one
word for each thing code already told apart (`copy` and `copyRoot`). In code
they are `tcCopy` and `tcDirectory`; a TC Copy's name is `tcCopyName`, init
takes it with `--tc-copy`, and a command line names a TC Directory as
`<tc-directory>`. The verb and the ordinary noun keep the plain word.

**There are no ports and no adapters in the specification.** A port is a notion
of how a program is structured: an interface of the orchestrator core. That sits
badly in a document whose own position is that the orchestrator is small,
disposable, and regenerable, and whose subject is data and contracts. Of the
five ports the specification had named, one was an interface that genuinely
varies (storage); the others were the mirror tool, a fixed hash, and plain
infrastructure. So the specification states **contracts** and names the concrete
thing on each side of one.

_Ports and adapters_ remains the architecture described in
[`design-record.md`](../design-record.md) Section 5, as rationale. It is how the
code is expected to be shaped, and it is no longer vocabulary a requirement
uses.

## Rejected

- **Renaming "adapter" to "importer" everywhere.** Most uses of _adapter_ were
  the storage side and the mirror tool, neither of which imports anything. The
  move is to concrete nouns, one per thing.
- **"Store" for a TC Copy's storage.** It reads as the stored data, and invites
  the question of whether the store is the collection. It is neither the
  collection nor a TC Copy, so the word was dropped.
- **Keeping the Storage port as the one surviving port.** One port is still a
  program-structure word in a document about data.
- **Two terms, _layout convention_ for a path rule and _layout specification_
  for the document that defines it.** Kept when this record was first written,
  and withdrawn the next day. The reason given then, that meta files record
  both, was wrong: a manifest records one identifier and one version
  (`R-MFILE-9`), and each layout specification called that same value its
  convention identifier. Two names for one identity had already leaked into the
  text, where a primary layout was defined as a specification and the
  supplied-path layout as a convention.
- **_Copy_ as the term**, kept on 2026-10-14 for want of a clearer word, and
  reversed on 2026-10-24: a word this generic reads as the verb or as any
  duplicate, and a reader of code and specification alike has to work out which
  is meant.
- **_Replica_.** Precise, a noun only, and not secondary, but it carries
  connotations of androids and cloning.
- **One word for both.** With _TC Directory_ alone, a TC Copy's name becomes
  `tcDirectoryName`, which reads as a folder's own name, and
  `--tc-directory off-site` looks like a path; with _TC Copy_ alone, a command
  line's directory has no name of its own.
- **_Backup_, _Peer Copy_ or _Target_ for an instance.** _Backup_ is an
  operation and the noun for one run of it
  ([the backup-naming decision](2026-10-22-backup-naming-decision.md)), _Peer
  Copy_ keeps the generic word, and _Target_ casts one peer as subordinate to
  another ([the peer-model decision](2026-09-05-peer-model-decision.md)).

## Touches

`turbo-collection-spec.md`: the glossary loses _Port_, _Adapter_ and _Storage
port_ and gains _Medium_; Section 5 is _Import_ and Section 6 is _Storage
layout_; the `R-SRC-*` and `R-TGT-*` bodies say _importer_ and _a TC Copy's
storage_; Section 11 is _Contracts_; the scope diagram shows peer TC Copies
without fixing how many. Requirement IDs are unchanged, so `R-SRC-*` and
`R-TGT-*` keep prefixes that no longer match a term (`language-requirement.md`
`R-LANG-20`). `meta-file-spec.md`, both layout specifications, the import source
specifications, the procedures, `spec-guide.md` and `README.md` were swept to
match. On 2026-10-06 the glossary's _Layout convention_ and _Layout
specification_ became _Layout_, each layout specification's _Convention
identifier_ became _Layout identifier_, and `meta-file-spec.md` `R-MFILE-9`,
`R-MFILE-15` and `R-MFILE-27` were reworded to match. On 2026-10-25 _Copy_
became _TC Copy_, with _TC Directory_ beside it, in every specification's
glossary and text; `copyName` became `tcCopyName` (`meta-file-spec.md`
`R-MFILE-18`), and code, samples and other records followed.
