import assert from "node:assert/strict";
import test from "node:test";
import { createStoryRoutes } from "../worker/routes/stories.js";

function createRoutes({ user = { id: "viewer-1" }, enabled = false } = {}) {
  return createStoryRoutes({
    getCurrentUser: async () => user,
    json: (body, status = 200) => Response.json(body, { status }),
    availableIdentitySql: "u.active = 1",
    quickStoriesEnabled: async () => enabled,
    recordActivity: async () => {},
  });
}

test("friends stories require a signed-in viewer", async () => {
  const routes = createRoutes({ user: null });
  const response = await routes.listStories(new Request("https://nfd.test/api/stories"), {});

  assert.equal(response.status, 401);
  assert.match((await response.json()).error, /sign in/i);
});

test("disabled stories return an empty response without querying the database", async () => {
  const routes = createRoutes();
  const db = {
    prepare() {
      assert.fail("The disabled stories route should not query the database.");
    },
  };
  const response = await routes.listStories(new Request("https://nfd.test/api/stories"), {
    DB: db,
    BUCKET: {},
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { enabled: false, own: null, friends: [] });
});
