import type { CopyContents, DirectoryContents } from "./copy-contents.ts";
import type { Manifest, ManifestEntry } from "./meta-files.ts";
import { pathKeyOf } from "./paths.ts";

// Mirroring (backup-spec.md Section 7.1): what a backup of two copies copies
// into each of them, and what it reports instead.
//
// Two paths that differ only in letter case or normalization are one path
// (turbo-collection-spec.md R-TGT-14), so a mirror matches names and
// directories by `pathKeyOf`, and writes into a copy at whichever spelling
// that copy already holds.

// One content file to copy into a directory: `from`, its name where it is
// copied from, and `entry`, what it is to be listed with where it goes. That
// entry holds every field of its entry in the copy it comes from, its `file`
// being its name where it goes (R-BACKUP-13, meta-file-spec.md R-MFILE-10).
export type FileCopying = {
  from: string;
  entry: ManifestEntry;
};

// What a mirror copies into one directory of a copy, from that directory in
// the other copy. `from` and `to` are its paths in each copy, which differ
// where those copies spell it differently.
export type DirectoryCopying = {
  from: string;
  to: string;
  // Each content file to copy (R-BACKUP-4)
  files: FileCopying[];
  // Name of each receipt file to copy (verify-spec.md R-REC-6, R-REC-9)
  receiptFiles: string[];
};

// What a mirror does in one of its two copies.
export type CopyPlan = {
  // Each directory to copy into
  directories: DirectoryCopying[];
  // Path of each content file here that no manifest lists, and that no file
  // of the other copy is written over (R-BACKUP-12)
  unlisted: string[];
  // Each set of paths here that are one path (R-TGT-14), at which nothing
  // is copied either way
  heldTwice: string[][];
};

// A path at which manifests of two copies list a content file with
// differing checksums (R-BACKUP-4), spelled as copy `a` spells it.
export type Difference = {
  path: string;
  a: ManifestEntry;
  b: ManifestEntry;
};

// A directory whose manifests in two copies name another Layout or another
// Import Source (R-BACKUP-14), spelled as copy `a` spells it.
export type Mismatch = {
  path: string;
  a: Manifest;
  b: Manifest;
};

// What a mirror of copies `a` and `b` does, and what it reports.
export type MirrorPlan = {
  a: CopyPlan;
  b: CopyPlan;
  differing: Difference[];
  mismatched: Mismatch[];
};

// One directory as one copy holds it: `path`, where it is in that copy, or
// is to go where that copy does not hold it, and what it holds there.
type DirectorySide = {
  path: string;
  contents: DirectoryContents;
};

// What a copy holds in a directory it does not have.
const Absent: DirectoryContents = {
  files: new Set(),
  manifest: undefined,
  receiptFiles: [],
};

// Plans a mirror of copies whose contents are `a` and `b`. A copy holds a
// content file only where that file is at its path and its directory's
// manifest lists it (R-BACKUP-4), so a file that one copy has lost, while
// its manifest still lists it, is copied back from the other copy where
// that copy's manifest states the same checksum. Only what a copy lacks is
// copied, so copies in agreement have nothing copied (R-BACKUP-7).
export function planMirror(a: CopyContents, b: CopyContents): MirrorPlan {
  const plan: MirrorPlan = {
    a: { directories: [], unlisted: [], heldTwice: [] },
    b: { directories: [], unlisted: [], heldTwice: [] },
    differing: [],
    mismatched: [],
  };
  const directoriesA = groupByKey(a.directories.keys(), (path) => path);
  const directoriesB = groupByKey(b.directories.keys(), (path) => path);
  const placeInA = placer(directoriesA);
  const placeInB = placer(directoriesB);

  for (const key of new Set([...directoriesA.keys(), ...directoriesB.keys()])) {
    const pathsA = directoriesA.get(key) ?? [];
    const pathsB = directoriesB.get(key) ?? [];
    if (pathsA.length > 1) {
      plan.a.heldTwice.push(pathsA);
    }
    if (pathsB.length > 1) {
      plan.b.heldTwice.push(pathsB);
    }
    const [pathA] = pathsA;
    const [pathB] = pathsB;
    if (pathsA.length > 1 || pathsB.length > 1) {
      // Nothing is copied at such a path, and each file in it that no
      // manifest lists is still reported (R-BACKUP-12)
      for (const [copyPlan, paths, contents] of [
        [plan.a, pathsA, a],
        [plan.b, pathsB, b],
      ] as const) {
        for (const path of paths) {
          const side = { path, contents: contents.directories.get(path)! };
          copyPlan.unlisted.push(...unlistedIn(side, []));
        }
      }
      continue;
    }
    planDirectory(
      plan,
      pathA === undefined
        ? { path: placeInA(pathB!), contents: Absent }
        : { path: pathA, contents: a.directories.get(pathA)! },
      pathB === undefined
        ? { path: placeInB(pathA!), contents: Absent }
        : { path: pathB, contents: b.directories.get(pathB)! },
    );
  }
  return plan;
}

// Adds to `plan` what a mirror does in one directory, which copy `a` holds
// as `inA` and copy `b` as `inB`.
function planDirectory(
  plan: MirrorPlan,
  inA: DirectorySide,
  inB: DirectorySide,
): void {
  const intoA: DirectoryCopying = {
    from: inB.path,
    to: inA.path,
    files: [],
    receiptFiles: [],
  };
  const intoB: DirectoryCopying = {
    from: inA.path,
    to: inB.path,
    files: [],
    receiptFiles: [],
  };
  const manifestA = inA.contents.manifest;
  const manifestB = inB.contents.manifest;
  if (
    manifestA !== undefined &&
    manifestB !== undefined &&
    !haveOneProvenance(manifestA, manifestB)
  ) {
    plan.mismatched.push({ path: inA.path, a: manifestA, b: manifestB });
  } else {
    planContentFiles(plan, inA, inB, intoA, intoB);
    intoA.receiptFiles = receiptFilesLacking(inB.contents, inA.contents);
    intoB.receiptFiles = receiptFilesLacking(inA.contents, inB.contents);
  }

  plan.a.unlisted.push(...unlistedIn(inA, intoA.files));
  plan.b.unlisted.push(...unlistedIn(inB, intoB.files));
  for (const [copyPlan, copying] of [
    [plan.a, intoA],
    [plan.b, intoB],
  ] as const) {
    if (copying.files.length > 0 || copying.receiptFiles.length > 0) {
      copyPlan.directories.push(copying);
    }
  }
}

// Whether manifests `a` and `b` of one directory name one Layout and one
// Import Source. Versions are not compared, since an import into a
// directory stamps it with its own version (import-spec.md R-SRC-16).
function haveOneProvenance(a: Manifest, b: Manifest): boolean {
  return (
    a.layout.specId === b.layout.specId &&
    a.importSource.specId === b.importSource.specId
  );
}

// Adds to `intoA` and `intoB` each content file listed in one directory
// that one copy holds and the other does not, and to `plan` each file whose
// manifests state two checksums, or which a copy holds in two spellings.
function planContentFiles(
  plan: MirrorPlan,
  inA: DirectorySide,
  inB: DirectorySide,
  intoA: DirectoryCopying,
  intoB: DirectoryCopying,
): void {
  const entriesA = groupByKey(
    inA.contents.manifest?.files ?? [],
    (entry) => entry.file,
  );
  const entriesB = groupByKey(
    inB.contents.manifest?.files ?? [],
    (entry) => entry.file,
  );
  const filesA = groupByKey(inA.contents.files, (name) => name);
  const filesB = groupByKey(inB.contents.files, (name) => name);

  for (const key of new Set([...entriesA.keys(), ...entriesB.keys()])) {
    const listedA = entriesA.get(key) ?? [];
    const listedB = entriesB.get(key) ?? [];
    const atA = filesA.get(key) ?? [];
    const atB = filesB.get(key) ?? [];
    const twiceInA = spellingsHeldTwice(inA.path, listedA, atA);
    const twiceInB = spellingsHeldTwice(inB.path, listedB, atB);
    if (twiceInA !== undefined) {
      plan.a.heldTwice.push(twiceInA);
    }
    if (twiceInB !== undefined) {
      plan.b.heldTwice.push(twiceInB);
    }
    if (twiceInA !== undefined || twiceInB !== undefined) {
      continue;
    }

    const [entryA] = listedA;
    const [entryB] = listedB;
    const [nameA] = atA;
    const [nameB] = atB;
    if (
      entryA !== undefined &&
      entryB !== undefined &&
      entryA.checksum !== entryB.checksum
    ) {
      plan.differing.push({
        path: pathOf(inA.path, entryA.file),
        a: entryA,
        b: entryB,
      });
      continue;
    }
    const aHolds = entryA !== undefined && nameA !== undefined;
    const bHolds = entryB !== undefined && nameB !== undefined;
    if (aHolds && !bHolds) {
      intoB.files.push({
        from: nameA,
        entry: { ...entryA, file: nameB ?? entryB?.file ?? nameA },
      });
    } else if (bHolds && !aHolds) {
      intoA.files.push({
        from: nameB,
        entry: { ...entryB, file: nameA ?? entryA?.file ?? nameB },
      });
    }
  }
}

// Paths of what a directory at `directoryPath` holds in two spellings or
// more under one key, `listed` being its manifest's entries under that key
// and `at` its files' names: undefined where it holds one at most.
function spellingsHeldTwice(
  directoryPath: string,
  listed: readonly ManifestEntry[],
  at: readonly string[],
): string[] | undefined {
  if (listed.length <= 1 && at.length <= 1) {
    return undefined;
  }
  const names = new Set([...listed.map((entry) => entry.file), ...at]);
  return [...names].map((name) => pathOf(directoryPath, name));
}

// Paths of content files in `side` that its manifest does not list, and
// that none of `writtenOver` is copied over: an error, and copied nowhere
// (R-BACKUP-12).
function unlistedIn(
  side: DirectorySide,
  writtenOver: readonly FileCopying[],
): string[] {
  const listedOrWrittenOver = new Set([
    ...(side.contents.manifest?.files ?? []).map((entry) =>
      pathKeyOf(entry.file),
    ),
    ...writtenOver.map((file) => pathKeyOf(file.entry.file)),
  ]);
  return [...side.contents.files]
    .filter((name) => !listedOrWrittenOver.has(pathKeyOf(name)))
    .map((name) => pathOf(side.path, name));
}

// Names of receipt files `from` holds that `to` lacks (verify-spec.md
// R-REC-6).
function receiptFilesLacking(
  from: DirectoryContents,
  to: DirectoryContents,
): string[] {
  const held = new Set(to.receiptFiles.map(pathKeyOf));
  return from.receiptFiles.filter((name) => !held.has(pathKeyOf(name)));
}

// `items` grouped under the key of each one's name, which `nameOf` gives
// (R-TGT-14).
function groupByKey<T>(
  items: Iterable<T>,
  nameOf: (item: T) => string,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = pathKeyOf(nameOf(item));
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, [item]);
    } else {
      group.push(item);
    }
  }
  return groups;
}

// Where in a copy each directory of the other copy goes, that copy's own
// directories being `directories`, grouped by key: at a spelling that copy
// holds, and otherwise under where its parent goes, by its own name
// (R-TGT-14). Each place it gives a directory that copy does not hold is
// kept, so that two spellings of one path go to one place.
function placer(
  directories: ReadonlyMap<string, readonly string[]>,
): (directoryPath: string) => string {
  const placed = new Map<string, string>();
  const place = (directoryPath: string): string => {
    if (directoryPath === "") {
      return "";
    }
    const key = pathKeyOf(directoryPath);
    const held = directories.get(key);
    if (held !== undefined) {
      return held.includes(directoryPath) ? directoryPath : held[0]!;
    }
    let placement = placed.get(key);
    if (placement === undefined) {
      const slash = directoryPath.lastIndexOf("/");
      placement = pathOf(
        slash === -1 ? "" : place(directoryPath.slice(0, slash)),
        directoryPath.slice(slash + 1),
      );
      placed.set(key, placement);
    }
    return placement;
  };
  return place;
}

// Path of `name` in a directory at `directoryPath` of a copy.
function pathOf(directoryPath: string, name: string): string {
  return directoryPath === "" ? name : `${directoryPath}/${name}`;
}
