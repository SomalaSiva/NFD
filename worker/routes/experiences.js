export function createExperienceRoutes(services) {
  const {
    getCurrentUser,
    ensureGhostTables,
    ensureStoryTables,
    ensureExperienceOptionColumns,
    ensureEngagementTables,
    recordActivity,
    json,
    cleanSearchTerm,
    deleteEvidenceObjects,
    retryEvidenceCleanup,
    moderationEnabled,
    reviewWithGemini,
  } = services;
  const MAX_FILES = 5;
  const MAX_FILE_BYTES = 25 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
  const EXPERIENCE_PAGE_SIZE = 20;
  const INCIDENT_CATEGORIES_BY_EXPERIENCE = {
    "Personal relationships": [
      "Trust broken or deception",
      "Heartbreak or relationship change",
      "Conflict or boundary issue",
      "Scam or financial harm",
      "Kindness or support",
      "Trust kept or connection strengthened",
      "Joyful or positive moment",
      "Other or not sure",
    ],
    "Work and school": [
      "Bullying, harassment, or aggression",
      "Unfair treatment or retaliation",
      "Trust broken or deception",
      "Conflict or boundary issue",
      "Support, appreciation, or teamwork",
      "Promise kept or trust strengthened",
      "Positive work or school experience",
      "Other or not sure",
    ],
    "Community and social life": [
      "Conflict, harassment, or safety concern",
      "Trust broken or deception",
      "Scam or financial harm",
      "Kindness or help",
      "Belonging or community support",
      "Positive event or gathering",
      "Other or not sure",
    ],
    "Business, products, and services": [
      "Scam or misleading conduct",
      "Billing or payment issue",
      "Product or service problem",
      "Delivery, refund, or cancellation issue",
      "Helpful service or fair resolution",
      "Great product or service",
      "Other or not sure",
    ],
    "Online and digital life": [
      "Scam, fraud, or impersonation",
      "Harassment or unwanted contact",
      "Privacy or account misuse",
      "Deception or broken trust",
      "Supportive or respectful interaction",
      "Positive online experience",
      "Other or not sure",
    ],
    "Public places and travel": [
      "Safety issue or unwanted aggression",
      "Scam or overcharge",
      "Service, travel, or access issue",
      "Helpful person or support",
      "Trustworthy or welcoming service",
      "Positive outing or experience",
      "Other or not sure",
    ],
    "Other or not sure": [
      "Trust broken or deception",
      "Scam or financial harm",
      "Harassment, aggression, or safety issue",
      "Conflict or boundary issue",
      "Kindness or support",
      "Trust kept or promise fulfilled",
      "Positive or joyful experience",
      "Other or not sure",
    ],
  };
  const ALLOWED_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
    "image/avif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

  async function listExperiences(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) {
      return json({ error: "Sign in to view the NFD experience feed." }, 401);
    }
    if (!env.DB) return json({ error: "The NFD experience database is not available right now." }, 503);
    try {
      await ensureExperienceOptionColumns(env);
      await ensureEngagementTables(env);
      await ensureGhostTables(env);
      const url = new URL(request.url);
      const placeSearch = cleanSearchTerm(url.searchParams.get("place"));
      const locationSearch = cleanSearchTerm(url.searchParams.get("location"));
      const experienceCategory = cleanSearchTerm(url.searchParams.get("experienceCategory"));
      const incidentCategory = cleanSearchTerm(url.searchParams.get("incidentCategory"));
      const placeCategory = cleanSearchTerm(url.searchParams.get("placeCategory"));
      const cursor = decodeExperienceCursor(url.searchParams.get("cursor"));
      if (url.searchParams.has("cursor") && !cursor)
        return json({ error: "That feed page could not be loaded. Refresh the feed and try again." }, 400);
      const visibilitySql = `(e.author_id = ? OR e.visibility IN ('public', 'anonymous') OR (e.visibility = 'friends' AND EXISTS (
      SELECT 1 FROM nfd_friend_requests f WHERE f.status = 'accepted'
      AND ((f.from_user_id = e.author_id AND f.to_user_id = ?) OR (f.from_user_id = ? AND f.to_user_id = e.author_id))
    )))`;
      const visibilityBindings = [user.id, user.id, user.id];
      const conditions = ["e.status = ?", visibilitySql];
      const bindings = ["shared", ...visibilityBindings];
      if (placeSearch) {
        conditions.push("instr(lower(e.place), lower(?)) > 0");
        bindings.push(placeSearch);
      }
      if (locationSearch) {
        conditions.push(`(
        instr(lower(COALESCE(e.location_details, '')), lower(?)) > 0
        OR instr(lower(e.place_category), lower(?)) > 0
        OR instr(lower(e.place), lower(?)) > 0
      )`);
        bindings.push(locationSearch, locationSearch, locationSearch);
      }
      if (experienceCategory) {
        conditions.push("e.experience_category = ?");
        bindings.push(experienceCategory);
      }
      if (incidentCategory) {
        conditions.push("e.incident_category = ?");
        bindings.push(incidentCategory);
      }
      if (placeCategory) {
        conditions.push("e.place_category = ?");
        bindings.push(placeCategory);
      }
      const where = conditions.join(" AND ");
      const pageConditions = [...conditions];
      const pageBindings = [...bindings];
      if (cursor) {
        pageConditions.push("(e.created_at < ? OR (e.created_at = ? AND e.id < ?))");
        pageBindings.push(cursor.createdAt, cursor.createdAt, cursor.id);
      }
      const [
        result,
        totalResult,
        placeResult,
        locationResult,
        experienceCategoryResult,
        incidentCategoryResult,
        placeCategoryResult,
      ] = await Promise.all([
        env.DB.prepare(
          `
        SELECT e.id, e.author_id, e.experience_category, e.incident_category, e.place, e.place_category,
          e.location_details, e.incident_time, e.incident_time_end, e.incident_time_zone, e.short_description,
          e.full_description, e.visibility, e.comments_enabled, e.created_at,
          CASE WHEN e.visibility = 'anonymous' OR u.active != 1 OR (u.provider = 'ghost' AND NOT EXISTS (
            SELECT 1 FROM nfd_ghost_profiles gp
            INNER JOIN nfd_users owner ON owner.id = gp.owner_user_id
            WHERE gp.ghost_user_id = u.id AND gp.active = 1 AND owner.active = 1
          )) THEN NULL ELSE u.display_name END AS author_name
        FROM experiences e LEFT JOIN nfd_users u ON u.id = e.author_id
        WHERE ${pageConditions.join(" AND ")}
        ORDER BY e.created_at DESC
        LIMIT ${EXPERIENCE_PAGE_SIZE + 1}
      `,
        )
          .bind(...pageBindings)
          .all(),
        env.DB.prepare(`SELECT COUNT(*) AS total FROM experiences e WHERE ${where}`)
          .bind(...bindings)
          .first(),
        env.DB.prepare(
          `SELECT DISTINCT e.place FROM experiences e WHERE ${where} ORDER BY e.place COLLATE NOCASE LIMIT 100`,
        )
          .bind(...bindings)
          .all(),
        env.DB.prepare(
          `SELECT DISTINCT e.location_details FROM experiences e WHERE ${where} AND e.location_details IS NOT NULL AND trim(e.location_details) != '' ORDER BY e.location_details COLLATE NOCASE LIMIT 100`,
        )
          .bind(...bindings)
          .all(),
        env.DB.prepare(
          `SELECT DISTINCT e.experience_category FROM experiences e WHERE e.status = ? AND ${visibilitySql} ORDER BY e.experience_category COLLATE NOCASE`,
        )
          .bind("shared", ...visibilityBindings)
          .all(),
        env.DB.prepare(
          `SELECT DISTINCT e.incident_category FROM experiences e WHERE e.status = ? AND ${visibilitySql} ORDER BY e.incident_category COLLATE NOCASE`,
        )
          .bind("shared", ...visibilityBindings)
          .all(),
        env.DB.prepare(
          `SELECT DISTINCT e.place_category FROM experiences e WHERE e.status = ? AND ${visibilitySql} ORDER BY e.place_category COLLATE NOCASE`,
        )
          .bind("shared", ...visibilityBindings)
          .all(),
      ]);
      const pageRows = result.results || [];
      const hasMore = pageRows.length > EXPERIENCE_PAGE_SIZE;
      const experiences = pageRows.slice(0, EXPERIENCE_PAGE_SIZE);
      const nextCursor =
        hasMore && experiences.length
          ? encodeExperienceCursor(
              experiences[experiences.length - 1].created_at,
              experiences[experiences.length - 1].id,
            )
          : null;
      const evidenceByExperience = new Map();
      const engagementByExperience = new Map();
      if (experiences.length) {
        const ids = experiences.map((experience) => experience.id);
        const placeholders = ids.map(() => "?").join(", ");
        const evidenceResult = await env.DB.prepare(
          `
        SELECT id, experience_id, original_filename, content_type, size_bytes, preview_object_key
        FROM experience_evidence
        WHERE experience_id IN (${placeholders})
        ORDER BY created_at ASC
      `,
        )
          .bind(...ids)
          .all();
        for (const file of evidenceResult.results || []) {
          const files = evidenceByExperience.get(file.experience_id) || [];
          files.push({
            id: file.id,
            originalFilename: file.original_filename,
            contentType: file.content_type,
            sizeBytes: file.size_bytes,
            hasPreview: Boolean(file.preview_object_key),
          });
          evidenceByExperience.set(file.experience_id, files);
        }
        const [reactionRows, myReactions, commentRows] = await Promise.all([
          env.DB.prepare(
            `SELECT experience_id, reaction, COUNT(*) AS count FROM experience_reactions WHERE experience_id IN (${placeholders}) GROUP BY experience_id, reaction`,
          )
            .bind(...ids)
            .all(),
          env.DB.prepare(
            `SELECT experience_id, reaction FROM experience_reactions WHERE user_id = ? AND experience_id IN (${placeholders})`,
          )
            .bind(user.id, ...ids)
            .all(),
          env.DB.prepare(
            `SELECT experience_id, COUNT(*) AS count FROM experience_comments WHERE experience_id IN (${placeholders}) GROUP BY experience_id`,
          )
            .bind(...ids)
            .all(),
        ]);
        for (const experience of experiences)
          engagementByExperience.set(experience.id, {
            counts: { like: 0, dislike: 0, love: 0, hate: 0 },
            myReaction: "",
            commentCount: 0,
          });
        for (const row of reactionRows.results || [])
          engagementByExperience.get(row.experience_id).counts[row.reaction] = Number(row.count) || 0;
        for (const row of myReactions.results || [])
          engagementByExperience.get(row.experience_id).myReaction = row.reaction;
        for (const row of commentRows.results || [])
          engagementByExperience.get(row.experience_id).commentCount = Number(row.count) || 0;
      }

      return json({
        total: totalResult?.total || 0,
        placeSuggestions: (placeResult.results || []).map((row) => row.place),
        locationSuggestions: (locationResult.results || []).map((row) => row.location_details),
        experienceCategoryOptions: (experienceCategoryResult.results || []).map(
          (row) => row.experience_category,
        ),
        incidentCategoryOptions: (incidentCategoryResult.results || []).map((row) => row.incident_category),
        placeCategoryOptions: (placeCategoryResult.results || []).map((row) => row.place_category),
        nextCursor,
        experiences: experiences.map((experience) => ({
          id: experience.id,
          experienceCategory: experience.experience_category,
          incidentCategory: experience.incident_category,
          place: experience.place,
          placeCategory: experience.place_category,
          locationDetails: experience.location_details || "",
          incidentTime: experience.incident_time,
          incidentTimeEnd: experience.incident_time_end,
          incidentTimeZone: experience.incident_time_zone,
          shortDescription: experience.short_description,
          fullDescription: experience.full_description,
          visibility: experience.visibility,
          commentsEnabled: experience.comments_enabled !== 0,
          isMine: experience.author_id === user.id,
          authorName: experience.visibility === "anonymous" ? "" : experience.author_name || "NFD member",
          createdAt: experience.created_at,
          evidence: evidenceByExperience.get(experience.id) || [],
          engagement: engagementByExperience.get(experience.id) || {
            counts: { like: 0, dislike: 0, love: 0, hate: 0 },
            myReaction: "",
            commentCount: 0,
          },
        })),
      });
    } catch (error) {
      console.error("Experience feed query failed", error);
      return json({ error: "NFD couldn’t load the experience feed right now." }, 503);
    }
  }

  async function getProfile(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to view your profile." }, 401);
    if (!env.DB) return json({ error: "Your NFD profile is not available right now." }, 503);
    try {
      await ensureExperienceOptionColumns(env);
      await ensureStoryTables(env);
      const profilePhoto = await env.DB.prepare("SELECT profile_photo_key FROM nfd_users WHERE id = ?")
        .bind(user.id)
        .first();
      const result = await env.DB.prepare(
        `
      SELECT id, experience_category, incident_category, place, place_category,
        location_details, incident_time, incident_time_end, incident_time_zone, short_description,
        full_description, visibility, comments_enabled, created_at
      FROM experiences
      WHERE author_id = ? AND status = ?
      ORDER BY created_at DESC
      LIMIT 100
    `,
      )
        .bind(user.id, "shared")
        .all();
      const experiences = result.results || [];
      const evidenceByExperience = new Map();
      if (experiences.length) {
        const ids = experiences.map((experience) => experience.id);
        const placeholders = ids.map(() => "?").join(", ");
        const evidenceResult = await env.DB.prepare(
          `
        SELECT id, experience_id, original_filename, content_type, size_bytes
        FROM experience_evidence
        WHERE experience_id IN (${placeholders})
        ORDER BY created_at ASC
      `,
        )
          .bind(...ids)
          .all();
        for (const file of evidenceResult.results || []) {
          const files = evidenceByExperience.get(file.experience_id) || [];
          files.push({
            id: file.id,
            originalFilename: file.original_filename,
            contentType: file.content_type,
            sizeBytes: file.size_bytes,
          });
          evidenceByExperience.set(file.experience_id, files);
        }
      }
      return json({
        user: {
          name: user.name || "",
          email: user.email || "",
          provider: user.provider,
          ghostHandle: user.ghostHandle || "",
          photoUrl: profilePhoto?.profile_photo_key
            ? `/api/profile-photo/${encodeURIComponent(user.id)}?v=${Date.now()}`
            : "",
        },
        total: experiences.length,
        experiences: experiences.map((experience) => ({
          id: experience.id,
          experienceCategory: experience.experience_category,
          incidentCategory: experience.incident_category,
          place: experience.place,
          placeCategory: experience.place_category,
          locationDetails: experience.location_details || "",
          incidentTime: experience.incident_time,
          incidentTimeEnd: experience.incident_time_end,
          incidentTimeZone: experience.incident_time_zone,
          shortDescription: experience.short_description,
          fullDescription: experience.full_description,
          visibility: experience.visibility,
          commentsEnabled: experience.comments_enabled !== 0,
          createdAt: experience.created_at,
          evidence: evidenceByExperience.get(experience.id) || [],
        })),
      });
    } catch (error) {
      console.error("Profile query failed", error);
      return json({ error: "Your NFD profile could not be loaded right now." }, 503);
    }
  }

  async function deleteOwnExperience(request, env, experienceId) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to delete your post." }, 401);
    if (!env.DB || !env.BUCKET) return json({ error: "Post storage is not available right now." }, 503);
    try {
      await ensureEngagementTables(env);
      await ensureExperienceOptionColumns(env);
      await retryEvidenceCleanup(env);
      const ownedPost = await env.DB.prepare(
        "SELECT id FROM experiences WHERE id = ? AND author_id = ? AND status = ? LIMIT 1",
      )
        .bind(experienceId, user.id, "shared")
        .first();
      if (!ownedPost) return json({ error: "That post was not found in your profile." }, 404);
      await recordActivity(env, user.id, "post_deleted", "experience", experienceId);

      const evidence = await env.DB.prepare(
        "SELECT object_key, preview_object_key FROM experience_evidence WHERE experience_id = ?",
      )
        .bind(experienceId)
        .all();
      const results = await env.DB.batch([
        env.DB.prepare("DELETE FROM experience_reactions WHERE experience_id = ?").bind(experienceId),
        env.DB.prepare("DELETE FROM experience_comments WHERE experience_id = ?").bind(experienceId),
        env.DB.prepare(
          `
        DELETE FROM experience_evidence
        WHERE experience_id = ? AND EXISTS (
          SELECT 1 FROM experiences WHERE id = ? AND author_id = ? AND status = ?
        )
      `,
        ).bind(experienceId, experienceId, user.id, "shared"),
        env.DB.prepare("DELETE FROM experiences WHERE id = ? AND author_id = ? AND status = ?").bind(
          experienceId,
          user.id,
          "shared",
        ),
      ]);
      if (!(Number(results[3]?.meta?.changes) > 0)) {
        return json({ error: "That post was not found in your profile." }, 404);
      }

      const cleanupPending = await deleteEvidenceObjects(
        env,
        (evidence.results || []).flatMap((file) => [file.object_key, file.preview_object_key]),
      );
      if (cleanupPending)
        console.error("Some evidence could not be removed after post deletion", experienceId);
      return json({ ok: true, cleanupPending });
    } catch (error) {
      console.error("Post deletion failed", error);
      return json({ error: "Your post could not be deleted right now. Please try again." }, 503);
    }
  }

  function encodeExperienceCursor(createdAt, id) {
    return btoa(`${createdAt}\n${id}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeExperienceCursor(value) {
    if (typeof value !== "string" || value.length > 256 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
    try {
      const encoded = value.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "="));
      const [createdAt, id, ...extra] = decoded.split("\n");
      if (extra.length || !Number.isFinite(Date.parse(createdAt)) || !/^[0-9a-f-]{36}$/i.test(id))
        return null;
      return { createdAt, id };
    } catch {
      return null;
    }
  }

  async function serveEvidence(request, env, evidenceId) {
    const user = await getCurrentUser(request, env);
    if (!user) {
      return new Response("Sign in to view this evidence.", { status: 401 });
    }
    if (!env.DB || !env.BUCKET) return new Response("Evidence storage is unavailable.", { status: 503 });
    try {
      await ensureExperienceOptionColumns(env);
      const record = await env.DB.prepare(
        `
      SELECT ee.object_key, ee.preview_object_key, ee.original_filename, ee.content_type,
        e.author_id, e.visibility
      FROM experience_evidence ee
      INNER JOIN experiences e ON e.id = ee.experience_id
      WHERE ee.id = ? AND e.status = ?
    `,
      )
        .bind(evidenceId, "shared")
        .first();
      if (!record) return new Response("Evidence not found.", { status: 404 });
      if (!(await canViewExperience(env, user, record)))
        return new Response("Evidence not found.", { status: 404 });
      const requestedPreview = new URL(request.url).searchParams.get("variant") === "preview";
      const imageEvidence = record.content_type.startsWith("image/");
      const wantsPreview =
        Boolean(record.preview_object_key) &&
        (requestedPreview || (imageEvidence && record.author_id !== user.id));
      const objectKey = wantsPreview ? record.preview_object_key : record.object_key;
      const contentType = wantsPreview ? "image/webp" : record.content_type;
      const isVideo = contentType.startsWith("video/");
      let object;
      try {
        object = await env.BUCKET.get(
          objectKey,
          request.headers.get("range") ? { range: request.headers } : undefined,
        );
      } catch (error) {
        if (request.headers.get("range"))
          return new Response(null, { status: 416, headers: { "accept-ranges": "bytes" } });
        throw error;
      }
      if (!object) return new Response("Evidence not found.", { status: 404 });
      const filename = safeFilename(record.original_filename);
      const ranged = Boolean(request.headers.get("range") && object.range);
      const offset = Number(object.range?.offset) || 0;
      const length = Number(object.range?.length) || object.size;
      const headers = new Headers({
        "content-type": contentType,
        "content-disposition": `${contentType.startsWith("image/") || isVideo ? "inline" : "attachment"}; filename="${filename}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "accept-ranges": isVideo ? "bytes" : "none",
        "content-length": String(length),
      });
      if (ranged) headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
      return new Response(object.body, {
        status: ranged ? 206 : 200,
        headers,
      });
    } catch (error) {
      console.error("Evidence fetch failed", error);
      return new Response("Evidence could not be loaded.", { status: 503 });
    }
  }

  async function canViewExperience(env, viewer, experience) {
    if (
      viewer.id === experience.author_id ||
      experience.visibility === "public" ||
      experience.visibility === "anonymous"
    )
      return true;
    if (experience.visibility !== "friends") return false;
    const connection = await env.DB.prepare(
      `
    SELECT id FROM nfd_friend_requests
    WHERE status = 'accepted'
      AND ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))
    LIMIT 1
  `,
    )
      .bind(experience.author_id, viewer.id, viewer.id, experience.author_id)
      .first();
    return Boolean(connection);
  }

  async function getVisibleExperience(request, env, experienceId) {
    const user = await getCurrentUser(request, env);
    if (!user) return { error: json({ error: "Sign in to interact with NFD stories." }, 401) };
    if (!env.DB) return { error: json({ error: "NFD stories are unavailable right now." }, 503) };
    await ensureExperienceOptionColumns(env);
    const experience = await env.DB.prepare(
      "SELECT id, author_id, visibility, comments_enabled FROM experiences WHERE id = ? AND status = ? LIMIT 1",
    )
      .bind(experienceId, "shared")
      .first();
    if (!experience || !(await canViewExperience(env, user, experience)))
      return { error: json({ error: "That story is not available to you." }, 404) };
    return { user, experience };
  }

  async function updateExperienceReaction(request, env, experienceId) {
    const access = await getVisibleExperience(request, env, experienceId);
    if (access.error) return access.error;
    const { user } = access;
    try {
      await ensureEngagementTables(env);
      if (request.method === "DELETE") {
        await env.DB.prepare("DELETE FROM experience_reactions WHERE experience_id = ? AND user_id = ?")
          .bind(experienceId, user.id)
          .run();
        await recordActivity(env, user.id, "reaction_removed", "experience", experienceId);
        return json({ ok: true, reaction: "" });
      }
      const body = await request.json().catch(() => null);
      const reaction = body?.reaction;
      if (!["like", "dislike", "love", "hate"].includes(reaction))
        return json({ error: "Choose like, dislike, love, or hate." }, 400);
      const now = new Date().toISOString();
      await env.DB.prepare(
        `
      INSERT INTO experience_reactions (experience_id, user_id, reaction, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(experience_id, user_id) DO UPDATE SET reaction = excluded.reaction, updated_at = excluded.updated_at
    `,
      )
        .bind(experienceId, user.id, reaction, now, now)
        .run();
      await recordActivity(env, user.id, "reaction_set", "experience", experienceId, { reaction });
      return json({ ok: true, reaction });
    } catch (error) {
      console.error("NFD reaction update failed", error);
      return json({ error: "Your reaction could not be saved right now." }, 503);
    }
  }

  async function handleExperienceComments(request, env, experienceId) {
    const access = await getVisibleExperience(request, env, experienceId);
    if (access.error) return access.error;
    const { user } = access;
    try {
      await ensureEngagementTables(env);
      if (request.method === "GET") {
        const result = await env.DB.prepare(
          `
        SELECT c.id, c.user_id, c.body, c.created_at, u.display_name, u.email,
          CASE WHEN c.user_id = e.author_id AND e.visibility = 'anonymous' THEN 1 ELSE 0 END AS anonymous_author
        FROM experience_comments c
        INNER JOIN nfd_users u ON u.id = c.user_id
        INNER JOIN experiences e ON e.id = c.experience_id
        WHERE c.experience_id = ?
        ORDER BY c.created_at ASC
        LIMIT 200
      `,
        )
          .bind(experienceId)
          .all();
        return json({
          commentsEnabled: access.experience.comments_enabled !== 0,
          canManageComments: access.experience.author_id === user.id,
          comments: (result.results || []).map((row) => ({
            id: row.id,
            body: row.body,
            createdAt: row.created_at,
            authorName: row.anonymous_author
              ? "Anonymous author"
              : row.display_name || row.email?.split("@")[0] || "NFD member",
            canDelete: row.user_id === user.id || access.experience.author_id === user.id,
          })),
        });
      }
      const body = await request.json().catch(() => null);
      if (request.method === "PATCH") {
        if (access.experience.author_id !== user.id)
          return json(
            { error: "Only the person who shared this story can change its comment settings." },
            403,
          );
        if (typeof body?.enabled !== "boolean")
          return json({ error: "Choose whether comments should be on or off." }, 400);
        await env.DB.prepare("UPDATE experiences SET comments_enabled = ? WHERE id = ? AND author_id = ?")
          .bind(body.enabled ? 1 : 0, experienceId, user.id)
          .run();
        await recordActivity(
          env,
          user.id,
          body.enabled ? "comments_enabled" : "comments_disabled",
          "experience",
          experienceId,
        );
        return json({ ok: true, commentsEnabled: body.enabled });
      }
      if (access.experience.comments_enabled === 0)
        return json({ error: "Comments are turned off for this story." }, 409);
      const text =
        typeof body?.body === "string"
          ? body.body
              .trim()
              .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
              .slice(0, 1000)
          : "";
      if (!text) return json({ error: "Write a comment before posting." }, 400);
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await env.DB.prepare(
        "INSERT INTO experience_comments (id, experience_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
      )
        .bind(id, experienceId, user.id, text, createdAt)
        .run();
      await recordActivity(env, user.id, "comment_posted", "experience", experienceId, { commentId: id });
      return json(
        {
          ok: true,
          comment: {
            id,
            body: text,
            createdAt,
            authorName: user.name || user.email?.split("@")[0] || "NFD member",
          },
        },
        201,
      );
    } catch (error) {
      console.error("NFD comment operation failed", error);
      return json({ error: "Comments could not be loaded or saved right now." }, 503);
    }
  }

  async function deleteExperienceComment(request, env, experienceId, commentId) {
    const access = await getVisibleExperience(request, env, experienceId);
    if (access.error) return access.error;
    try {
      await ensureEngagementTables(env);
      const comment = await env.DB.prepare(
        "SELECT id, user_id FROM experience_comments WHERE id = ? AND experience_id = ? LIMIT 1",
      )
        .bind(commentId, experienceId)
        .first();
      if (!comment) return json({ error: "That comment was already removed or could not be found." }, 404);
      if (comment.user_id !== access.user.id && access.experience.author_id !== access.user.id) {
        return json({ error: "You can delete only your own comments." }, 403);
      }
      await env.DB.prepare("DELETE FROM experience_comments WHERE id = ? AND experience_id = ?")
        .bind(commentId, experienceId)
        .run();
      await recordActivity(env, access.user.id, "comment_deleted", "experience", experienceId, { commentId });
      const count = await env.DB.prepare(
        "SELECT COUNT(*) AS count FROM experience_comments WHERE experience_id = ?",
      )
        .bind(experienceId)
        .first();
      return json({ ok: true, commentCount: Number(count?.count) || 0 });
    } catch (error) {
      console.error("NFD comment deletion failed", error);
      return json({ error: "That comment could not be deleted right now." }, 503);
    }
  }

  async function submitExperience(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to share an experience." }, 401);
    if (!env.DB || !env.BUCKET) {
      return json({ error: "Experience storage is not available right now. Please try again later." }, 503);
    }
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
      return json({ error: "Submit the experience using the form." }, 415);
    }
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_TOTAL_BYTES + 7 * 1024 * 1024) {
      return json({ error: "Attachments exceed the 50 MB combined limit." }, 413);
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ error: "The submission could not be read. Please try again." }, 400);
    }

    const fields = {
      experienceCategory: textField(form, "experienceCategory", 100) || "Not provided",
      incidentCategory: textField(form, "incidentCategory", 120) || "Not provided",
      place: textField(form, "place", 240) || "Not provided",
      placeCategory: textField(form, "placeCategory", 100) || "Not provided",
      incidentTime: textField(form, "incidentTimeUtc", 40),
      incidentTimeEnd: textField(form, "incidentTimeEndUtc", 40),
      incidentTimeZone: textField(form, "incidentTimeZone", 80) || "UTC",
      locationDetails: textField(form, "locationDetail", 300),
      shortDescription: textField(form, "shortDescription", 240),
      fullDescription: textField(form, "fullDescription", 4000),
      visibility: textField(form, "visibility", 20) || "public",
    };
    if (!fields.shortDescription)
      return json({ error: "Add a quick version before sharing your story." }, 400);
    if (
      fields.experienceCategory !== "Not provided" &&
      fields.incidentCategory !== "Not provided" &&
      !INCIDENT_CATEGORIES_BY_EXPERIENCE[fields.experienceCategory]?.includes(fields.incidentCategory)
    ) {
      return json({ error: "Choose an incident that matches the experience category." }, 400);
    }
    if (!["public", "friends", "anonymous"].includes(fields.visibility)) {
      return json({ error: "Choose who can see this experience before sharing." }, 400);
    }
    if (fields.incidentTime && !Number.isFinite(Date.parse(fields.incidentTime))) {
      return json({ error: "Choose a valid date and time for the experience." }, 400);
    }
    if (
      fields.incidentTimeEnd &&
      (!Number.isFinite(Date.parse(fields.incidentTimeEnd)) ||
        (fields.incidentTime && Date.parse(fields.incidentTimeEnd) <= Date.parse(fields.incidentTime)))
    ) {
      return json({ error: "The end of the time range must be later than its start." }, 400);
    }

    const submittedFiles = form.getAll("evidence");
    if (submittedFiles.some((file) => !(file instanceof File))) {
      return json({ error: "One of the attachments could not be read." }, 400);
    }
    const files = submittedFiles.filter((file) => file.size > 0);
    if (files.length > MAX_FILES) return json({ error: "Attach no more than five files." }, 400);
    if (files.some((file) => !ALLOWED_TYPES.has(file.type))) {
      return json({ error: "Use a supported photo, MP4/WebM/MOV video, PDF, or Word document." }, 415);
    }
    if (files.some((file) => file.size > MAX_FILE_BYTES)) {
      return json({ error: "Each attachment must be 25 MB or smaller." }, 413);
    }
    const totalBytes = files.reduce((total, file) => total + file.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      return json({ error: "Attachments must total 50 MB or less." }, 413);
    }
    let invalidPreview = false;
    const previews = files.map((file, index) => {
      const preview = form.get(`evidencePreview-${index}`);
      if (!(preview instanceof File) || preview.size === 0) return null;
      if (
        (!file.type.startsWith("image/") && !file.type.startsWith("video/")) ||
        file.type === "image/gif" ||
        preview.type !== "image/webp" ||
        preview.size > 1024 * 1024
      ) {
        invalidPreview = true;
        return null;
      }
      return preview;
    });
    if (invalidPreview)
      return json(
        { error: "A media preview could not be processed. Please remove the attachment and try again." },
        400,
      );

    let automaticReview;
    try {
      automaticReview = await moderationEnabled(env);
    } catch (error) {
      console.error("NFD moderation state could not be checked", error);
      return json(
        {
          error:
            "NFD could not verify the safety-review setting. Your story was not shared; please try again.",
        },
        503,
      );
    }
    if (automaticReview) {
      if (!env.GEMINI_API_KEY)
        return json(
          {
            error:
              "Automatic review is enabled but its Gemini key is not connected. Your story was not shared; contact an NFD administrator.",
          },
          503,
        );
      if (textField(form, "aiReviewConsent", 10) !== "yes") {
        return json(
          {
            error:
              "Confirm that you understand Google Gemini will review your story text and attached photos or videos before sharing.",
          },
          400,
        );
      }
      const result = await reviewWithGemini(env, fields, files);
      if (result.error) return json({ error: result.error }, 503);
      const flaggedIndexes = (result.review.flaggedAttachmentIndexes || []).filter(
        (index) => Number.isInteger(index) && index >= 0 && index < files.length,
      );
      if (!result.review.approved || flaggedIndexes.length) {
        const flagged = flaggedIndexes.map((index) => safeFilename(files[index].name));
        await recordActivity(env, user.id, "automatic_review_blocked", "submission", null, {
          attachmentCount: files.length,
          flaggedAttachmentCount: flagged.length,
        });
        return json(
          {
            error:
              result.review.reviewNote.slice(0, 600) || "This draft needs a change before it can be shared.",
            moderation: {
              suggestedShortDescription: String(result.review.suggestedShortDescription || "").slice(0, 240),
              suggestedFullDescription: String(result.review.suggestedFullDescription || "").slice(0, 4000),
              flaggedFiles: flagged,
            },
          },
          422,
        );
      }
    }

    const experienceId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const storedFiles = [];
    try {
      await ensureExperienceOptionColumns(env);
      await retryEvidenceCleanup(env);
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const evidenceId = crypto.randomUUID();
        const objectKey = `evidence/${experienceId}/${evidenceId}`;
        const previewObjectKey = previews[index] ? `evidence/${experienceId}/${evidenceId}-preview` : null;
        const originalFilename = safeFilename(file.name);
        await env.BUCKET.put(objectKey, file.stream(), {
          httpMetadata: { contentType: file.type },
          customMetadata: { experienceId, evidenceId, originalFilename },
        });
        storedFiles.push({
          id: evidenceId,
          objectKey,
          previewObjectKey,
          originalFilename,
          contentType: file.type,
          sizeBytes: file.size,
        });
        if (previewObjectKey)
          await env.BUCKET.put(previewObjectKey, previews[index].stream(), {
            httpMetadata: { contentType: previews[index].type },
          });
      }

      const statements = [
        env.DB.prepare(
          `
        INSERT INTO experiences (
          id, author_id, experience_category, incident_category, place,
          place_category, incident_time, incident_time_end, incident_time_zone, location_details,
          short_description, full_description, visibility, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        ).bind(
          experienceId,
          user.id.slice(0, 200),
          fields.experienceCategory,
          fields.incidentCategory,
          fields.place,
          fields.placeCategory,
          fields.incidentTime ? new Date(fields.incidentTime).toISOString() : "",
          fields.incidentTimeEnd ? new Date(fields.incidentTimeEnd).toISOString() : null,
          fields.incidentTimeZone,
          fields.locationDetails || null,
          fields.shortDescription,
          fields.fullDescription,
          fields.visibility,
          "shared",
          createdAt,
        ),
        ...storedFiles.map((file) =>
          env.DB.prepare(
            `
        INSERT INTO experience_evidence (
          id, experience_id, object_key, preview_object_key, original_filename, content_type, size_bytes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
          ).bind(
            file.id,
            experienceId,
            file.objectKey,
            file.previewObjectKey,
            file.originalFilename,
            file.contentType,
            file.sizeBytes,
            createdAt,
          ),
        ),
      ];
      await env.DB.batch(statements);
    } catch (error) {
      await deleteEvidenceObjects(
        env,
        storedFiles.flatMap((file) => [file.objectKey, file.previewObjectKey]),
      );
      console.error("Experience submission failed", error);
      return json(
        {
          error:
            "NFD couldn’t save your experience right now. Your details are still here; please try again.",
        },
        503,
      );
    }

    await recordActivity(env, user.id, "experience_shared", "experience", experienceId, {
      visibility: fields.visibility,
      automaticReview,
      attachmentCount: storedFiles.length,
      photoCount: storedFiles.filter((file) => file.contentType.startsWith("image/")).length,
      videoCount: storedFiles.filter((file) => file.contentType.startsWith("video/")).length,
      documentCount: storedFiles.filter(
        (file) => !file.contentType.startsWith("image/") && !file.contentType.startsWith("video/"),
      ).length,
    });
    return json({ id: experienceId, status: "shared", createdAt }, 201);
  }

  function textField(form, name, maxLength) {
    const value = form.get(name);
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
  }

  function safeFilename(value) {
    return (
      value
        .replace(/[\\/\r\n\0]/g, "_")
        .replace(/[<>:"|?*]/g, "_")
        .trim()
        .slice(0, 120) || "attachment"
    );
  }

  return {
    listExperiences,
    getProfile,
    deleteOwnExperience,
    serveEvidence,
    updateExperienceReaction,
    handleExperienceComments,
    deleteExperienceComment,
    submitExperience,
  };
}
