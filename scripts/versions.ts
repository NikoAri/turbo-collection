import packageJson from "./package.json" with { type: "json" };

// Versions a run records (logging-spec.md R-LOG-3) and a version report
// states (turbo-collection-core-spec.md R-CLI-16).

// Turbo-Collection's version, which is this package's.
export const TurboCollectionVersion: string = packageJson.version;

// meta-file-spec.md's version, which each meta file this code writes states
// (R-MFILE-4).
export const MetaFileSpecVersion = "0.1.0-draft";

// turbo-collection-spec.md's version, which a receipt states this code
// conformed to (meta-file-spec.md R-MFILE-14).
export const TurboCollectionSpecVersion = "0.1.0-draft";

// Versions of supplied-path layout and local-folder import source, which an
// import records in a manifest and an arrival (meta-file-spec.md R-MFILE-9,
// R-MFILE-15).
export const SuppliedPathLayoutSpecVersion = "0.1.0-draft";
export const LocalFolderImportSourceSpecVersion = "0.1.0-draft";

// A version stamp (turbo-collection-spec.md R-VER-18) for every specification
// this code conforms to, including a layout that no operation uses yet. A
// draft has no publication date, so its stamp is its name and number alone.
export const SpecificationVersionStamps: readonly string[] = [
  `turbo-collection-spec ${TurboCollectionSpecVersion}`,
  `meta-file-spec ${MetaFileSpecVersion}`,
  "photo-path-layout-spec 0.1.0-draft",
  `supplied-path-layout-spec ${SuppliedPathLayoutSpecVersion}`,
  `local-folder-import-source-spec ${LocalFolderImportSourceSpecVersion}`,
];
