import test from "node:test";
import assert from "node:assert/strict";
import { createExperienceRoutes } from "../worker/routes/experiences.js";

const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function makePost(index) {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    experience_category: "Everyday life",
    incident_category: "Other or not sure",
    place: "Not provided",
    place_category: "Not provided",
    location_details: "",
    incident_time: "",
    incident_time_end: null,
    incident_time_zone: "UTC",
    short_description: `Post ${index}`,
    full_description: "",
    visibility: "public",
    comments_enabled: 1,
    created_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
  };
}

function setup() {
  const statements = [];
  const routes = createExperienceRoutes({
    getCurrentUser: async () => ({ id: userId, provider: "google", name: "NFD member" }),
    ensureExperienceOptionColumns: async () => {},
    ensureStoryTables: async () => {},
    ensureGhostTables: async () => {},
    ensureEngagementTables: async () => {},
    recordActivity: async () => {},
    json: (payload, status = 200) => Response.json(payload, { status }),
    cleanSearchTerm: (value) => value,
    deleteEvidenceObjects: async () => false,
    retryEvidenceCleanup: async () => {},
    moderationEnabled: async () => false,
    reviewWithGemini: async () => ({}),
  });
  const db = {
    prepare(sql) {
      const statement = { sql, values: [] };
      statements.push(statement);
      return {
        bind(...values) {
          statement.values = values;
          return this;
        },
        async first() {
          if (sql.includes("COUNT(*)")) return { total: 21 };
          if (sql.includes("profile_photo_key")) return { profile_photo_key: null };
          throw new Error(`Unexpected first query: ${sql}`);
        },
        async all() {
          if (sql.includes("FROM experience_evidence")) return { results: [] };
          if (sql.includes("FROM experiences")) {
            return {
              results: sql.includes("created_at < ?")
                ? [makePost(1)]
                : Array.from({ length: 21 }, (_, index) => makePost(21 - index)),
            };
          }
          throw new Error(`Unexpected all query: ${sql}`);
        },
      };
    },
  };
  return { routes, db, statements };
}

test("profile returns the first 20 posts, total, and a stable next cursor", async () => {
  const { routes, db, statements } = setup();
  const response = await routes.getProfile(new Request("https://nfd.test/api/profile"), { DB: db });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.total, 21);
  assert.equal(result.experiences.length, 20);
  assert.equal(result.experiences[0].id, makePost(21).id);
  assert.deepEqual(result.nextCursor, { createdAt: makePost(2).created_at, id: makePost(2).id });
  const postStatement = statements.find((statement) => statement.sql.includes("FROM experiences"));
  assert.match(postStatement.sql, /ORDER BY created_at DESC, id DESC\s+LIMIT \?/);
  assert.equal(postStatement.values.at(-1), 21);
});

test("loading later profile posts uses the cursor and skips count and profile-photo reads", async () => {
  const { routes, db, statements } = setup();
  const cursor = makePost(2);
  const params = new URLSearchParams({ before: cursor.created_at, beforeId: cursor.id });
  const response = await routes.getProfile(new Request(`https://nfd.test/api/profile?${params}`), { DB: db });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.experiences.length, 1);
  assert.equal(result.nextCursor, null);
  assert.ok(statements.some((statement) => statement.sql.includes("created_at < ?")));
  assert.equal(
    statements.some((statement) => statement.sql.includes("COUNT(*)")),
    false,
  );
  assert.equal(
    statements.some((statement) => statement.sql.includes("profile_photo_key")),
    false,
  );
});
