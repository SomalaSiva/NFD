import assert from "node:assert/strict";
import test from "node:test";
import { createAdminRoutes } from "../worker/routes/admin.js";

test("admin member directory pages users before counting their posts and activity", async () => {
  let directorySql = "";
  const routes = createAdminRoutes({
    getCurrentUser: async () => ({ id: "owner-1" }),
    isOwner: async () => true,
    ownerEmail: () => "owner@example.test",
    ensureIdentityTables: async () => {},
    ensureGhostTables: async () => {},
    recordActivity: async () => {},
    ensureModerationTable: async () => {},
    ensureExperienceOptionColumns: async () => {},
    ensureEngagementTables: async () => {},
    retryEvidenceCleanup: async () => {},
    deleteEvidenceObjects: async () => {},
    json: (body, status = 200) => Response.json(body, { status }),
    cleanSearchTerm: (value) => value || "",
    safeJsonParse: () => ({}),
  });
  const db = {
    prepare(sql) {
      if (sql.includes("WITH page_users")) directorySql = sql;
      return {
        bind() {
          return this;
        },
        async first() {
          return { total: 1 };
        },
        async all() {
          return {
            results: [
              {
                id: "member-1",
                provider_subject: "provider-1",
                email: "member@example.test",
                display_name: "Member",
                provider: "google",
                created_at: "2026-11-01T00:00:00.000Z",
                updated_at: "2026-11-01T00:00:00.000Z",
                active: 1,
                shared_post_count: 3,
                last_activity_at: "2026-11-02T00:00:00.000Z",
              },
            ],
          };
        },
      };
    },
  };
  const response = await routes.listNfdUsers(new Request("https://nfd.test/api/admin/members?offset=100"), {
    DB: db,
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.users[0].sharedPostCount, 3);
  assert.equal(body.users[0].lastActivityAt, "2026-11-02T00:00:00.000Z");
  assert.match(directorySql, /WITH page_users AS/);
  assert.match(directorySql, /INNER JOIN page_users p ON p.id = e.author_id/);
  assert.match(directorySql, /INNER JOIN page_users p ON p.id = a.actor_user_id/);
});
