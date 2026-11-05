import assert from "node:assert/strict";
import test from "node:test";
import { fetchWithRetry } from "../worker/lib/fetch-retry.js";

function response(status, headers) {
  return new Response(null, { status, headers });
}

test("fetchWithRetry retries temporary provider errors and returns a later success", async () => {
  const statuses = [503, 503, 200];
  const delays = [];
  let attempts = 0;

  const result = await fetchWithRetry(
    async () => {
      attempts += 1;
      return response(statuses.shift());
    },
    "https://example.test/review",
    {},
    { sleep: async (delay) => delays.push(delay) },
  );

  assert.equal(result.status, 200);
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [300, 600]);
});

test("fetchWithRetry honors a bounded Retry-After delay", async () => {
  const delays = [];
  let attempts = 0;

  await fetchWithRetry(
    async () => {
      attempts += 1;
      return attempts === 1 ? response(503, { "retry-after": "5" }) : response(200);
    },
    "https://example.test/review",
    {},
    { maxAttempts: 2, maxDelayMs: 1200, sleep: async (delay) => delays.push(delay) },
  );

  assert.deepEqual(delays, [1200]);
});

test("fetchWithRetry retries a transient network error", async () => {
  let attempts = 0;
  const delays = [];

  const result = await fetchWithRetry(
    async () => {
      attempts += 1;
      if (attempts === 1) throw new TypeError("Network unavailable");
      return response(200);
    },
    "https://example.test/review",
    {},
    { sleep: async (delay) => delays.push(delay) },
  );

  assert.equal(result.status, 200);
  assert.equal(attempts, 2);
  assert.deepEqual(delays, [300]);
});

test("fetchWithRetry stops after three attempts when the provider remains unavailable", async () => {
  let attempts = 0;
  const delays = [];

  const result = await fetchWithRetry(
    async () => {
      attempts += 1;
      return response(503);
    },
    "https://example.test/review",
    {},
    { sleep: async (delay) => delays.push(delay) },
  );

  assert.equal(result.status, 503);
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [300, 600]);
});

test("fetchWithRetry does not retry permanent client errors", async () => {
  let attempts = 0;

  const result = await fetchWithRetry(
    async () => {
      attempts += 1;
      return response(400);
    },
    "https://example.test/review",
    {},
    { sleep: async () => assert.fail("A permanent error must not be retried") },
  );

  assert.equal(result.status, 400);
  assert.equal(attempts, 1);
});
