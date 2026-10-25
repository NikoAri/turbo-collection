import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, URL } from "node:url";

// A property of code rather than of a run: what a backup loads, read as
// text, so that a path no test reaches is covered too.

// `scripts/`, which this test reads.
const ScriptsDirectory = fileURLToPath(new URL("..", import.meta.url));

// Modules that open a network connection.
const NetworkModules = [
  "node:dgram",
  "node:dns",
  "node:http",
  "node:http2",
  "node:https",
  "node:net",
  "node:tls",
];

// A file that imports one of `NetworkModules` and opens no network
// connection with it, with that module: NamedMutex listens on a named pipe
// under Windows and on an abstract socket under Linux, both on one computer
// alone, which is the collection's lock (parallel-safety-spec.md
// R-PARALLEL-6).
const LocalOnly: Record<string, string> = {
  "helpers/named-mutex.ts": "node:net",
};

// Path relative to `scripts/` of each file that `entry` loads, itself
// included, following each import of a file under `scripts/`.
function filesLoadedBy(entry: string): string[] {
  const loaded = new Set<string>();
  const pending = [entry];
  while (pending.length > 0) {
    const file = pending.pop()!;
    if (loaded.has(file)) {
      continue;
    }
    loaded.add(file);
    const text = readFileSync(path.join(ScriptsDirectory, file), "utf8");
    for (const [, imported] of text.matchAll(/from "(\.\.?\/[^"]+)"/g)) {
      pending.push(path.posix.join(path.posix.dirname(file), imported!));
    }
  }
  return [...loaded].sort();
}

test("R-BACKUP-3: nothing a backup loads opens a network connection", () => {
  const found = filesLoadedBy("backup.ts").flatMap((file) => {
    const text = readFileSync(path.join(ScriptsDirectory, file), "utf8");
    return [
      ...NetworkModules.filter(
        (module) =>
          text.includes(`from "${module}"`) && LocalOnly[file] !== module,
      ),
      ...(/\bfetch\s*\(/.test(text) ? ["fetch"] : []),
    ].map((what) => `${file}: ${what}`);
  });

  assert.deepEqual(found, []);
});
