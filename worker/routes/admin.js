import { ADMIN_PAGE_SIZE, getPageMetadata, getPageOffset } from "../lib/pagination.js";
import { ensureAdminTable, ensureEmailRestrictionTable } from "../db/ensure.js";

export function createAdminRoutes(services) {
  const {
    getCurrentUser,
    isOwner,
    ownerEmail,
    ensureIdentityTables,
    ensureGhostTables,
    recordActivity,
    ensureModerationTable,
    ensureExperienceOptionColumns,
    ensureEngagementTables,
    retryEvidenceCleanup,
    deleteEvidenceObjects,
    json,
    cleanSearchTerm,
    safeJsonParse,
  } = services;
  async function isRestrictedEmail(env, email) {
    const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normalized) return false;
    await ensureEmailRestrictionTable(env);
    return Boolean(
      await env.DB.prepare("SELECT 1 AS found FROM nfd_blocked_emails WHERE email = ? LIMIT 1")
        .bind(normalized)
        .first(),
    );
  }

  async function manageRestrictedEmails(request, env) {
    const admin = await getCurrentUser(request, env);
    if (!admin) return json({ error: "Sign in to manage restricted emails." }, 401);
    if (!(await isAdmin(request, env)))
      return json({ error: "Only NFD administrators can restrict email accounts." }, 403);
    if (!env.DB) return json({ error: "Email restrictions are unavailable right now." }, 503);
    try {
      await ensureIdentityTables(env);
      await ensureGhostTables(env);
      await ensureEmailRestrictionTable(env);
      if (request.method === "GET") {
        const offset = getPageOffset(request);
        const total = await env.DB.prepare("SELECT COUNT(*) AS total FROM nfd_blocked_emails").first();
        const result = await env.DB.prepare(
          `
        SELECT b.email, b.reason, b.created_at, u.display_name AS created_by_name
        FROM nfd_blocked_emails b LEFT JOIN nfd_users u ON u.id = b.created_by
        ORDER BY b.created_at DESC, b.email ASC LIMIT ? OFFSET ?
      `,
        )
          .bind(ADMIN_PAGE_SIZE, offset)
          .all();
        const rows = result.results || [];
        return json({
          ...getPageMetadata(offset, total?.total, rows.length),
          emails: rows.map((row) => ({
            email: row.email,
            reason: row.reason || "",
            createdAt: row.created_at,
            createdBy: row.created_by_name || "NFD administrator",
          })),
        });
      }
      if (request.method === "POST") {
        if (!request.headers.get("content-type")?.toLowerCase().includes("application/json"))
          return json({ error: "Send an email address as JSON." }, 415);
        const body = await request.json().catch(() => null);
        const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
        const reason =
          typeof body?.reason === "string"
            ? body.reason
                .trim()
                .replace(/[\u0000-\u001f\u007f]/g, "")
                .slice(0, 240)
            : "";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254)
          return json({ error: "Enter a valid email address." }, 400);
        if (email === ownerEmail(env) || email === (admin.email || "").trim().toLowerCase())
          return json({ error: "You cannot restrict your own or the site owner’s email address." }, 400);
        const now = new Date().toISOString();
        await env.DB.prepare(
          `
        INSERT INTO nfd_blocked_emails (email, reason, created_by, created_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET reason = excluded.reason, created_by = excluded.created_by, created_at = excluded.created_at
      `,
        )
          .bind(email, reason, admin.id, now)
          .run();
        const disabled = await env.DB.prepare(
          "UPDATE nfd_users SET active = 0, updated_at = ? WHERE lower(email) = ? AND active != 0",
        )
          .bind(now, email)
          .run();
        await env.DB.prepare(
          "DELETE FROM nfd_sessions WHERE user_id IN (SELECT id FROM nfd_users WHERE lower(email) = ?)",
        )
          .bind(email)
          .run();
        await env.DB.prepare(
          `
        UPDATE nfd_friend_requests SET status = 'rejected', updated_at = ?
        WHERE status = 'pending' AND (
          from_user_id IN (SELECT id FROM nfd_users WHERE lower(email) = ?)
          OR to_user_id IN (SELECT id FROM nfd_users WHERE lower(email) = ?)
          OR from_user_id IN (SELECT p.ghost_user_id FROM nfd_ghost_profiles p WHERE p.owner_user_id IN (SELECT id FROM nfd_users WHERE lower(email) = ?))
          OR to_user_id IN (SELECT p.ghost_user_id FROM nfd_ghost_profiles p WHERE p.owner_user_id IN (SELECT id FROM nfd_users WHERE lower(email) = ?))
        )
      `,
        )
          .bind(now, email, email, email, email)
          .run();
        await recordActivity(env, admin.id, "email_restricted", "email", email, { reason });
        return json({ ok: true, email, deactivatedAccounts: Number(disabled.meta?.changes) || 0 });
      }
      const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase() || "";
      if (!email) return json({ error: "Choose the restricted email address to unblock." }, 400);
      const removed = await env.DB.prepare("DELETE FROM nfd_blocked_emails WHERE email = ? COLLATE NOCASE")
        .bind(email)
        .run();
      if (!(Number(removed.meta?.changes) > 0))
        return json({ error: "That email address was not restricted." }, 404);
      await recordActivity(env, admin.id, "email_unrestricted", "email", email);
      return json({
        ok: true,
        email,
        message: "Email restriction removed. Any deactivated NFD account must be reactivated separately.",
      });
    } catch (error) {
      console.error("NFD restricted email update failed", error);
      return json({ error: "Restricted email settings could not be loaded or updated right now." }, 503);
    }
  }

  async function manageModerationSettings(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to access NFD moderation settings." }, 401);
    try {
      await ensureModerationTable(env);
      if (request.method === "GET") {
        const setting = await env.DB.prepare(
          "SELECT value FROM nfd_moderation_settings WHERE setting_key = 'enabled'",
        ).first();
        return json({ enabled: setting?.value === "true", ready: Boolean(env.GEMINI_API_KEY) });
      }
      if (!(await isAdmin(request, env)))
        return json({ error: "Only NFD administrators can change this setting." }, 403);
      if (!request.headers.get("content-type")?.toLowerCase().includes("application/json"))
        return json({ error: "Send the moderation setting as JSON." }, 415);
      const body = await request.json().catch(() => null);
      if (typeof body?.enabled !== "boolean")
        return json({ error: "Choose whether automatic review is on or off." }, 400);
      if (body.enabled && !env.GEMINI_API_KEY)
        return json(
          {
            error:
              "Add the Gemini API key to NFD’s private runtime settings before enabling automatic review.",
          },
          409,
        );
      await env.DB.prepare(
        "UPDATE nfd_moderation_settings SET value = ?, updated_at = ? WHERE setting_key = 'enabled'",
      )
        .bind(String(body.enabled), new Date().toISOString())
        .run();
      await recordActivity(
        env,
        user.id,
        body.enabled ? "moderation_enabled" : "moderation_disabled",
        "settings",
      );
      return json({ enabled: body.enabled, ready: Boolean(env.GEMINI_API_KEY) });
    } catch (error) {
      console.error("NFD moderation settings failed", error);
      return json({ error: "Moderation settings could not be loaded or saved right now." }, 503);
    }
  }

  async function listActivityAudit(request, env) {
    if (!(await getCurrentUser(request, env)))
      return json({ error: "Sign in to view account activity." }, 401);
    if (!(await isOwner(request, env)))
      return json({ error: "Only the NFD owner can view account activity." }, 403);
    if (!env.DB) return json({ error: "Account activity is unavailable right now." }, 503);
    try {
      await ensureIdentityTables(env);
      const offset = getPageOffset(request);
      const total = await env.DB.prepare("SELECT COUNT(*) AS total FROM nfd_activity_audit").first();
      const result = await env.DB.prepare(
        `
      SELECT a.id, a.action, a.target_type, a.target_id, a.details_json, a.created_at,
        u.email, u.display_name
      FROM nfd_activity_audit a
      INNER JOIN nfd_users u ON u.id = a.actor_user_id
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT ? OFFSET ?
    `,
      )
        .bind(ADMIN_PAGE_SIZE, offset)
        .all();
      const rows = result.results || [];
      return json({
        ...getPageMetadata(offset, total?.total, rows.length),
        activities: rows.map((row) => ({
          id: row.id,
          action: row.action,
          targetType: row.target_type,
          targetId: row.target_id,
          details: safeJsonParse(row.details_json) || {},
          createdAt: row.created_at,
          email: row.email || "",
          displayName: row.display_name || "",
        })),
      });
    } catch (error) {
      console.error(
        "NFD activity audit query failed",
        error instanceof Error ? error.message : String(error),
      );
      return json({ error: "Account activity could not be loaded right now." }, 503);
    }
  }

  async function isAdmin(request, env) {
    const email = (await getCurrentUser(request, env))?.email?.trim().toLowerCase();
    if (!email) return false;
    if (await isOwner(request, env)) return true;
    try {
      await ensureAdminTable(env);
      return Boolean(
        await env.DB.prepare("SELECT email FROM nfd_admin_users WHERE email = ? LIMIT 1").bind(email).first(),
      );
    } catch (error) {
      console.error("Admin access lookup failed", error);
      return false;
    }
  }

  async function manageAdmins(request, env) {
    const actor = await getCurrentUser(request, env);
    if (!actor) {
      return json({ error: "Sign in to manage NFD administrator access." }, 401);
    }
    if (!(await isOwner(request, env))) {
      return json({ error: "Only the NFD owner can add or remove administrators." }, 403);
    }
    try {
      await ensureAdminTable(env);
      if (request.method === "GET") {
        const result = await env.DB.prepare(
          "SELECT email, added_at FROM nfd_admin_users ORDER BY added_at ASC",
        ).all();
        return json({ ownerEmail: ownerEmail(env), admins: result.results || [] });
      }
      if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
        return json({ error: "Send the administrator email as JSON." }, 415);
      }
      const body = await request.json().catch(() => null);
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
        return json({ error: "Enter a valid email address." }, 400);
      }
      if (email === ownerEmail(env)) {
        return json({ error: "The owner already has permanent administrator access." }, 400);
      }
      await env.DB.prepare(
        "INSERT OR IGNORE INTO nfd_admin_users (email, added_by, added_at) VALUES (?, ?, ?)",
      )
        .bind(email, ownerEmail(env), new Date().toISOString())
        .run();
      await recordActivity(env, actor.id, "admin_access_granted", "admin", email);
      const result = await env.DB.prepare(
        "SELECT email, added_at FROM nfd_admin_users ORDER BY added_at ASC",
      ).all();
      return json({ ownerEmail: ownerEmail(env), admins: result.results || [] }, 201);
    } catch (error) {
      console.error("Admin access update failed", error);
      return json({ error: "Administrator access could not be updated right now." }, 503);
    }
  }

  async function removeAdmin(request, env) {
    const actor = await getCurrentUser(request, env);
    if (!actor) {
      return json({ error: "Sign in to manage NFD administrator access." }, 401);
    }
    if (!(await isOwner(request, env))) {
      return json({ error: "Only the NFD owner can add or remove administrators." }, 403);
    }
    const email = cleanSearchTerm(new URL(request.url).searchParams.get("email")).toLowerCase();
    if (!email || email === ownerEmail(env))
      return json({ error: "That administrator cannot be removed." }, 400);
    try {
      await ensureAdminTable(env);
      await env.DB.prepare("DELETE FROM nfd_admin_users WHERE email = ?").bind(email).run();
      await recordActivity(env, actor.id, "admin_access_removed", "admin", email);
      const result = await env.DB.prepare(
        "SELECT email, added_at FROM nfd_admin_users ORDER BY added_at ASC",
      ).all();
      return json({ ownerEmail: ownerEmail(env), admins: result.results || [] });
    } catch (error) {
      console.error("Admin access removal failed", error);
      return json({ error: "Administrator access could not be updated right now." }, 503);
    }
  }

  async function listNfdUsers(request, env) {
    const actor = await getCurrentUser(request, env);
    if (!actor) {
      return json({ error: "Sign in to view NFD members." }, 401);
    }
    if (!(await isOwner(request, env))) {
      return json({ error: "Only the NFD owner can view the member directory." }, 403);
    }
    if (!env.DB) return json({ error: "The NFD member directory is unavailable right now." }, 503);
    try {
      await ensureIdentityTables(env);
      await ensureGhostTables(env);
      const offset = getPageOffset(request);
      const total = await env.DB.prepare("SELECT COUNT(*) AS total FROM nfd_users").first();
      const result = await env.DB.prepare(
        `
      SELECT u.id, u.provider_subject, u.email, u.display_name, u.provider, u.created_at, u.updated_at, u.active,
        (SELECT MAX(a.created_at) FROM nfd_activity_audit a WHERE a.actor_user_id = u.id) AS last_activity_at,
        COUNT(e.id) AS shared_post_count
      FROM nfd_users u
      LEFT JOIN experiences e ON e.author_id = u.id AND e.status = 'shared'
      GROUP BY u.id, u.provider_subject, u.email, u.display_name, u.provider, u.created_at, u.updated_at, u.active
      ORDER BY u.created_at DESC, u.id DESC
      LIMIT ? OFFSET ?
    `,
      )
        .bind(ADMIN_PAGE_SIZE, offset)
        .all();
      const users = result.results || [];
      return json({
        ...getPageMetadata(offset, total?.total, users.length),
        users: users.map((user) => ({
          email: user.email || "",
          displayName: user.display_name || "",
          provider: user.provider,
          active: Number(user.active) === 1,
          canDeactivate: user.id !== actor.id,
          accountId: user.id,
          providerSubject: user.provider_subject,
          joinedAt: user.created_at,
          updatedAt: user.updated_at,
          lastActivityAt: user.last_activity_at || "",
          sharedPostCount: Number(user.shared_post_count) || 0,
        })),
      });
    } catch (error) {
      console.error("NFD member directory query failed", error);
      return json({ error: "The NFD member directory could not be loaded right now." }, 503);
    }
  }

  async function updateAccountStatus(request, env) {
    const actor = await getCurrentUser(request, env);
    if (!actor) return json({ error: "Sign in to manage NFD accounts." }, 401);
    if (!(await isOwner(request, env)))
      return json({ error: "Only the NFD owner can deactivate or reactivate accounts." }, 403);
    if (!env.DB) return json({ error: "NFD account settings are unavailable right now." }, 503);
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return json({ error: "Send an account and its active status as JSON." }, 415);
    }
    const body = await request.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId.trim().slice(0, 200) : "";
    if (!userId || typeof body?.active !== "boolean")
      return json({ error: "Choose an account and whether it should be active." }, 400);
    if (userId === actor.id) return json({ error: "The site owner account cannot be deactivated." }, 400);
    try {
      await ensureIdentityTables(env);
      await ensureGhostTables(env);
      const target = await env.DB.prepare("SELECT id, email, active FROM nfd_users WHERE id = ? LIMIT 1")
        .bind(userId)
        .first();
      if (!target) return json({ error: "That NFD account could not be found." }, 404);
      if ((target.email || "").trim().toLowerCase() === ownerEmail(env)) {
        return json({ error: "The site owner account cannot be deactivated." }, 400);
      }
      const active = body.active ? 1 : 0;
      const updatedAt = new Date().toISOString();
      await env.DB.prepare("UPDATE nfd_users SET active = ?, updated_at = ? WHERE id = ?")
        .bind(active, updatedAt, target.id)
        .run();
      if (!active) {
        await env.DB.prepare("DELETE FROM nfd_sessions WHERE user_id = ?").bind(target.id).run();
        await env.DB.prepare(
          `
        UPDATE nfd_friend_requests SET status = 'rejected', updated_at = ?
        WHERE status = 'pending' AND (from_user_id = ? OR to_user_id = ?)
      `,
        )
          .bind(updatedAt, target.id, target.id)
          .run();
      }
      await recordActivity(
        env,
        actor.id,
        active ? "account_reactivated" : "account_deactivated",
        "account",
        target.id,
      );
      return json({ ok: true, userId: target.id, active: Boolean(active) });
    } catch (error) {
      console.error(
        "NFD account status update failed",
        error instanceof Error ? error.message : String(error),
      );
      return json({ error: "NFD account status could not be updated right now." }, 503);
    }
  }

  async function manageAdminExperiences(request, env) {
    const admin = await getCurrentUser(request, env);
    if (!admin) return json({ error: "Sign in to manage shared posts." }, 401);
    if (!(await isAdmin(request, env)))
      return json({ error: "Only NFD administrators can manage shared posts." }, 403);
    if (!env.DB || !env.BUCKET) return json({ error: "Post storage is unavailable right now." }, 503);
    try {
      await ensureExperienceOptionColumns(env);
      await ensureEngagementTables(env);
      await retryEvidenceCleanup(env);
      if (request.method === "GET") {
        const query = cleanSearchTerm(new URL(request.url).searchParams.get("q"));
        const offset = getPageOffset(request);
        const searchBindings = [query, query, query, query, query, query];
        const total = await env.DB.prepare(
          `
        SELECT COUNT(*) AS total FROM experiences e LEFT JOIN nfd_users u ON u.id = e.author_id
        WHERE e.status = 'shared' AND (? = '' OR instr(lower(COALESCE(u.display_name, '')), lower(?)) > 0
          OR instr(lower(COALESCE(u.email, '')), lower(?)) > 0
          OR instr(lower(e.short_description), lower(?)) > 0 OR instr(lower(e.full_description), lower(?)) > 0
          OR instr(lower(e.place), lower(?)) > 0)
      `,
        )
          .bind(...searchBindings)
          .first();
        const result = await env.DB.prepare(
          `
        SELECT e.id, e.author_id, e.short_description, e.full_description, e.experience_category,
          e.incident_category, e.place, e.visibility, e.created_at, u.display_name, u.email,
          u.provider, u.active
        FROM experiences e LEFT JOIN nfd_users u ON u.id = e.author_id
        WHERE e.status = 'shared' AND (? = '' OR instr(lower(COALESCE(u.display_name, '')), lower(?)) > 0
          OR instr(lower(COALESCE(u.email, '')), lower(?)) > 0
          OR instr(lower(e.short_description), lower(?)) > 0 OR instr(lower(e.full_description), lower(?)) > 0
          OR instr(lower(e.place), lower(?)) > 0)
        ORDER BY e.created_at DESC, e.id DESC LIMIT ? OFFSET ?
      `,
        )
          .bind(...searchBindings, ADMIN_PAGE_SIZE, offset)
          .all();
        const rows = result.results || [];
        return json({
          ...getPageMetadata(offset, total?.total, rows.length),
          posts: rows.map((row) => ({
            id: row.id,
            authorId: row.author_id,
            authorName: row.display_name || "NFD member",
            authorEmail: row.email || "",
            provider: row.provider || "unknown",
            authorActive: Number(row.active) === 1,
            shortDescription: row.short_description,
            fullDescription: row.full_description,
            experienceCategory: row.experience_category,
            incidentCategory: row.incident_category,
            place: row.place,
            visibility: row.visibility,
            createdAt: row.created_at,
          })),
        });
      }
      if (!request.headers.get("content-type")?.toLowerCase().includes("application/json"))
        return json({ error: "Send the post ID as JSON." }, 415);
      const body = await request.json().catch(() => null);
      const experienceId = typeof body?.experienceId === "string" ? body.experienceId.trim() : "";
      if (!/^[0-9a-f-]{36}$/i.test(experienceId)) return json({ error: "Choose a valid shared post." }, 400);
      const post = await env.DB.prepare(
        "SELECT id, author_id FROM experiences WHERE id = ? AND status = 'shared' LIMIT 1",
      )
        .bind(experienceId)
        .first();
      if (!post) return json({ error: "That shared post could not be found." }, 404);
      const evidence = await env.DB.prepare(
        "SELECT object_key, preview_object_key FROM experience_evidence WHERE experience_id = ?",
      )
        .bind(experienceId)
        .all();
      await recordActivity(env, admin.id, "admin_post_deleted", "experience", experienceId, {
        authorId: post.author_id,
      });
      const removed = await env.DB.batch([
        env.DB.prepare("DELETE FROM experience_reactions WHERE experience_id = ?").bind(experienceId),
        env.DB.prepare("DELETE FROM experience_comments WHERE experience_id = ?").bind(experienceId),
        env.DB.prepare("DELETE FROM experience_evidence WHERE experience_id = ?").bind(experienceId),
        env.DB.prepare("DELETE FROM experiences WHERE id = ? AND status = 'shared'").bind(experienceId),
      ]);
      if (!(Number(removed[3]?.meta?.changes) > 0))
        return json({ error: "That shared post could not be found." }, 404);
      const cleanupPending = await deleteEvidenceObjects(
        env,
        (evidence.results || []).flatMap((file) => [file.object_key, file.preview_object_key]),
      );
      if (cleanupPending)
        console.error("Some evidence could not be removed after admin post deletion", experienceId);
      return json({ ok: true, cleanupPending });
    } catch (error) {
      console.error("Admin post management failed", error);
      return json({ error: "Shared posts could not be loaded or deleted right now." }, 503);
    }
  }

  return {
    isAdmin,
    isRestrictedEmail,
    manageRestrictedEmails,
    manageModerationSettings,
    manageAdmins,
    removeAdmin,
    listActivityAudit,
    listNfdUsers,
    updateAccountStatus,
    manageAdminExperiences,
  };
}
