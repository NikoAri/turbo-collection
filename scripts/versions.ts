import packageJson from "./package.json" with { type: "json" };

// The versions a run records (logging-spec.md R-LOG-3) and a version report states
// (turbo-collection-core-spec.md R-CLI-16).

// The Turbo-Collection version, which is this package's.
export const TurboCollectionVersion: string = packageJson.version;

// The version of meta-file-spec.md that a meta file written by this code states (R-MFILE-4).
export const MetaFileSpecVersion = "0.1.0-draft";

// A version stamp (turbo-collection-spec.md R-VER-18) for every specification this code conforms
// to. A draft has no publication date, so its stamp is the name and the number alone.
export const SpecificationVersionStamps: readonly string[] = [
  "turbo-collection-spec 0.1.0-draft",
  `meta-file-spec ${MetaFileSpecVersion}`,
  "photo-path-layout-spec 0.1.0-draft",
  "as-found-path-layout-spec 0.1.0-draft",
  "local-folder-import-source-spec 0.1.0-draft",
];
