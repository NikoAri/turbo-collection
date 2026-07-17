# turbo-collection

An open, CLI-first system for preserving personal photos and videos for decades, not just backing
them up for a subscription cycle.

The core idea: separate your data from your tools. Photos live as plain files in a plain folder
tree: no database, no proprietary container, nothing that requires a specific app or company to
stay in business. A thin, swappable orchestrator (today: [rclone](https://rclone.org/) + a
SHA-256 integrity manifest) mirrors them to external storage and verifies nothing has silently
rotted. If any piece dies, the plain file tree survives and the tool gets swapped.

**Status:** design record and core specification (draft) written; implementation not started yet.

Three documents carry the project, each with one job:

- [`docs/spec.md`](docs/spec.md): the normative specification, **what** must be true. The
  language-neutral source of truth from which the tests and the implementation are generated,
  and regenerated, in the way an RFC outlives any single implementation of a protocol.
- [`docs/plan.md`](docs/plan.md): the design record, **why**. Goals, what was rejected and why,
  architecture, technology choices, a decades-scale migration analysis, and the operations
  runbook. Self-contained, so a future session (human or AI) can pick up the project from it.
- [`docs/language-requirement.md`](docs/language-requirement.md): the authoring standard, **how
  the normative documents are written**, so their English stays interpretable across decades of
  language drift.

## License

MIT; see [`LICENSE`](LICENSE).
