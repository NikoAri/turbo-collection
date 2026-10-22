import assert from "node:assert/strict";
import { test } from "node:test";

import { dateToString } from "../helpers/date-helper.ts";

test("R-MFILE-14: a date is ISO 8601 in UTC, to the second", () => {
  assert.equal(
    dateToString(new Date("2026-10-18T14:22:05.987Z")),
    "2026-10-18T14:22:05Z",
  );
});
