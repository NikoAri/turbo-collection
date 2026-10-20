import assert from "node:assert/strict";
import { test } from "node:test";

import { TcError } from "../helpers/tc-error.ts";

test("TcError: its stack and its string begin with its name", () => {
  const error = new TcError("a message");
  assert.equal(error.name, "TcError");
  assert.match(error.stack ?? "", /^TcError: a message\n/);
  assert.equal(String(error), "TcError: a message");
});

test("TcError: is an Error, and keeps the error it wraps as its cause", () => {
  const lower = new Error("lower");
  const error = new TcError("more to say", { cause: lower });
  assert.ok(error instanceof Error);
  assert.equal(error.cause, lower);
});
