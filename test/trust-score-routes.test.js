import assert from "node:assert/strict";
import test from "node:test";
import { createTrustScoreRoutes } from "../worker/routes/trust-score.js";

function setup({ user = { id: "viewer-1" }, admin = false } = {}) {
  return createTrustScoreRoutes({
    getCurrentUser: async () => user,
    isAdmin: async () => admin,
    ensureTrustScoreTables: async () => {},
    json: (body, status = 200) => Response.json(body, { status }),
    cleanSearchTerm: (value) => value || "",
  });
}

test("Trust Score rule endpoint returns central categories and draft-only policy", async () => {
  const routes = setup();
  const response = await routes.getRules(new Request("https://nfd.test/api/trust-score/rules"), {});
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.statusLabel, "Unverified allegation");
  assert.equal(body.recognitionLabel, "Positive recognition");
  assert.deepEqual(
    body.classifications.map((entry) => entry.label),
    ["Timeline", "WordKeep", "Payment & property", "Communication", "Kindness & support", "Respect & safety"],
  );
  assert.equal(body.classifications[0].outcomes[0].polarity, "positive");
  assert.equal(body.classifications[0].outcomes[1].polarity, "negative");
});

test("Trust Score rules require sign-in", async () => {
  const routes = setup({ user: null });
  const response = await routes.getRules(new Request("https://nfd.test/api/trust-score/rules"), {});

  assert.equal(response.status, 401);
});

test("all allegation review data is restricted to administrators", async () => {
  const routes = setup({ admin: false });
  const response = await routes.adminSummary(
    new Request("https://nfd.test/api/admin/trust-score/allegations"),
    { DB: {} },
  );

  assert.equal(response.status, 403);
});

test("allegation creator may vote but the person named in the allegation may not", async () => {
  const routes = setup({ user: { id: "creator-1" } });
  const db = {
    prepare(sql) {
      return {
        bind() {
          return this;
        },
        async first() {
          if (sql.includes("SELECT a.id, a.author_user_id")) {
            return {
              id: "allegation-1",
              author_user_id: "creator-1",
              subject_user_id: "subject-1",
              classification: "communication",
              outcome: "did_not_respond",
              visibility: "public",
            };
          }
          if (sql.includes("SELECT COUNT(*) AS total")) return { total: 1, believe: 1, not_believe: 0 };
          return null;
        },
        async run() {
          return { success: true };
        },
      };
    },
  };
  const response = await routes.vote(
    new Request("https://nfd.test/api/trust-score/allegations/allegation-1/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ choice: "believe" }),
    }),
    { DB: db },
    "allegation-1",
  );

  assert.equal(response.status, 200);

  const subjectRoutes = setup({ user: { id: "subject-1" } });
  const subjectResponse = await subjectRoutes.vote(
    new Request("https://nfd.test/api/trust-score/allegations/allegation-1/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ choice: "believe" }),
    }),
    { DB: db },
    "allegation-1",
  );
  assert.equal(subjectResponse.status, 403);
});
