import test from "node:test";
import assert from "node:assert/strict";
import { createExperienceRoutes } from "../worker/routes/experiences.js";
function fixture({ user = { id: "reader" }, visibility = "public", present = true } = {}) {
  let reads = 0;
  const routes = createExperienceRoutes({
    getCurrentUser: async () => user,
    ensureExperienceOptionColumns: async () => {},
  });
  const record = {
    object_key: "original",
    preview_object_key: "preview",
    original_filename: "photo.jpg",
    content_type: "image/jpeg",
    author_id: "author",
    visibility,
  };
  const env = {
    DB: {
      prepare(sql) {
        return {
          bind() {
            return this;
          },
          async first() {
            return sql.includes("FROM experience_evidence") ? (present ? record : null) : null;
          },
        };
      },
    },
    BUCKET: {
      async get() {
        reads++;
        return {
          httpEtag: '"version1"',
          size: 3,
          body: new ReadableStream({
            start(c) {
              c.enqueue(new Uint8Array([1, 2, 3]));
              c.close();
            },
          }),
        };
      },
    },
  };
  return { routes, env, reads: () => reads };
}
test("authorized photo reads revalidate privately and unchanged images return 304", async () => {
  const f = fixture();
  const first = await f.routes.serveEvidence(
    new Request("http://localhost/api/evidence/id?variant=preview"),
    f.env,
    "id",
  );
  assert.equal(first.status, 200);
  assert.equal(first.headers.get("cache-control"), "private, no-cache");
  assert.equal(first.headers.get("etag"), '"version1"');
  assert.match(first.headers.get("vary"), /Cookie/);
  const same = await f.routes.serveEvidence(
    new Request("http://localhost/api/evidence/id?variant=preview", {
      headers: { "if-none-match": '"version1"' },
    }),
    f.env,
    "id",
  );
  assert.equal(same.status, 304);
});
test("matching cached etags never bypass sign-in, visibility, or deletion checks", async () => {
  for (const [options, status] of [
    [{ user: null }, 401],
    [{ visibility: "friends" }, 404],
    [{ present: false }, 404],
  ]) {
    const f = fixture(options);
    const response = await f.routes.serveEvidence(
      new Request("http://localhost/api/evidence/id", { headers: { "if-none-match": '"version1"' } }),
      f.env,
      "id",
    );
    assert.equal(response.status, status);
    assert.equal(f.reads(), 0);
  }
});
