# An import source's specification is an importer specification, named for its kind

**Status:** Accepted **Date:** 2026-11-22

An import source's specification is an _importer specification_, named
`<import-source>-importer-spec.md` as a layout's is `<layout>-layout-spec.md`:
`specs/importers/local-folder/local-folder-importer-spec.md`. A procedure under
`specs/importers/` is `<import-source>-importer-procedure.md`, such as
`icloud-importer-procedure.md`, and each title follows that pattern:
"Turbo-Collection: Local Folder Importer Specification" and "Turbo-Collection:
iCloud Importer Procedure". Prose says _importer specification_ wherever it
means one, a possessive included: "its importer specification states", never
"that import source's specification states".

**A specification is named for what it binds.** An importer specification binds
Turbo-Collection's implementation: which files an Importer takes in, and which
Supplied path it gives each (`R-LOCALFOLDER-3`, `R-LOCALFOLDER-6`). An import
source is an outside origin, and nothing binds it.

**One pattern names each family.** Layouts and importers each have a directory
named for their kind, holding `<name>-<kind>-spec.md` files, and
`specs/importer-spec.md` heads importers' family. A filename read alone says
what its document is about and which kind of document it is.

**No meta file changes.** A manifest's `importSource` field and its `specId`
values, such as `local-folder`, stay as they are, for a reason
[the import-source decision](2026-11-14-import-source-decision.md) gives: a
receipt is read without a specification beside it. Only prose describing them
changed.

**iCloud has a procedure and no specification.** In this version iCloud is not
an import source: its procedure copies photos out of iCloud into a folder, and
an import from local-folder takes that folder in
([the import-source decision](2026-11-14-import-source-decision.md)). Only that
procedure says so. An iCloud importer specification is written once an iCloud
importer exists.

Procedures in `specs/procedures/` keep their `turbo-collection-` prefix, and
`R-ICLOUD-*` keeps its prefix, since a requirement ID is never renumbered to
match a rename.

## Rejected

- **`<import-source>-import-source-spec.md`**, as local-folder's was named. It
  matched meta file wording and moved one file fewer, but it names a
  specification for an outside origin rather than for what it binds.
- **`turbo-collection-<import-source>-spec.md`**, as iCloud's stub was named. It
  does not say which kind of specification it is.
- **"Import source specification" in prose beside an `-importer-spec.md`
  filename.** One kind of document would carry two names, one in its filename
  and one in its prose.
- **A possessive such as "its importer's specification".** A search for
  _importer specification_ would miss it.
- **An iCloud importer specification of one line, pointing at local-folder's.**
  It would bind no code, and it could not meet `R-SRC-15`, which asks every
  importer specification for its import's primary layout.

## Touches

Renamed, each with its title: `local-folder-import-source-spec.md` to
`local-folder-importer-spec.md`, and `turbo-collection-icloud-procedure.md` to
`icloud-importer-procedure.md`. Cut: `turbo-collection-icloud-spec.md`, a stub
stating no requirement. `import-spec.md`: `R-SRC-15`'s example no longer has an
iCloud import. Every citation of those files, in specifications, `docs/` and
code: `scripts/versions.ts` (`LocalFolderImporterSpecVersion`, so a run's log
records `local-folder-importer-spec`), `scripts/import.ts`,
`scripts/local-folder-importer.ts` and `samples/`. Prose term: every
specification and procedure that used it, `docs/spec-guide.md`,
`docs/design-record.md`, `README.md`, and every decision record that used it. No
requirement ID changed.
