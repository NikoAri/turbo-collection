# turbo-collection

An open, CLI-first system for preserving personal photos and videos for decades, not just backing
them up for a subscription cycle.

The core idea: separate your data from your tools. Photos live as plain files in a plain folder
tree: no database, no proprietary container, nothing that requires a specific app or company to
stay in business. A thin, swappable orchestrator (today: [rclone](https://rclone.org/) + a
SHA-256 integrity manifest) mirrors them to external storage and verifies nothing has silently
rotted. If any piece dies, the plain file tree survives and the tool gets swapped.

The point of that is not only survival. Once photos are in the collection and verified, **you** can
delete them from iCloud or from your phone and stop paying for that storage. Turbo-Collection never
deletes anything, anywhere: not at a source, not in the collection, not at a backup target. Every
deletion is your decision, taken against evidence the tool gives you.

**Status:** design record and core specification (draft) written; implementation not started yet.

Each document has one job:

- [`specs/turbo-collection-spec.md`](specs/turbo-collection-spec.md): the core normative
  specification, **what** must be true. The language-neutral source of truth from which the tests
  and the implementation are generated, and regenerated, in the way an RFC outlives any single
  implementation of a protocol.
- [`specs/import-sources/`](specs/import-sources/): one specification per **import source** a photo
  can come in by, each paired with the procedures a human follows to import from it. The core spec is
  normative over things this project controls; an import source specification is normative over
  things a vendor controls, so it carries dated evidence and expiry dates rather than stable
  promises.
- [`specs/language-requirement.md`](specs/language-requirement.md): an authoring standard, **how a
  normative document is written**, so its English stays interpretable across decades of language
  drift. It is about documents rather than about turbo-collection, which is why it carries no
  project prefix.
- [`specs/version-requirement.md`](specs/version-requirement.md): an authoring standard, **how a
  normative document is numbered, published, archived, and corrected**, so that a version stamp
  resolves to exactly one text forever. No project prefix, for the same reason.
- [`docs/design-record.md`](docs/design-record.md): the design record, **why**. Goals, what was
  rejected and why, architecture, technology choices, a decades-scale migration analysis, and an
  operations runbook.
- [`docs/decisions/`](docs/decisions/): one dated record per decision taken since 2026-08-01,
  each carrying what was decided, why, and which alternatives lost.
- [`docs/spec-guide.md`](docs/spec-guide.md): a reader's guide. Which document covers what, which
  requirement-ID prefix belongs to which document, and where to start.

**The filename states the kind, so it survives being separated from its path:**

| Pattern             | Binds              | Executed by | May code cite it    |
| ------------------- | ------------------ | ----------- | ------------------- |
| `*-spec.md`         | the implementation | machine     | yes, and only these |
| `*-procedure.md`    | the operator       | human       | no                  |
| anything in `docs/` | nothing            | n/a         | no                  |

Directories group by topic; the name carries the classification. A top-level `superseded/`
directory will hold the frozen terminal text of each superseded specification line once one
exists.

## License

MIT; see [`LICENSE`](LICENSE).
