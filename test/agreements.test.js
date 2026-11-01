import assert from "node:assert/strict";
import test from "node:test";
import { createAgreementRoutes } from "../worker/routes/agreements.js";

function setup({ user = { id: "user-1" } } = {}) {
  return createAgreementRoutes({
    getCurrentUser: async () => user,
    json: (body, status = 200) => Response.json(body, { status }),
  });
}

function request(body, headers = { "content-type": "application/json" }) {
  return new Request("https://nfd.test/api/trust-score/agreement-draft", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

test("agreement generator requires a signed-in user", async () => {
  const routes = setup({ user: null });
  const response = await routes.generateDraft(
    request({ description: "Borrow a bicycle", geminiConsent: true }),
    {
      GEMINI_API_KEY: "test-key",
    },
  );

  assert.equal(response.status, 401);
  assert.match((await response.json()).error, /sign in/i);
});

test("agreement generator validates consent, description, and request type", async () => {
  const routes = setup();
  const env = { GEMINI_API_KEY: "test-key" };

  assert.equal(
    (await routes.generateDraft(request({ description: "", geminiConsent: true }), env)).status,
    400,
  );
  assert.equal((await routes.generateDraft(request({ description: "Borrow a bicycle" }), env)).status, 400);
  assert.equal(
    (await routes.generateDraft(request({ description: "A".repeat(3001), geminiConsent: true }), env)).status,
    413,
  );
  assert.equal(
    (
      await routes.generateDraft(
        request({ description: "Borrow a bicycle", geminiConsent: true }, { "content-type": "text/plain" }),
        env,
      )
    ).status,
    415,
  );
});

test("agreement generator sends the brief to Gemini and returns the editable draft", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  let sentRequest;
  globalThis.fetch = async (url, options) => {
    sentRequest = { url, options };
    return Response.json({
      candidates: [
        { content: { parts: [{ text: "Bicycle Loan Agreement\n\n[Party A]" }] }, finishReason: "STOP" },
      ],
    });
  };

  const routes = setup();
  const response = await routes.generateDraft(
    request({ description: "Lend a bicycle for a week", geminiConsent: true }),
    { GEMINI_API_KEY: "test-key" },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).draft, "Bicycle Loan Agreement\n\n[Party A]");
  assert.match(sentRequest.url, /gemini-3\.1-flash-lite:generateContent$/);
  assert.equal(sentRequest.options.headers["x-goog-api-key"], "test-key");
  assert.match(sentRequest.options.body, /Lend a bicycle for a week/);
  assert.match(sentRequest.options.body, /Never invent names/);
});

test("agreement generator reports missing credentials and provider errors safely", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  t.after(() => {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  });
  console.error = () => {};
  const routes = setup();

  assert.equal(
    (await routes.generateDraft(request({ description: "Borrow a bicycle", geminiConsent: true }), {}))
      .status,
    503,
  );

  globalThis.fetch = async () => Response.json({ error: "provider details" }, { status: 429 });
  const response = await routes.generateDraft(
    request({ description: "Borrow a bicycle", geminiConsent: true }),
    { GEMINI_API_KEY: "test-key" },
  );
  assert.equal(response.status, 503);
  assert.doesNotMatch((await response.json()).error, /provider details/i);
});
