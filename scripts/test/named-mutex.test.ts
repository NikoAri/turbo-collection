import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import process from "node:process";
import { createInterface } from "node:readline";
import { test, type TestContext } from "node:test";
import { URL } from "node:url";

import { NamedMutex } from "../helpers/named-mutex.ts";

// Each test takes mutexes of names of its own, so that no test meets another's mutex, nor a run's,
// which is named for a collection's ID.

// Starts a process that takes the mutex named `name` and holds it until it is ended, and returns
// that process once it holds the mutex. The test ends it, where the test has not already.
async function holdInAnotherProcess(
  t: TestContext,
  name: string,
): Promise<ChildProcess> {
  const namedMutexUrl = new URL("../helpers/named-mutex.ts", import.meta.url);
  const code = [
    `import console from "node:console";`,
    `import { setInterval } from "node:timers";`,
    `import { NamedMutex } from ${JSON.stringify(namedMutexUrl.href)};`,
    `const mutex = await NamedMutex.take(${JSON.stringify(name)});`,
    `console.log(mutex === undefined ? "refused" : "held");`,
    // Keeps the process running, which on macOS nothing else does.
    `setInterval(() => {}, 60_000);`,
  ].join(" ");

  const holder = spawn(
    process.execPath,
    ["--input-type=module", "--eval", code],
    { stdio: ["ignore", "pipe", "inherit"] },
  );
  t.after(() => holder.kill("SIGKILL"));

  for await (const line of createInterface({ input: holder.stdout })) {
    assert.equal(line, "held");
    return holder;
  }

  throw new Error(`The process taking "${name}" ended before it held it.`);
}

test(
  "R-PARALLEL-5: a held mutex is not taken a second time, and take returns undefined at once",
  { timeout: 10_000 },
  async () => {
    await using first = await NamedMutex.take("test-held");
    assert.notEqual(first, undefined);

    await using second = await NamedMutex.take("test-held");
    assert.equal(second, undefined);
  },
);

test(
  "R-PARALLEL-6: a mutex whose process is killed outright is taken once that process has ended, and not before",
  { timeout: 10_000 },
  async (t) => {
    const holder = await holdInAnotherProcess(t, "test-killed");

    await using whileHeld = await NamedMutex.take("test-killed");
    assert.equal(whileHeld, undefined);

    holder.kill("SIGKILL");
    await once(holder, "exit");

    await using afterwards = await NamedMutex.take("test-killed");
    assert.notEqual(afterwards, undefined);
  },
);

test("R-PARALLEL-7: verifyHeld returns while the mutex is held", async () => {
  await using mutex = await NamedMutex.take("test-verified");
  assert.notEqual(mutex, undefined);

  await NamedMutex.verifyHeld("test-verified");
});

test("R-PARALLEL-7: verifyHeld throws where the mutex can be taken, and lets go of what it took", async () => {
  await assert.rejects(
    NamedMutex.verifyHeld("test-not-held"),
    /"test-not-held" failed: it was taken twice/,
  );

  await using afterwards = await NamedMutex.take("test-not-held");
  assert.notEqual(afterwards, undefined);
});

test("NamedMutex: a mutex let go as its block ends is taken again", async () => {
  {
    await using first = await NamedMutex.take("test-let-go");
    assert.notEqual(first, undefined);
  }

  await using again = await NamedMutex.take("test-let-go");
  assert.notEqual(again, undefined);
});

test("NamedMutex: mutexes of two names are held at the same time", async () => {
  await using one = await NamedMutex.take("test-one");
  await using other = await NamedMutex.take("test-other");
  assert.notEqual(one, undefined);
  assert.notEqual(other, undefined);
});
