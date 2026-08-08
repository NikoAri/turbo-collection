# Procedures are checklists, one per sitting, with no reasoning in them

**Status:** Accepted
**Date:** 2026-08-08

Five procedures exist under `specs/procedures/`, each covering one occasion when a person sits down
with a known set of drives plugged in:

| Document | Prefix | The sitting |
|---|---|---|
| `turbo-collection-setup-procedure.md` | `R-SET-*` | Once. Buy drives, label, fill. |
| `turbo-collection-import-procedure.md` | `R-IMP-*` | Collection drive in. Pull from a source. |
| `turbo-collection-backup-procedure.md` | `R-BAK-*` | Collection drive plus a backup drive in. Mirror. |
| `turbo-collection-offsite-procedure.md` | `R-OFF-*` | Fetch the off-site drive. Mirror. Take it back. |
| `turbo-collection-release-procedure.md` | `R-REL-*` | Destroy a copy held outside the collection. |

## The three-layer split this settles

- **`specs/`**: what a human or a script does. Steps and obligations, nothing else.
- **`docs/`**: why. Decisions, rationale, evidence, walkthroughs.
- The private notes repository: exploration that serves the author and not a user.

A procedure states an act and links to a decision record. It carries no rationale of its own.

## Why one document per sitting

Import, mirror and off-site rotation are three different physical activities with different drives
attached, done at different frequencies. A person about to mirror should not scroll past instructions
for buying drives. Splitting by sitting also matches the architecture: import is the Source port,
backup and off-site are the Target port.

Release is separate because it is the only act that can destroy a photograph, and because it happens
at a different moment from any of the others.

## Most operator obligations turned out to be software obligations

A first draft made counting, checksum verification and target verification operator MUSTs. They are
work Turbo-Collection performs. What a person actually does is plug drives in, run something, read a
report, and decide whether to release.

So those obligations move to `turbo-collection-spec.md`, where the safe-to-delete report is already
queued, and the procedures shrink to what a person controls. Roughly 250 lines became five documents
totaling about 200, most of which is required version machinery.

## Counting stays a distinct obligation

A checksum proves that files present are intact and proves nothing about a file that never arrived,
because an absent file produces no mismatch. On 2026-07-23 an export of 47,508 items from Apple
Photos silently lost 35 files. R-IMP-5 keeps batches countable until export completeness at scale has
been measured, and the report R-REL-2 requires must state a count, not only checksums.

## Release generalizes the camera-card rule

A rule from 2026-07-25 gated formatting a memory card on an import receipt plus manifest
verification. That rule is not about cards. `R-REL-*` restates it for **release**: deleting from a
cloud account, formatting a card, erasing a phone, selling a device, letting a subscription lapse.
Card formatting and iCloud deletion are two instances of one rule.

## Rejected

- **One `turbo-collection-procedure.md`.** Drafted first and abandoned the same day. It mixed a
  one-time setup with recurring work, and mandated rationale beside every requirement, which made a
  checklist read like an essay.
- **Directory receipts as `R-LOG-*`.** `R-LOG-2` makes logs observability only, which would have
  made a release gate depend on something explicitly permitted to be absent.
- **Prices and models excluded from procedures.** A person standing in a store cannot act on an
  invariant. Concrete figures stay, carrying a date and an expiry.
- **A conflict between `R-META-4` and workflow citation.** Investigated and found not to exist:
  `R-META-4` restricts **code and tests** to `-spec.md`, and says nothing about a document citing a
  procedure.

## Touches

Adds `R-SET-*`, `R-IMP-*`, `R-BAK-*`, `R-OFF-*`, `R-REL-*`. Deletes the single-document draft and
its `R-OP-*` prefix, unpublished and uncited outside this repository. Six rows in
`docs/spec-guide.md`. Citations in `docs/workflows/freeing-icloud-storage-workflow.md`.

Owed: `language-requirement.md` R-LANG-5 and R-LANG-13 currently require every normative document to
carry its own terminology and to place rationale beside data-loss requirements. These procedures do
neither. Both rules exist so a document survives being separated from its repository, which is a
property of the specification that `R-VER-8` scatters onto drives, not of a checklist read at a desk.
Scoping them is a prerequisite for these documents to conform.
