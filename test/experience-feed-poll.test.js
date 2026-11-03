import assert from "node:assert/strict";
import test from "node:test";
import { createExperienceRoutes } from "../worker/routes/experiences.js";

const postId = "11111111-1111-4111-8111-111111111111";
const allegationId = "22222222-2222-4222-8222-222222222222";

test("feed returns anonymous allegation poll totals and the viewer's own vote", async () => {
  const experience = {
    id: postId,
    author_id: "creator-1",
    experience_category: "Work and school",
    incident_category: "Bullying, harassment, or aggression",
    short_description: "A promise was not kept",
    full_description: "Details",
    visibility: "public",
    comments_enabled: 1,
    created_at: "2026-11-03T12:00:00.000Z",
    trust_allegation_id: allegationId,
    trust_classification: "communication",
    trust_outcome: "did_not_respond",
    trust_subject_user_id: "receiver-1",
    trust_subject_name: "NFD member",
    author_name: "Post author",
  };
  const db = {
    prepare(sql) {
      return {
        bind() {
          return this;
        },
        async all() {
          if (sql.includes("SELECT e.id, e.author_id")) return { results: [experience] };
          if (sql.includes("FROM nfd_trust_allegation_votes") && sql.includes("COUNT(*) AS total")) {
            return {
              results: [{ allegation_id: allegationId, total: 4, believe: 3, not_believe: 1 }],
            };
          }
          if (sql.includes("SELECT allegation_id, choice")) {
            return { results: [{ allegation_id: allegationId, choice: "believe" }] };
          }
          return { results: [] };
        },
      };
    },
  };
  const routes = createExperienceRoutes({
    getCurrentUser: async () => ({ id: "creator-1" }),
    ensureGhostTables: async () => {},
    ensureStoryTables: async () => {},
    ensureTrustScoreTables: async () => {},
    ensureEngagementTables: async () => {},
    ensureExperienceOptionColumns: async () => {},
    recordActivity: async () => {},
    json: (body, status = 200) => Response.json(body, { status }),
    cleanSearchTerm: (value) => value || "",
  });

  const response = await routes.listExperiences(new Request("https://nfd.test/api/experiences"), { DB: db });
  const body = await response.json();
  const report = body.experiences[0].trustReport;

  assert.equal(response.status, 200);
  assert.deepEqual(report.poll, { total: 4, believe: 3, notBelieve: 1, believePercent: 75 });
  assert.equal(report.myVote, "believe");
  assert.equal(report.canVote, true, "the allegation creator can vote, but the named person cannot");
  assert.equal("voterIds" in report, false);
  assert.equal(body.experiences[0].engagement.commentCount, 0);
});
