import assert from "node:assert/strict";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";

import { TcError } from "../helpers/tc-error.ts";
import {
  dateOf,
  logError,
  logFileName,
  logRunEnd,
  logRunStart,
  makeRunDirectory,
  newRunId,
  RunLog,
  type LogEntry,
  type Logger,
} from "../run.ts";

// A new, empty directory under the system's temporary directory, removed when the test ends.
function temporaryDirectory(t: TestContext): string {
  const directory = realpathSync(
    mkdtempSync(path.join(tmpdir(), "turbo-collection-test-")),
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

// A logger that keeps each entry it is given, in order.
function collectingLogger(): Logger & { entries: LogEntry[] } {
  const entries: LogEntry[] = [];
  return { entries, log: (entry) => entries.push(entry) };
}

test("R-MFILE-13: a run ID is the instant in basic format, in UTC to the second, then four random lower-case hexadecimal digits", () => {
  const instant = new Date("2026-10-18T14:22:05.987Z");

  assert.match(newRunId(instant), /^20261018T142205Z-[0-9a-f]{4}$/);
});

test("R-MFILE-14: a date is ISO 8601 in UTC, to the second", () => {
  assert.equal(
    dateOf(new Date("2026-10-18T14:22:05.987Z")),
    "2026-10-18T14:22:05Z",
  );
});

test("R-LOG-6: a run makes its own directory, named by its ID, making the directories above it", (t) => {
  const runsDirectory = path.join(
    temporaryDirectory(t),
    "turbo-collection",
    "runs",
  );

  const { runId, runDirectory } = makeRunDirectory(runsDirectory);

  assert.equal(runDirectory, path.join(runsDirectory, runId));
  assert.deepEqual(readdirSync(runDirectory), []);
});

test("R-PARALLEL-1: where a run's directory is taken, the run takes another ID, and leaves that directory as it is", (t) => {
  const runsDirectory = temporaryDirectory(t);
  const taken = makeRunDirectory(runsDirectory, () => "20261015T215020Z-3b52");
  writeFileSync(path.join(taken.runDirectory, "held"), "another run's");
  const runIds = ["20261015T215020Z-3b52", "20261015T215020Z-9c01"];

  const { runId } = makeRunDirectory(runsDirectory, () => runIds.shift()!);

  assert.equal(runId, "20261015T215020Z-9c01");
  assert.deepEqual(readdirSync(taken.runDirectory), ["held"]);
});

test("R-LOG-6: a run's log is named tc-<runId>.log.json", () => {
  assert.equal(
    logFileName("20261018T142205Z-3f9a"),
    "tc-20261018T142205Z-3f9a.log.json",
  );
});

test("R-LOG-7, R-LOG-8: a log holds one JSON object to a line, each followed by a line feed, and each with its date first", (t) => {
  const file = path.join(temporaryDirectory(t), "tc-test.log.json");

  {
    using log = RunLog.create(file, false);
    log.log({ event: "first", verbose: true }, "first");
    log.log({ event: "second", verbose: true, note: "a\nb" }, "second");
  }

  const text = readFileSync(file, "utf8");
  assert.equal(text.includes("\r"), false);
  assert.equal(text.endsWith("\n"), true);
  const lines = text.slice(0, -1).split("\n");
  assert.equal(lines.length, 2);
  const entries = lines.map((line) => JSON.parse(line));
  assert.deepEqual(
    entries.map((entry) => entry.event),
    ["first", "second"],
  );
  assert.equal(entries[1].note, "a\nb");
  for (const entry of entries) {
    assert.equal(Object.keys(entry)[0], "date");
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  }
});

test("R-LOG-7: a log is created only where nothing is at its path", (t) => {
  const file = path.join(temporaryDirectory(t), "tc-test.log.json");
  writeFileSync(file, "another run's");

  assert.throws(() => RunLog.create(file, false), /EEXIST/);
  assert.equal(readFileSync(file, "utf8"), "another run's");
});

test("R-LOG-11: run-start is verbose, and records the versions, the command line, the system and the runtime", () => {
  const logger = collectingLogger();

  logRunStart(logger, ["init", "D:\\Photos"]);

  const [entry] = logger.entries;
  assert.equal(entry?.event, "run-start");
  assert.equal(entry?.verbose, true);
  assert.equal(entry?.version, "0.1.0");
  assert.ok(
    (entry?.specifications as string[]).includes(
      "turbo-collection-spec 0.1.0-draft",
    ),
  );
  assert.deepEqual(entry?.arguments, ["init", "D:\\Photos"]);
  assert.equal(typeof entry?.system, "string");
  assert.match(entry?.runtime as string, /^node \d+\.\d+\.\d+$/);
});

test("R-LOG-11: run-end is verbose where the run succeeded, and a failure that is not verbose otherwise", () => {
  const logger = collectingLogger();

  logRunEnd(logger, false);
  logRunEnd(logger, true);

  assert.deepEqual(logger.entries, [
    { event: "run-end", verbose: true },
    { event: "run-end", outcome: "failure" },
  ]);
});

test("R-LOG-12: an error entry is a failure holding the error's message and stack, and its cause", () => {
  const logger = collectingLogger();
  const cause = new Error("the lower error");

  logError(logger, new TcError("what went wrong", { cause }));

  const [entry] = logger.entries;
  assert.equal(entry?.event, "error");
  assert.equal(entry?.outcome, "failure");
  assert.equal(entry?.message, "what went wrong");
  assert.match(entry?.stack as string, /^TcError: what went wrong\n\s+at /);
  assert.deepEqual(
    (entry?.cause as { message: string }).message,
    "the lower error",
  );
});
