import assert from "node:assert/strict";
import { test } from "node:test";

import { dateToString, generateRunId } from "../run.ts";

test("R-MFILE-13: a run ID is the instant in basic format, in UTC to the second, then four random lower-case hexadecimal digits", () => {
  const instant = new Date("2026-10-18T14:22:05.987Z");

  assert.match(generateRunId(instant), /^20261018T142205Z-[0-9a-f]{4}$/);
});

test("R-MFILE-14: a date is ISO 8601 in UTC, to the second", () => {
  assert.equal(
    dateToString(new Date("2026-10-18T14:22:05.987Z")),
    "2026-10-18T14:22:05Z",
  );
});
