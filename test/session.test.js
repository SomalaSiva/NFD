import assert from "node:assert/strict";
import test from "node:test";
import { isSessionIdle, SESSION_IDLE_SECONDS } from "../worker/lib/session.js";

test("session idle timeout is four minutes", () => {
  assert.equal(SESSION_IDLE_SECONDS, 240);
});

test("session is active until four minutes without activity have elapsed", () => {
  const lastActivity = "2026-10-29T12:00:00.000Z";
  const start = Date.parse(lastActivity);
  assert.equal(isSessionIdle(lastActivity, start + 239_999), false);
  assert.equal(isSessionIdle(lastActivity, start + 240_000), true);
});

test("missing or invalid last activity fails closed as idle", () => {
  assert.equal(isSessionIdle(null, Date.now()), true);
  assert.equal(isSessionIdle("not-a-date", Date.now()), true);
});
