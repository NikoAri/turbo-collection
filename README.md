# turbo-collection

An open, CLI-first system for preserving personal photos and videos for decades, not just backing
them up for a subscription cycle.

The core idea: separate your data from your tools. Photos live as plain files in a plain folder
tree — no database, no proprietary container, nothing that requires a specific app or company to
stay in business. A thin, swappable orchestrator (today: [rclone](https://rclone.org/) + a
SHA-256 integrity manifest) mirrors them to external storage and verifies nothing has silently
rotted. If any piece dies, the plain file tree survives and the tool gets swapped.

**Status:** design complete, implementation not started yet.

Read [`PLAN.md`](PLAN.md) for the full design record: goals, what was rejected and why,
architecture, technology choices, a decades-scale migration analysis, and the operations runbook.
It's written to be self-contained, so a future session (human or AI) can pick up the project from
that document alone.

## License

MIT — see [`LICENSE`](LICENSE).
