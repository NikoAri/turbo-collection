import assert from "node:assert/strict";
import { test } from "node:test";

import { nodeFloorChange } from "../helpers/engines-node-floor.ts";

test("nodeFloorChange: a newer Node within its floor's major raises that floor to it", () => {
  assert.deepEqual(nodeFloorChange(">=26.13.0", "26.13.1"), {
    kind: "raise",
    enginesNode: ">=26.13.1",
  });
  assert.deepEqual(nodeFloorChange(">=26.13.0", "26.14.0"), {
    kind: "raise",
    enginesNode: ">=26.14.0",
  });
});

test("nodeFloorChange: a Node at its floor, or below it, keeps that floor", () => {
  for (const nodeVersion of ["26.13.0", "26.12.9", "25.9.0"]) {
    assert.deepEqual(nodeFloorChange(">=26.13.0", nodeVersion), {
      kind: "keep",
    });
  }
});

test("nodeFloorChange: a Node of a newer major keeps its floor, as a change of its own kind", () => {
  assert.deepEqual(nodeFloorChange(">=26.13.0", "27.1.0"), {
    kind: "newerMajor",
  });
});

test("nodeFloorChange: each version part compares as a number, not as text", () => {
  assert.deepEqual(nodeFloorChange(">=26.9.0", "26.10.0"), {
    kind: "raise",
    enginesNode: ">=26.10.0",
  });
});

test("nodeFloorChange: whitespace around a floor is tolerated, and a raised floor holds none", () => {
  assert.deepEqual(nodeFloorChange(" >= 26.13.0 ", "26.13.1"), {
    kind: "raise",
    enginesNode: ">=26.13.1",
  });
});

test("nodeFloorChange: a missing floor throws, naming engines.node", () => {
  assert.throws(
    () => nodeFloorChange(undefined, "26.13.1"),
    /engines\.node.*missing/,
  );
});

test("nodeFloorChange: a floor of any form other than >=MAJOR.MINOR.PATCH throws, quoting it", () => {
  for (const other of [
    "^26.13.0",
    "26.x",
    ">=26",
    ">=26.13",
    ">=26.13.0 <27",
  ]) {
    assert.throws(
      () => nodeFloorChange(other, "26.13.1"),
      (error: unknown) =>
        error instanceof Error && error.message.includes(`"${other}"`),
    );
  }
});

test("nodeFloorChange: a Node prerelease throws, naming its version and --no-engines-node", () => {
  assert.throws(
    () => nodeFloorChange(">=26.13.0", "26.14.0-rc.1"),
    /26\.14\.0-rc\.1.*--no-engines-node/,
  );
});
