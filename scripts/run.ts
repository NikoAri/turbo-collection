import { randomBytes } from "node:crypto";

// A run, one invocation of Turbo-Collection: its ID.
// Its log is in logger.ts.

// To ISO string without milliseconds
// Instant `now` as a log entry and a receipt
// state a date: ISO 8601, in UTC, to the second
// (meta-file-spec.md R-MFILE-14).
export function dateToString(date: Date): string {
  // `toISOString` always gives milliseconds, as in
  // `2026-10-20T12:34:56.789Z`;
  // Drop milliseconds
  // Result: `2026-10-20T12:34:56Z`
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function dateToBasicString(date: Date): string {
  // `dateToString` gives ISO 8601 extended format, as in
  // `2026-10-20T12:34:56Z`;
  // Drop every `-` and `:`
  // Result: `20261020T123456Z`, the basic format
  return dateToString(date).replaceAll(/[-:]/g, "");
}

// Sample Result: 20261020T123456Z-a1b5
// A new run ID (meta-file-spec.md R-MFILE-13):
// the instant `now` in ISO 8601 basic format, in UTC
// to the second, then `-` and four random
// lower-case hexadecimal digits.
export function generateRunId(date: Date = new Date()): string {
  const dateString = dateToBasicString(date);
  return `${dateString}-${randomBytes(2).toString("hex")}`;
}
