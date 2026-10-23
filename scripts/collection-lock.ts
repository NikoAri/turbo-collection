import { NamedMutex } from "./helpers/named-mutex.ts";
import { TcError } from "./helpers/tc-error.ts";
import type { TcConfig } from "./meta-files.ts";

// A collection's lock on this computer, which every run but init holds while
// it reads or writes a copy of that collection (parallel-safety-spec.md
// R-PARALLEL-4). It is a NamedMutex named for its collection's ID.

// Locks `tcConfig`'s collection, without waiting. Where another run holds its
// lock, this is an error at once, naming that collection and saying that
// run's process ID is not known (R-PARALLEL-5). NamedMutex confirms that lock
// is held before this returns (R-PARALLEL-7). Hold what it returns with
// `await using`.
export async function takeCollectionLock(
  tcConfig: TcConfig,
): Promise<NamedMutex> {
  const collectionLock = await NamedMutex.take(tcConfig.collectionId);
  if (collectionLock === undefined) {
    throw new TcError(
      `Another run on this computer is using the collection "${tcConfig.collectionName}" (${tcConfig.collectionId}); its process ID is not known. Run again once it has ended.`,
    );
  }
  return collectionLock;
}
