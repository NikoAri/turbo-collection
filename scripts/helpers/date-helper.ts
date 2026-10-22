// Dates as Turbo-Collection writes them.

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

export function dateToBasicString(date: Date): string {
  // `dateToString` gives ISO 8601 extended format, as in
  // `2026-10-20T12:34:56Z`;
  // Drop every `-` and `:`
  // Result: `20261020T123456Z`, the basic format
  return dateToString(date).replaceAll(/[-:]/g, "");
}
