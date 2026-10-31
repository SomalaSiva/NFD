import { ensureStoryTables } from "../db/ensure.js";

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;
const EXPIRED_STORY_CLEANUP_BATCH_SIZE = 1000;
const STORY_DELETE_PARAMETER_LIMIT = 99;
const MAX_STORY_BYTES = 25 * 1024 * 1024;
const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const PROFILE_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const STORY_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export function createStoryRoutes(services) {
  const { getCurrentUser, recordActivity, json, availableIdentitySql } = services;

  function profilePhotoUrl(userId) {
    return `/api/profile-photo/${encodeURIComponent(userId)}?v=${Date.now()}`;
  }

  async function areFriends(env, firstUserId, secondUserId) {
    if (firstUserId === secondUserId) return true;
    const friend = await env.DB.prepare(
      `
      SELECT 1 AS connected FROM nfd_friend_requests
      WHERE status = 'accepted'
        AND ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))
      LIMIT 1
    `,
    )
      .bind(firstUserId, secondUserId, secondUserId, firstUserId)
      .first();
    return Boolean(friend);
  }

  async function cleanupExpiredStories(env) {
    if (!env.DB || !env.BUCKET) return;
    await ensureStoryTables(env);
    const expired = await env.DB.prepare(
      `SELECT id, object_key FROM nfd_stories
       WHERE expires_at <= ? ORDER BY expires_at LIMIT ${EXPIRED_STORY_CLEANUP_BATCH_SIZE}`,
    )
      .bind(new Date().toISOString())
      .all();
    const rows = expired.results || [];
    if (!rows.length) return 0;

    try {
      await env.BUCKET.delete(rows.map((story) => story.object_key));
      const deleteStatements = [];
      for (let offset = 0; offset < rows.length; offset += STORY_DELETE_PARAMETER_LIMIT) {
        const batch = rows.slice(offset, offset + STORY_DELETE_PARAMETER_LIMIT);
        const placeholders = batch.map(() => "?").join(", ");
        deleteStatements.push(
          env.DB.prepare(`DELETE FROM nfd_stories WHERE id IN (${placeholders}) AND expires_at <= ?`).bind(
            ...batch.map((story) => story.id),
            new Date().toISOString(),
          ),
        );
      }
      const deleted = await env.DB.batch(deleteStatements);
      return deleted.reduce((total, result) => total + (Number(result.meta?.changes) || 0), 0);
    } catch (error) {
      console.error(
        "Expired NFD story batch cleanup failed",
        error instanceof Error ? error.name : "unknown",
      );
      return 0;
    }
  }

  async function manageProfilePhoto(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to manage your profile photo." }, 401);
    if (!env.DB || !env.BUCKET)
      return json({ error: "Profile photo storage is unavailable right now." }, 503);
    try {
      await ensureStoryTables(env);
      const current = await env.DB.prepare("SELECT profile_photo_key FROM nfd_users WHERE id = ?")
        .bind(user.id)
        .first();
      if (request.method === "DELETE") {
        if (!current?.profile_photo_key) return json({ removed: true });
        await env.DB.prepare("UPDATE nfd_users SET profile_photo_key = ?, updated_at = ? WHERE id = ?")
          .bind(null, new Date().toISOString(), user.id)
          .run();
        try {
          await env.BUCKET.delete(current.profile_photo_key);
        } catch (error) {
          console.error(
            "NFD profile photo cleanup failed",
            user.id,
            error instanceof Error ? error.name : "unknown",
          );
        }
        return json({ removed: true });
      }
      if (!request.headers.get("content-type")?.toLowerCase().includes("multipart/form-data"))
        return json({ error: "Choose an image file to upload." }, 415);
      const form = await request.formData();
      const file = form.get("photo");
      if (!(file instanceof File) || !file.size) return json({ error: "Choose an image file first." }, 400);
      if (!PROFILE_PHOTO_TYPES.has(file.type) || file.size > MAX_PROFILE_PHOTO_BYTES)
        return json({ error: "Use a JPG, PNG, or WebP image no larger than 5 MB." }, 400);
      const signature = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      const validSignature =
        (file.type === "image/jpeg" &&
          signature[0] === 0xff &&
          signature[1] === 0xd8 &&
          signature[2] === 0xff) ||
        (file.type === "image/png" && signature.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10") ||
        (file.type === "image/webp" &&
          String.fromCharCode(...signature.slice(0, 4)) === "RIFF" &&
          String.fromCharCode(...signature.slice(8, 12)) === "WEBP");
      if (!validSignature)
        return json({ error: "That image file could not be verified. Choose a JPG, PNG, or WebP." }, 400);

      const objectKey = `profile-photos/${user.id}/${crypto.randomUUID()}`;
      await env.BUCKET.put(objectKey, file.stream(), {
        httpMetadata: { contentType: file.type },
        customMetadata: { userId: user.id },
      });
      const updatedAt = new Date().toISOString();
      try {
        await env.DB.prepare("UPDATE nfd_users SET profile_photo_key = ?, updated_at = ? WHERE id = ?")
          .bind(objectKey, updatedAt, user.id)
          .run();
      } catch (error) {
        await env.BUCKET.delete(objectKey).catch(() => {});
        throw error;
      }
      if (current?.profile_photo_key) {
        try {
          await env.BUCKET.delete(current.profile_photo_key);
        } catch (error) {
          console.error(
            "Previous NFD profile photo cleanup failed",
            user.id,
            error instanceof Error ? error.name : "unknown",
          );
        }
      }
      await recordActivity(env, user.id, "profile_photo_updated", "profile", user.id);
      return json({ photoUrl: profilePhotoUrl(user.id) });
    } catch (error) {
      console.error("NFD profile photo update failed", error instanceof Error ? error.name : "unknown");
      return json({ error: "Your profile photo could not be saved right now." }, 503);
    }
  }

  async function serveProfilePhoto(request, env, targetUserId) {
    const viewer = await getCurrentUser(request, env);
    if (!viewer || !env.DB || !env.BUCKET) return new Response("Profile photo not found.", { status: 404 });
    try {
      await ensureStoryTables(env);
      const target = await env.DB.prepare(
        `SELECT u.profile_photo_key FROM nfd_users u WHERE u.id = ? AND ${availableIdentitySql} LIMIT 1`,
      )
        .bind(targetUserId)
        .first();
      if (!target?.profile_photo_key || !(await areFriends(env, viewer.id, targetUserId)))
        return new Response("Profile photo not found.", { status: 404 });
      const object = await env.BUCKET.get(target.profile_photo_key);
      if (!object) return new Response("Profile photo not found.", { status: 404 });
      return new Response(object.body, {
        headers: {
          "content-type": object.httpMetadata?.contentType || "application/octet-stream",
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
        },
      });
    } catch (error) {
      console.error("NFD profile photo fetch failed", error instanceof Error ? error.name : "unknown");
      return new Response("Profile photo could not be loaded.", { status: 503 });
    }
  }

  async function listStories(request, env) {
    const viewer = await getCurrentUser(request, env);
    if (!viewer) return json({ error: "Sign in to view friends’ stories." }, 401);
    if (!env.DB || !env.BUCKET) return json({ error: "NFD stories are unavailable right now." }, 503);
    try {
      await ensureStoryTables(env);
      const now = new Date().toISOString();
      const result = await env.DB.prepare(
        `
        WITH visible_authors AS (
          SELECT f.to_user_id AS author_id
          FROM nfd_friend_requests f
          INNER JOIN nfd_users u ON u.id = f.to_user_id
          WHERE f.status = 'accepted' AND f.from_user_id = ? AND ${availableIdentitySql}
          UNION
          SELECT f.from_user_id AS author_id
          FROM nfd_friend_requests f
          INNER JOIN nfd_users u ON u.id = f.from_user_id
          WHERE f.status = 'accepted' AND f.to_user_id = ? AND ${availableIdentitySql}
          UNION
          SELECT ? AS author_id
        )
        SELECT s.id, s.author_id, s.caption, s.content_type, s.created_at, s.expires_at,
          u.display_name, u.profile_photo_key,
          CASE WHEN sv.story_id IS NULL THEN 0 ELSE 1 END AS viewed
        FROM nfd_stories s
        INNER JOIN visible_authors a ON a.author_id = s.author_id
        INNER JOIN nfd_users u ON u.id = s.author_id
        LEFT JOIN nfd_story_views sv ON sv.story_id = s.id AND sv.viewer_id = ?
        WHERE s.expires_at > ?
        ORDER BY CASE WHEN s.author_id = ? THEN 0 WHEN sv.story_id IS NULL THEN 1 ELSE 2 END,
          s.created_at ASC
      `,
      )
        .bind(viewer.id, viewer.id, viewer.id, viewer.id, now, viewer.id)
        .all();
      const groups = new Map();
      for (const row of result.results || []) {
        let group = groups.get(row.author_id);
        if (!group) {
          group = {
            userId: row.author_id,
            name: row.display_name || "NFD member",
            photoUrl: row.profile_photo_key ? profilePhotoUrl(row.author_id) : "",
            own: row.author_id === viewer.id,
            stories: [],
          };
          groups.set(row.author_id, group);
        }
        group.stories.push({
          id: row.id,
          caption: row.caption,
          contentType: row.content_type,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          viewed: Boolean(row.viewed),
          mediaUrl: `/api/stories/${encodeURIComponent(row.id)}/media`,
        });
      }
      const own = groups.get(viewer.id) || null;
      const friends = Array.from(groups.values())
        .filter((group) => !group.own)
        .map((group) => ({ ...group, hasUnseen: group.stories.some((story) => !story.viewed) }))
        .sort((first, second) => Number(second.hasUnseen) - Number(first.hasUnseen));
      return json({ own, friends, expiresAfterHours: 24 });
    } catch (error) {
      console.error("NFD story list failed", error instanceof Error ? error.name : "unknown");
      return json({ error: "Friends’ stories could not be loaded right now." }, 503);
    }
  }

  async function createStory(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to share a story." }, 401);
    if (!env.DB || !env.BUCKET) return json({ error: "NFD story uploads are unavailable right now." }, 503);
    if (!request.headers.get("content-type")?.toLowerCase().includes("multipart/form-data"))
      return json({ error: "Choose one photo or video to share." }, 415);
    let objectKey = "";
    try {
      await ensureStoryTables(env);
      const form = await request.formData();
      const file = form.get("media");
      const caption = typeof form.get("caption") === "string" ? form.get("caption").trim().slice(0, 180) : "";
      if (!(file instanceof File) || !file.size)
        return json({ error: "Choose one photo or video first." }, 400);
      if (!STORY_MEDIA_TYPES.has(file.type) || file.size > MAX_STORY_BYTES)
        return json({ error: "Choose a JPG, PNG, WebP, MP4, WebM, or MOV file no larger than 25 MB." }, 400);
      const id = crypto.randomUUID();
      const now = new Date();
      const createdAt = now.toISOString();
      const expiresAt = new Date(now.getTime() + STORY_LIFETIME_MS).toISOString();
      const originalFilename = (file.name || "story-media").replace(/[\r\n"\\]/g, "_").slice(0, 180);
      objectKey = `stories/${user.id}/${id}`;
      await env.BUCKET.put(objectKey, file.stream(), {
        httpMetadata: { contentType: file.type },
        customMetadata: { storyId: id, authorId: user.id },
      });
      await env.DB.prepare(
        `INSERT INTO nfd_stories
          (id, author_id, object_key, content_type, original_filename, size_bytes, caption, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(id, user.id, objectKey, file.type, originalFilename, file.size, caption, createdAt, expiresAt)
        .run();
      await recordActivity(env, user.id, "story_created", "story", id);
      return json(
        {
          story: {
            id,
            caption,
            contentType: file.type,
            createdAt,
            expiresAt,
            mediaUrl: `/api/stories/${id}/media`,
          },
        },
        201,
      );
    } catch (error) {
      if (objectKey) await env.BUCKET.delete(objectKey).catch(() => {});
      console.error("NFD story creation failed", error instanceof Error ? error.name : "unknown");
      return json({ error: "Your story could not be shared right now." }, 503);
    }
  }

  async function getAccessibleStory(env, viewer, storyId) {
    return env.DB.prepare(
      `
      SELECT s.id, s.author_id, s.object_key, s.content_type, s.original_filename, s.expires_at
      FROM nfd_stories s INNER JOIN nfd_users u ON u.id = s.author_id
      WHERE s.id = ? AND s.expires_at > ? AND ${availableIdentitySql}
        AND (s.author_id = ? OR EXISTS (
          SELECT 1 FROM nfd_friend_requests fr
          WHERE fr.status = 'accepted'
            AND ((fr.from_user_id = ? AND fr.to_user_id = s.author_id)
              OR (fr.from_user_id = s.author_id AND fr.to_user_id = ?))
        ))
      LIMIT 1
    `,
    )
      .bind(storyId, new Date().toISOString(), viewer.id, viewer.id, viewer.id)
      .first();
  }

  async function serveStoryMedia(request, env, storyId) {
    const viewer = await getCurrentUser(request, env);
    if (!viewer || !env.DB || !env.BUCKET) return new Response("Story not found.", { status: 404 });
    try {
      await ensureStoryTables(env);
      const story = await getAccessibleStory(env, viewer, storyId);
      if (!story) return new Response("Story not found.", { status: 404 });
      const object = await env.BUCKET.get(
        story.object_key,
        request.headers.get("range") ? { range: request.headers } : undefined,
      );
      if (!object) return new Response("Story media not found.", { status: 404 });
      const ranged = Boolean(request.headers.get("range") && object.range);
      const offset = Number(object.range?.offset) || 0;
      const length = Number(object.range?.length) || object.size;
      const isVideo = story.content_type.startsWith("video/");
      const headers = new Headers({
        "content-type": story.content_type,
        "content-disposition": `inline; filename="${story.original_filename}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "accept-ranges": isVideo ? "bytes" : "none",
        "content-length": String(length),
      });
      if (ranged) headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
      return new Response(object.body, { status: ranged ? 206 : 200, headers });
    } catch (error) {
      console.error("NFD story media fetch failed", error instanceof Error ? error.name : "unknown");
      return new Response("Story media could not be loaded.", { status: 503 });
    }
  }

  async function markStoryViewed(request, env, storyId) {
    const viewer = await getCurrentUser(request, env);
    if (!viewer) return json({ error: "Sign in to view a story." }, 401);
    if (!env.DB) return json({ error: "NFD stories are unavailable right now." }, 503);
    try {
      await ensureStoryTables(env);
      const story = await getAccessibleStory(env, viewer, storyId);
      if (!story) return json({ error: "That story has expired or is no longer available." }, 404);
      if (story.author_id !== viewer.id) {
        await env.DB.prepare(
          "INSERT OR IGNORE INTO nfd_story_views (story_id, viewer_id, viewed_at) VALUES (?, ?, ?)",
        )
          .bind(storyId, viewer.id, new Date().toISOString())
          .run();
      }
      return json({ viewed: true });
    } catch (error) {
      console.error("NFD story view update failed", error instanceof Error ? error.name : "unknown");
      return json({ error: "The story view could not be saved." }, 503);
    }
  }

  async function deleteStory(request, env, storyId) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to delete a story." }, 401);
    if (!env.DB || !env.BUCKET) return json({ error: "NFD story storage is unavailable right now." }, 503);
    try {
      await ensureStoryTables(env);
      const story = await env.DB.prepare("SELECT object_key FROM nfd_stories WHERE id = ? AND author_id = ?")
        .bind(storyId, user.id)
        .first();
      if (!story) return json({ error: "That story was not found." }, 404);
      await env.DB.prepare("DELETE FROM nfd_stories WHERE id = ? AND author_id = ?")
        .bind(storyId, user.id)
        .run();
      try {
        await env.BUCKET.delete(story.object_key);
      } catch (error) {
        console.error(
          "Deleted NFD story media cleanup failed",
          storyId,
          error instanceof Error ? error.name : "unknown",
        );
      }
      await recordActivity(env, user.id, "story_deleted", "story", storyId);
      return json({ deleted: true });
    } catch (error) {
      console.error("NFD story deletion failed", error instanceof Error ? error.name : "unknown");
      return json({ error: "That story could not be deleted right now." }, 503);
    }
  }

  return {
    manageProfilePhoto,
    serveProfilePhoto,
    listStories,
    createStory,
    serveStoryMedia,
    markStoryViewed,
    deleteStory,
    cleanupExpiredStories,
  };
}
