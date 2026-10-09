import assert from "node:assert/strict";
import { test } from "node:test";

import {
  nodeTypesRangeFromEngines,
  withNodeTypesException,
} from "../helpers/node-types-version-exception.ts";

test("nodeTypesRangeFromEngines: a floor becomes its major, capped at the floor itself", () => {
  assert.equal(nodeTypesRangeFromEngines(">=24.19.0"), ">=24.0.0 <=24.19.0");
});

test("nodeTypesRangeFromEngines: the floor's patch is the cap's patch", () => {
  assert.equal(nodeTypesRangeFromEngines(">=24.19.7"), ">=24.0.0 <=24.19.7");
});

test("nodeTypesRangeFromEngines: whitespace around the floor is tolerated", () => {
  assert.equal(nodeTypesRangeFromEngines(" >= 26.3.0 "), ">=26.0.0 <=26.3.0");
});

test("nodeTypesRangeFromEngines: a missing floor throws, naming engines.node", () => {
  assert.throws(
    () => nodeTypesRangeFromEngines(undefined),
    /engines\.node.*missing/,
  );
});

test("nodeTypesRangeFromEngines: any form other than >=MAJOR.MINOR.PATCH throws, quoting it", () => {
  for (const other of [
    "^24.19.0",
    "24.x",
    ">=24",
    ">=24.19",
    ">=24.19.0 <25",
  ]) {
    assert.throws(
      () => nodeTypesRangeFromEngines(other),
      (error: unknown) =>
        error instanceof Error && error.message.includes(`"${other}"`),
    );
  }
});

test("withNodeTypesException: @types/node is held at or below the engines.node floor", () => {
  assert.deepEqual(
    withNodeTypesException(
      {},
      { "@types/node": "^24.13.3", cspell: "^10.0.0" },
      ">=24.19.0",
    ),
    { "@types/node": ">=24.0.0 <=24.19.0" },
  );
});

test("withNodeTypesException: the recorded exceptions are kept, and left unmodified", () => {
  const recorded = { cspell: "^10" };
  assert.deepEqual(
    withNodeTypesException(
      recorded,
      { "@types/node": "^24.13.3", cspell: "^10.0.0" },
      ">=24.19.0",
    ),
    { cspell: "^10", "@types/node": ">=24.0.0 <=24.19.0" },
  );
  assert.deepEqual(recorded, { cspell: "^10" });
});

test("withNodeTypesException: the floor replaces a range already recorded for @types/node", () => {
  assert.deepEqual(
    withNodeTypesException(
      { "@types/node": "^22" },
      { "@types/node": "^22.1.0" },
      ">=24.19.0",
    ),
    { "@types/node": ">=24.0.0 <=24.19.0" },
  );
});

test("withNodeTypesException: an entry that is already right returns the same object", () => {
  const recorded = { "@types/node": ">=24.0.0 <=24.19.0" };
  assert.equal(
    withNodeTypesException(
      recorded,
      { "@types/node": "^24.13.3" },
      ">=24.19.0",
    ),
    recorded,
  );
});

test("withNodeTypesException: @types/node with no engines.node floor throws", () => {
  assert.throws(
    () => withNodeTypesException({}, { "@types/node": "^24.13.3" }, undefined),
    /engines\.node/,
  );
});

test("withNodeTypesException: when @types/node is not a dependency, nothing is added and the floor is not read", () => {
  const recorded = {};
  assert.equal(
    withNodeTypesException(recorded, { cspell: "^10.0.0" }, undefined),
    recorded,
  );
});
