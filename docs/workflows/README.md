# Workflows

End-to-end walkthroughs: what you do, in order, to get a job done.

A workflow binds nothing. It is a readable path through obligations that live elsewhere, and every
step here that carries a safety consequence names the requirement that actually binds it. That
citation is the point. Without it a walkthrough drifts away from the rule it depends on, and nothing
catches the drift.

| Where a thing lives | What it holds |
|---|---|
| `specs/turbo-collection-spec.md` | what the software owes |
| `specs/turbo-collection-procedure.md` | what an operator owes, as `R-OP-*` |
| `docs/workflows/` | the order you do it in |
| `docs/design-record.md` | why any of it is shaped this way |

**Status, 2026-08-01:** `turbo-collection-procedure.md` does not exist yet, so the safety steps below
cite nothing. Every step marked **[unbacked]** is a rule this project intends to state and has not
stated. Treat those as the author's judgment rather than as a project guarantee until the citation
appears.

| Workflow | Performable today without code |
|---|---|
| [Freeing iCloud storage](freeing-icloud-storage-workflow.md) | yes, manually |
