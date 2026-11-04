import assert from "node:assert/strict";
import test from "node:test";
import { createExperienceRoutes } from "../worker/routes/experiences.js";

function setup({ user = { id: "user-1", provider: "google" }, existing = null } = {}) {
  const calls = [];
  const activity = [];
  const db = {
    prepare(sql) {
      return {
        sql,
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async first() {
          return existing;
        },
        async run() {
          calls.push({ sql: this.sql, values: this.values });
          return { meta: { changes: 1 } };
        },
      };
    },
  };
  const routes = createExperienceRoutes({
    getCurrentUser: async () => user,
    ensureIdentityTables: async () => {},
    recordActivity: async (...args) => activity.push(args),
    json: (body, status = 200) => Response.json(body, { status }),
  });
  const request = (body) =>
    new Request("https://nfd.test/api/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  return { routes, db, calls, activity, request };
}

test("profile details save a normalized username and bio", async () => {
  const { routes, db, calls, activity, request } = setup();
  const response = await routes.updateProfile(
    request({
      displayName: "  Sam Example  ",
      username: "@Sam.Example_1",
      bio: "  Here for good stories.  ",
    }),
    { DB: db },
  );

  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).user, {
    displayName: "Sam Example",
    username: "sam.example_1",
    bio: "Here for good stories.",
  });
  assert.deepEqual(calls[0].values, [
    "Sam Example",
    "sam.example_1",
    "Here for good stories.",
    calls[0].values[3],
    "user-1",
  ]);
  assert.equal(activity[0][2], "profile_details_updated");
});

test("profile details reject usernames already used without changing the profile", async () => {
  const { routes, db, calls, request } = setup({ existing: { id: "other-user" } });
  const response = await routes.updateProfile(
    request({ displayName: "Sam Example", username: "SAM.EXAMPLE", bio: "" }),
    { DB: db },
  );

  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /already in use/i);
  assert.deepEqual(calls, []);
});

test("profile details validate public fields and block Ghost identities", async () => {
  const invalid = setup();
  const invalidResponse = await invalid.routes.updateProfile(
    invalid.request({ displayName: "Sam", username: "bad name", bio: "" }),
    { DB: invalid.db },
  );
  assert.equal(invalidResponse.status, 400);

  const ghost = setup({ user: { id: "ghost-1", provider: "ghost" } });
  const ghostResponse = await ghost.routes.updateProfile(
    ghost.request({ displayName: "Ghost", username: "ghost_user", bio: "" }),
    { DB: ghost.db },
  );
  assert.equal(ghostResponse.status, 403);
  assert.deepEqual(ghost.calls, []);
});
