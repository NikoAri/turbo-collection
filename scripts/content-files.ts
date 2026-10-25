import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  closeSync,
  fsyncSync,
  openSync,
  readSync,
  statSync,
  writeSync,
} from "node:fs";

// Reading and writing a content file: its checksum, and a copy of it written
// into a copy.

// How much of a file is read and written at a time.
const ChunkSize = 1024 * 1024;

// `file`'s SHA-256 checksum, in lower-case hexadecimal (meta-file-spec.md
// R-MFILE-8, R-MFILE-10).
export function checksumOf(file: string): string {
  const hash = createHash("sha256");
  const descriptor = openSync(file, "r");
  try {
    const buffer = Buffer.alloc(ChunkSize);
    let bytesRead: number;
    while ((bytesRead = readSync(descriptor, buffer)) > 0) {
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    closeSync(descriptor);
  }
  return hash.digest("hex");
}

// Copies a file at `from` to `to`, writing over a file there, and returns a
// length and a checksum of what it wrote, once that is on its drive, so that
// what is read once is both written and checked. Returns undefined where
// `from` changed in size or modification time while it was read; what was
// written stays, a file no manifest lists (turbo-collection-spec.md
// R-TGT-13).
export function copyAndChecksum(
  from: string,
  to: string,
): { size: number; checksum: string } | undefined {
  const before = statSync(from);
  const hash = createHash("sha256");
  let size = 0;
  const input = openSync(from, "r");
  try {
    const output = openSync(to, "w");
    try {
      const buffer = Buffer.alloc(ChunkSize);
      let bytesRead: number;
      while ((bytesRead = readSync(input, buffer)) > 0) {
        hash.update(buffer.subarray(0, bytesRead));
        // A write may take fewer bytes than it is given.
        let offset = 0;
        while (offset < bytesRead) {
          offset += writeSync(output, buffer, offset, bytesRead - offset);
        }
        size += bytesRead;
      }
      fsyncSync(output);
    } finally {
      closeSync(output);
    }
  } finally {
    closeSync(input);
  }
  const after = statSync(from);
  if (
    after.size !== before.size ||
    after.mtimeMs !== before.mtimeMs ||
    size !== before.size
  ) {
    return undefined;
  }
  return { size, checksum: hash.digest("hex") };
}

// Whether `error` says that a copy at `copyRoot` cannot be written at all:
// its drive gone, read-only or full (import-spec.md R-SRC-26, backup-spec.md
// R-BACKUP-8).
export function isCopyUnwritable(error: unknown, copyRoot: string): boolean {
  const code = (error as NodeJS.ErrnoException).code;
  if (code === "ENOSPC" || code === "EROFS") {
    return true;
  }
  try {
    return statSync(copyRoot, { throwIfNoEntry: false }) === undefined;
  } catch {
    return true;
  }
}
