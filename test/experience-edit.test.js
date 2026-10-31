import assert from "node:assert/strict";
import test from "node:test";
import { createExperienceRoutes } from "../worker/routes/experiences.js";

const postId = "post-id";
const attachmentA = "11111111-1111-4111-8111-111111111111";
const attachmentB = "22222222-2222-4222-8222-222222222222";

function setup() {
  const removedObjects = [];
  const statements = [];
  const activity = [];
  const attachments = [
    {
      id: attachmentA,
      original_filename: "keep.jpg",
      content_type: "image/jpeg",
      size_bytes: 10,
      object_key: "original/keep.jpg",
      preview_object_key: "preview/keep.webp",
    },
    {
      id: attachmentB,
      original_filename: "remove.mp4",
      content_type: "video/mp4",
      size_bytes: 20,
      object_key: "original/remove.mp4",
      preview_object_key: "preview/remove.webp",
    },
  ];
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
          return { id: postId };
        },
        async all() {
          return { results: attachments };
        },
      };
    },
    async batch(batchStatements) {
      statements.push(...batchStatements);
      return batchStatements.map((_, index) => ({ meta: { changes: index === 0 ? 1 : 1 } }));
    },
  };
  const routes = createExperienceRoutes({
    getCurrentUser: async () => ({ id: "user-1" }),
    ensureGhostTables: async () => {},
    ensureStoryTables: async () => {},
    ensureExperienceOptionColumns: async () => {},
    ensureEngagementTables: async () => {},
    recordActivity: async (...args) => activity.push(args),
    json: (body, status = 200) => Response.json(body, { status }),
    cleanSearchTerm: (value) => value,
    deleteEvidenceObjects: async (_env, keys) => {
      removedObjects.push(...keys);
      return false;
    },
    retryEvidenceCleanup: async () => {},
    moderationEnabled: async () => false,
    reviewWithGemini: async () => ({ review: { approved: true } }),
  });
  return { routes, db, removedObjects, statements, activity };
}

function editRequest(removalIds = []) {
  const form = new FormData();
  form.set("shortDescription", "Updated post");
  form.set("visibility", "public");
  for (const id of removalIds) form.append("removeEvidence", id);
  return new Request("https://nfd.test/api/experiences/post-id", {
    method: "PUT",
    body: form,
  });
}

test("editing can remove selected owned attachments and retain the others", async () => {
  const { routes, db, removedObjects, statements, activity } = setup();
  const response = await routes.updateOwnExperience(
    editRequest([attachmentB]),
    { DB: db, BUCKET: {} },
    postId,
  );

  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).removedEvidenceIds, [attachmentB]);
  assert.equal(statements.length, 2);
  assert.match(statements[1].sql, /DELETE FROM experience_evidence/);
  assert.deepEqual(statements[1].values, [attachmentB, postId]);
  assert.deepEqual(removedObjects, ["original/remove.mp4", "preview/remove.webp"]);
  assert.equal(activity[0][2], "experience_edited");
});

test("editing rejects an attachment ID that does not belong to the post", async () => {
  const { routes, db, removedObjects, statements } = setup();
  const response = await routes.updateOwnExperience(
    editRequest(["33333333-3333-4333-8333-333333333333"]),
    { DB: db, BUCKET: {} },
    postId,
  );

  assert.equal(response.status, 409);
  assert.equal(statements.length, 0);
  assert.deepEqual(removedObjects, []);
});
