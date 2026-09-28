# Configuration lives in the copy root's `.turbo-collection/`, not loose at the root

**Status:** Accepted
**Date:** 2026-09-27
**Replaces** the config-placement half of the 2026-08-16 artifact-naming record (now deleted) and the
2026-08-29 choice to keep configuration at the copy root while other meta files moved into
`.turbo-collection/`. The conclusion reversed; why is below.

`turbo-collection-config.json` sits in a `.turbo-collection/` subdirectory of the copy root, beside
that copy's location receipts, not loose at the root (`R-MFILE-2`, `R-MFILE-17`). Everything
Turbo-Collection writes for itself now lives in a `.turbo-collection/` directory: one at the copy
root, holding configuration and location receipts, and one in each content directory, holding that
directory's manifest and receipts. That directory is itself the mark of a Turbo-Collection copy, the
way a `.git` directory marks a repository. What stays at the root is what a person reads or edits
directly: `README.md`, any carried specification, and `.tcignore`.

Configuration keeps its full `turbo-collection-config.json` name rather than the bare names its
neighbors carry (`manifest.json`, the `receipt-` files). The directory carrying the identity is why
the others need no prefix; configuration is the one exception, because it is the file a person seeks
out by name in an editor or a file manager, and the redundancy costs nothing.

## Why the reversal

The 2026-08-16 design split meta files by audience: files a person or a stranger should find sat at
the root with self-describing names, configuration among them, while machinery went into
`.turbo-collection/`. Two premises then shifted. Configuration collapsed to `{version, collectionName}`
once the [peer-model decision](2026-09-05-peer-model-decision.md) withdrew `role`, so it became
tool-identity rather than a file a person reads for orientation. And the copy root gained its own
`.turbo-collection/` for location receipts (`R-MFILE-26`), leaving configuration the lone copy-level
meta file outside it.

git settles it. git splits by the same audience axis but places a config-like file inside the
dot-directory: `.gitignore` lives in the working tree, `.git/config` inside `.git/`. Configuration
maps to `.git/config`; `.tcignore` and `README.md` map to the working-tree files. The objection that
a hidden directory fails a stranger is the convenience the
[future-reader assumption](2026-08-16-future-reader-decision.md) declines to buy: the file stays as
findable as `ls -a` makes it, and its self-description is untouched. Orientation for a person is
`README.md`'s job, and `README.md` stays at the root and points into `.turbo-collection/`.

## Rejected

- **Configuration at the copy root** (the prior decision). It left configuration the one copy-level
  meta file outside the `.turbo-collection/` the root already held, and rested a stranger's
  orientation on a `{version, collectionName}` file that never carried it. `README.md` does.
- **The bare name `config.json` inside the directory**, matching `manifest.json` and the `receipt-`
  files. Consistent, and what git does with `.git/config`, but configuration is the one meta file a
  person looks for by name, so its full name earns its keep where a redundant prefix would not.

## Touches

`R-MFILE-2` and `R-MFILE-17` amended: configuration sits in the root's `.turbo-collection/`. In
`meta-file-spec.md`, the Section 2 naming-and-placement rationale and the Section 4
covered-by-no-manifest note are rewritten, and a 2026-09-27 change-ledger row records the relocation
as MAJOR by that document's bump test, with the format stamp held because a draft is archived by
nothing (`version-requirement.md` R-PUB-3). The on-disk-names commentary in `turbo-collection-spec.md`
follows. The 2026-08-16 artifact-naming record is deleted, superseded on configuration by this
record, on the manifest by [the manifest-format decision](2026-08-16-manifest-format-decision.md), on
receipts by [the receipts decision](2026-09-07-receipts-decision.md), and on copy identity by
[the peer-model decision](2026-09-05-peer-model-decision.md); its "why a copy names itself" reasoning
remains in `R-MFILE-19`'s commentary. Both sample copies were updated on disk.
