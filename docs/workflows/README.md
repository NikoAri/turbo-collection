# Workflows

End-to-end walkthroughs: what you do, in order, to get a job done.

A workflow binds nothing. It is a readable path through obligations that live elsewhere, and every
step here that carries a safety consequence names the requirement that actually binds it. That
citation is the point. Without it a walkthrough drifts away from the rule it depends on, and nothing
catches the drift.

| Where a thing lives | What it holds |
|---|---|
| `specs/turbo-collection-spec.md` | what the software owes |
| `specs/procedures/` | what a person does, one document per sitting |
| `docs/workflows/` | the order you do it in |
| `docs/decisions/`, `docs/design-record.md` | why any of it is shaped this way |

**Status, 2026-08-08:** the procedures exist, and every `[unbacked]` marker below has been replaced
by a citation. Procedures assume Turbo-Collection exists and say "run it"; workflows here are the
by-hand stand-ins until it does.

| Workflow | Performable today without code |
|---|---|
| [Freeing iCloud storage](freeing-icloud-storage-workflow.md) | yes, manually |
