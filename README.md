# turbo-collection

An open, CLI-first system for preserving personal photos and videos for decades, not just backing
them up for a subscription cycle.

The core idea: separate your data from your tools. Photos live as plain files in a plain folder
tree: no database, no proprietary container, nothing that requires a specific app or company to
stay in business. A thin, swappable orchestrator (today: [rclone](https://rclone.org/) + a
SHA-256 integrity manifest) mirrors them to external storage and verifies nothing has silently
rotted. If any piece dies, the plain file tree survives and the tool gets swapped.

**Status:** design record and core specification (draft) written; implementation not started yet.

Each document has one job:

- [`specs/turbo-collection-spec.md`](specs/turbo-collection-spec.md): the core normative
  specification, **what** must be true. The language-neutral source of truth from which the tests
  and the implementation are generated, and regenerated, in the way an RFC outlives any single
  implementation of a protocol.
- [`specs/sources/`](specs/sources/): one specification per **vendor surface** a photo can come
  from, each paired with the procedures a human follows to acquire from it. The core spec is
  normative over things this project controls; a source specification is normative over things a
  vendor controls, so it carries dated evidence and expiry dates rather than stable promises.
- [`docs/plan.md`](docs/plan.md): the design record, **why**. Goals, what was rejected and why,
  architecture, technology choices, a decades-scale migration analysis, and the operations
  runbook. Self-contained, so a future session (human or AI) can pick up the project from it.
- [`specs/language-requirement.md`](specs/language-requirement.md): the authoring standard, **how
  the normative documents are written**, so their English stays interpretable across decades of
  language drift. It is about documents rather than about turbo-collection, which is why it
  carries no project prefix.

**The filename states the kind, so it survives being separated from its path:**

| Pattern | Binds | Executed by | May code cite it |
|---|---|---|---|
| `*-spec.md` | the implementation | machine | yes, and only these |
| `*-procedure.md` | the operator | human | no |
| anything in `docs/` | nothing | n/a | no |

Directories group by topic; the name carries the classification. A top-level `superseded/`
directory will hold the frozen terminal text of each superseded specification line once one
exists.

## License

MIT; see [`LICENSE`](LICENSE).
