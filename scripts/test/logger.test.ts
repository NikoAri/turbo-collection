import assert from "node:assert/strict";
import console from "node:console";
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
  createRunLog,
  defaultLogDirectory,
  logEntryOf,
  logger,
  logLeafFileName,
  RunLog,
  RunScope,
  type LogEntry,
} from "../logger.ts";

// A new, empty directory under `tmpdir()`, removed when test `t` ends.
function temporaryDirectory(t: TestContext): string {
  const directory = realpathSync(
    mkdtempSync(path.join(tmpdir(), "turbo-collection-test-")),
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

// Entries `logger` is given during test `t`, in order, an error as an `error`
// entry holding its message.
function collectEntries(t: TestContext): LogEntry[] {
  const entries: LogEntry[] = [];
  t.mock.method(logger, "log", (entry: LogEntry | string) =>
    entries.push(logEntryOf(entry)),
  );
  t.mock.method(logger, "error", (error: unknown) =>
    entries.push({
      event: "error",
      message: (error as Error).message,
      toString: () => "error",
    }),
  );
  return entries;
}

test("R-LOG-6: a run's log is named tc-<runId>.log.json", () => {
  assert.equal(
    logLeafFileName("20261018T142205Z-3f9a"),
    "tc-20261018T142205Z-3f9a.log.json",
  );
});

test("R-LOG-6: a run's log is created in turbo-collection/logs/ in the directory for temporary files, making the directories above it", (t) => {
  const temporary = temporaryDirectory(t);

  {
    using logger = createRunLog(
      defaultLogDirectory(temporary),
      false,
      () => "20261015T215020Z-3b52",
    );
    logger.log({ event: "first", verbose: true, toString: () => "first" });
  }

  const logDirectory = path.join(temporary, "turbo-collection", "logs");
  assert.deepEqual(readdirSync(logDirectory), [
    "tc-20261015T215020Z-3b52.log.json",
  ]);
  assert.match(
    readFileSync(
      path.join(logDirectory, "tc-20261015T215020Z-3b52.log.json"),
      "utf8",
    ),
    /"event":"first"/,
  );
});

test("R-PARALLEL-1: where a run's log is taken, the run takes another ID, and leaves that log as it is", (t) => {
  const logDirectory = temporaryDirectory(t);
  const taken = path.join(logDirectory, "tc-20261015T215020Z-3b52.log.json");
  writeFileSync(taken, "another run's");
  const runIds = ["20261015T215020Z-3b52", "20261015T215020Z-9c01"];

  {
    using logger = createRunLog(logDirectory, false, () => runIds.shift()!);
    logger.log({ event: "first", verbose: true, toString: () => "first" });
  }

  assert.deepEqual(readdirSync(logDirectory).sort(), [
    "tc-20261015T215020Z-3b52.log.json",
    "tc-20261015T215020Z-9c01.log.json",
  ]);
  assert.equal(readFileSync(taken, "utf8"), "another run's");
  assert.match(
    readFileSync(
      path.join(logDirectory, "tc-20261015T215020Z-9c01.log.json"),
      "utf8",
    ),
    /"event":"first"/,
  );
});

test("R-LOG-7, R-LOG-8: a log holds one JSON object to a line, each followed by a line feed, and each with its date first", (t) => {
  const file = path.join(temporaryDirectory(t), "tc-test.log.json");

  {
    using logger = RunLog.create(file, false, "20261021T150000Z-0000");
    logger.log({ event: "first", verbose: true, toString: () => "first" });
    logger.log({
      event: "second",
      verbose: true,
      note: "a\nb",
      toString: () => "second",
    });
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

  assert.throws(
    () => RunLog.create(file, false, "20261021T150000Z-0000"),
    /EEXIST/,
  );
  assert.equal(readFileSync(file, "utf8"), "another run's");
});

test("R-LOG-11: run-start is verbose, and records the versions, the command line, the system and the runtime", (t) => {
  const entries = collectEntries(t);

  {
    using _runScope = new RunScope(["init", "D:\\Photos"]);
  }

  const [entry] = entries;
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

test("R-LOG-11, R-LOG-12: run-end is verbose where no error was given, and otherwise a failure that is not verbose, after the error's entry", (t) => {
  const entries = collectEntries(t);

  {
    using _runScope = new RunScope([]);
  }
  {
    using runScope = new RunScope([]);
    runScope.error = new TcError("what went wrong");
  }

  const ends = entries.filter((entry) => entry.event !== "run-start");
  assert.deepEqual(
    ends.map((entry) => JSON.parse(JSON.stringify(entry))),
    [
      { event: "run-end", verbose: true },
      { event: "error", message: "what went wrong" },
      { event: "run-end", outcome: "failure" },
    ],
  );
  assert.deepEqual(ends.map(String), ["Done", "error", "Failed"]);
});

test("logger writes into the open run's log, and to the terminal alone once it is closed", (t) => {
  const file = path.join(temporaryDirectory(t), "tc-test.log.json");
  const shown = t.mock.method(console, "log", () => {});

  {
    using _runLog = RunLog.create(file, false, "20261021T150000Z-0000");
    logger.log("into the log");
  }
  logger.log("after the log");

  assert.equal(JSON.parse(readFileSync(file, "utf8")).message, "into the log");
  assert.deepEqual(
    shown.mock.calls.map((call) => call.arguments),
    [["into the log"], ["after the log"]],
  );
});

test("R-LOG-17: text given to log is a message entry that is not verbose, shown as it is", (t) => {
  const file = path.join(temporaryDirectory(t), "tc-test.log.json");
  const shown = t.mock.method(console, "log", () => {});
  const text = "Usage:\n  turbo-collection init";

  {
    using logger = RunLog.create(file, false, "20261021T150000Z-0000");
    logger.log(text);
  }

  const entry = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(entry.event, "message");
  assert.equal(entry.message, text);
  assert.equal(entry.verbose, undefined);
  assert.deepEqual(
    shown.mock.calls.map((call) => call.arguments),
    [[text]],
  );
});

test("R-LOG-12: an error entry is a failure holding the error's message and stack, and its cause", (t) => {
  const file = path.join(temporaryDirectory(t), "tc-test.log.json");
  t.mock.method(console, "error", () => {});
  const cause = new Error("the lower error");

  {
    using logger = RunLog.create(file, false, "20261021T150000Z-0000");
    logger.error(new TcError("what went wrong", { cause }));
  }

  const entry = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(entry.event, "error");
  assert.equal(entry.outcome, "failure");
  assert.equal(entry.message, "what went wrong");
  assert.match(entry.stack, /^TcError: what went wrong\n\s+at /);
  assert.equal(entry.cause.message, "the lower error");
});
