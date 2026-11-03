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
  assert.deepEqual(
    body.classifications.map((entry) => entry.label),
    ["Timeline", "WordKeep", "Payment & property", "Communication"],
  );
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
