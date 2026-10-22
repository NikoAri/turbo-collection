import { randomBytes } from "node:crypto";

import { dateToBasicString } from "./date-helper.ts";

// Sample Result: 20261020T123456Z-a1b5
// A new run ID (meta-file-spec.md R-MFILE-13):
// the instant `now` in ISO 8601 basic format, in UTC
// to the second, then `-` and four random
// lower-case hexadecimal digits.
export function generateRunId(date: Date = new Date()): string {
  const dateString = dateToBasicString(date);
  return `${dateString}-${randomBytes(2).toString("hex")}`;
}
