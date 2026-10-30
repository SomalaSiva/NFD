import { ensureMessagingTables, ensureStoryTables } from "../db/ensure.js";

export function createSocialRoutes(services) {
  const { getCurrentUser, ensureGhostTables, recordActivity, json, cleanSearchTerm, availableIdentitySql } =
    services;
  async function manageFriends(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to manage your NFD friends." }, 401);
    if (!env.DB) return json({ error: "NFD friends are unavailable right now." }, 503);
    try {
      await ensureStoryTables(env);
      await ensureGhostTables(env);
      if (request.method === "GET") {
        const [friends, incoming, outgoing] = await Promise.all([
          env.DB.prepare(
            `
          SELECT f.id, u.id AS user_id, u.display_name, u.email, u.profile_photo_key, f.created_at
          FROM nfd_friend_requests f
          INNER JOIN nfd_users u ON u.id = CASE WHEN f.from_user_id = ? THEN f.to_user_id ELSE f.from_user_id END
          WHERE f.status = 'accepted' AND (f.from_user_id = ? OR f.to_user_id = ?) AND ${availableIdentitySql}
          ORDER BY lower(COALESCE(u.display_name, u.email))
        `,
          )
            .bind(user.id, user.id, user.id)
            .all(),
          env.DB.prepare(
            `
          SELECT f.id, u.display_name, u.email, NULL AS profile_photo_key, f.created_at
          FROM nfd_friend_requests f INNER JOIN nfd_users u ON u.id = f.from_user_id
          WHERE f.to_user_id = ? AND f.status = 'pending' AND ${availableIdentitySql} ORDER BY f.created_at DESC
        `,
          )
            .bind(user.id)
            .all(),
          env.DB.prepare(
            `
          SELECT f.id, u.display_name, u.email, NULL AS profile_photo_key, f.created_at
          FROM nfd_friend_requests f INNER JOIN nfd_users u ON u.id = f.to_user_id
          WHERE f.from_user_id = ? AND f.status = 'pending' AND ${availableIdentitySql} ORDER BY f.created_at DESC
        `,
          )
            .bind(user.id)
            .all(),
        ]);
        const simplify = (result) =>
          (result.results || []).map((row) => ({
            id: row.id,
            userId: row.user_id || "",
            name: row.display_name || "NFD member",
            email: row.email || "",
            photoUrl: row.profile_photo_key
              ? `/api/profile-photo/${encodeURIComponent(row.user_id || "")}?v=${Date.now()}`
              : "",
            createdAt: row.created_at,
          }));
        return json({
          friends: simplify(friends),
          incoming: simplify(incoming),
          outgoing: simplify(outgoing),
        });
      }

      if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
        return json({ error: "Send the friend’s email address as JSON." }, 415);
      }
      const body = await request.json().catch(() => null);
      const targetUserId = typeof body?.userId === "string" ? body.userId.trim().slice(0, 200) : "";
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      let target;
      if (targetUserId) {
        target = await env.DB.prepare(
          `SELECT u.id FROM nfd_users u WHERE u.id = ? AND ${availableIdentitySql} LIMIT 1`,
        )
          .bind(targetUserId)
          .first();
      } else {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
          return json({ error: "Choose a suggested NFD member or enter a valid email address." }, 400);
        }
        target = await env.DB.prepare(
          `SELECT u.id FROM nfd_users u WHERE lower(u.email) = ? AND ${availableIdentitySql} LIMIT 1`,
        )
          .bind(email)
          .first();
      }
      if (!target || target.id === user.id) {
        return json(
          {
            ok: true,
            message: "If that member can be found on NFD, they’ll see your request in their profile.",
          },
          202,
        );
      }
      const existing = await env.DB.prepare(
        `
      SELECT id, status FROM nfd_friend_requests
      WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
      LIMIT 1
    `,
      )
        .bind(user.id, target.id, target.id, user.id)
        .first();
      if (existing)
        return json({ error: "A friend request is already pending, or you’re already connected." }, 409);
      const requestId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await env.DB.prepare(
        `
      INSERT INTO nfd_friend_requests (id, from_user_id, to_user_id, status, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `,
      )
        .bind(requestId, user.id, target.id, createdAt, createdAt)
        .run();
      await recordActivity(env, user.id, "friend_request_sent", "friend", target.id);
      return json(
        {
          ok: true,
          message: "If that member can be found on NFD, they’ll see your request in their profile.",
        },
        202,
      );
    } catch (error) {
      console.error("NFD friends update failed", error);
      return json({ error: "NFD friends could not be updated right now. Please try again." }, 503);
    }
  }

  async function getAcceptedFriend(env, userId, friendId) {
    // Auth provider subject IDs (for example, "google:123…") are opaque NFD IDs,
    // so do not assume that an account ID is a UUID.
    if (typeof friendId !== "string" || !/^[A-Za-z0-9:_-]{1,200}$/.test(friendId) || friendId === userId)
      return null;
    await ensureGhostTables(env);
    return env.DB.prepare(
      `
    SELECT u.id, COALESCE(NULLIF(trim(u.display_name), ''), 'NFD member') AS name
    FROM nfd_friend_requests f
    INNER JOIN nfd_users u ON u.id = CASE WHEN f.from_user_id = ? THEN f.to_user_id ELSE f.from_user_id END
    WHERE f.status = 'accepted' AND (f.from_user_id = ? OR f.to_user_id = ?)
      AND u.id = ? AND ${availableIdentitySql}
    LIMIT 1
  `,
    )
      .bind(userId, userId, userId, friendId)
      .first();
  }

  async function listMessageThreads(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to open your messages." }, 401);
    if (!env.DB) return json({ error: "NFD messages are unavailable right now." }, 503);
    try {
      await ensureMessagingTables(env);
      await ensureGhostTables(env);
      const now = new Date().toISOString();
      await env.DB.prepare("DELETE FROM nfd_messages WHERE expires_at IS NOT NULL AND expires_at <= ?")
        .bind(now)
        .run();
      const result = await env.DB.prepare(
        `
      SELECT u.id AS user_id, COALESCE(NULLIF(trim(u.display_name), ''), 'NFD member') AS name,
        (SELECT substr(m.body, 1, 100) FROM nfd_messages m
          WHERE ((m.sender_id = ? AND m.recipient_id = u.id) OR (m.sender_id = u.id AND m.recipient_id = ?))
          ORDER BY m.created_at DESC LIMIT 1) AS last_message,
        (SELECT m.created_at FROM nfd_messages m
          WHERE ((m.sender_id = ? AND m.recipient_id = u.id) OR (m.sender_id = u.id AND m.recipient_id = ?))
          ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
        (SELECT COUNT(*) FROM nfd_messages m
          WHERE m.sender_id = u.id AND m.recipient_id = ? AND m.seen_at IS NULL) AS unread_count
      FROM nfd_friend_requests f
      INNER JOIN nfd_users u ON u.id = CASE WHEN f.from_user_id = ? THEN f.to_user_id ELSE f.from_user_id END
      WHERE f.status = 'accepted' AND (f.from_user_id = ? OR f.to_user_id = ?) AND ${availableIdentitySql}
      ORDER BY COALESCE(last_message_at, f.updated_at) DESC, lower(name)
    `,
      )
        .bind(user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id)
        .all();
      return json({
        currentUserId: user.id,
        friends: (result.results || []).map((row) => ({
          id: row.user_id,
          name: row.name,
          lastMessage: row.last_message || "",
          lastMessageAt: row.last_message_at || "",
          unreadCount: Number(row.unread_count) || 0,
        })),
      });
    } catch (error) {
      console.error("NFD message inbox query failed", error);
      return json({ error: "Your messages could not be loaded right now." }, 503);
    }
  }

  async function getFriendMessages(request, env, friendId) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to open your messages." }, 401);
    if (!env.DB) return json({ error: "NFD messages are unavailable right now." }, 503);
    try {
      await ensureMessagingTables(env);
      const friend = await getAcceptedFriend(env, user.id, friendId);
      if (!friend) return json({ error: "Messages are available only between accepted NFD friends." }, 403);
      const now = new Date().toISOString();
      await env.DB.prepare("DELETE FROM nfd_messages WHERE expires_at IS NOT NULL AND expires_at <= ?")
        .bind(now)
        .run();
      const result = await env.DB.prepare(
        `
      SELECT id, sender_id, recipient_id, body, created_at, seen_at, expires_at
      FROM nfd_messages
      WHERE ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
        AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY created_at DESC LIMIT 300
    `,
      )
        .bind(user.id, friend.id, friend.id, user.id, now)
        .all();
      const messages = (result.results || []).reverse().map((row) => ({
        id: row.id,
        senderId: row.sender_id,
        recipientId: row.recipient_id,
        body: row.body,
        createdAt: row.created_at,
        seenAt: row.seen_at || "",
        expiresAt: row.expires_at || "",
      }));
      return json({ friend: { id: friend.id, name: friend.name }, messages });
    } catch (error) {
      console.error("NFD friend conversation query failed", error);
      return json({ error: "This conversation could not be opened right now." }, 503);
    }
  }

  async function sendFriendMessage(request, env, friendId) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to send a message." }, 401);
    if (!env.DB) return json({ error: "NFD messages are unavailable right now." }, 503);
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return json({ error: "Write a text message to send." }, 415);
    }
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > 16000)
      return json({ error: "That message is too long." }, 413);
    try {
      await ensureMessagingTables(env);
      const friend = await getAcceptedFriend(env, user.id, friendId);
      if (!friend) return json({ error: "You can message only accepted NFD friends." }, 403);
      const body = await request.json().catch(() => null);
      const message =
        typeof body?.body === "string"
          ? body.body
              .replace(/\r\n/g, "\n")
              .replace(/\u0000/g, "")
              .trim()
          : "";
      if (!message) return json({ error: "Write a message before sending." }, 400);
      if (message.length > 2000) return json({ error: "Messages can be up to 2,000 characters." }, 400);
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await env.DB.prepare(
        `
      INSERT INTO nfd_messages (id, sender_id, recipient_id, body, created_at, seen_at, expires_at)
      VALUES (?, ?, ?, ?, ?, NULL, NULL)
    `,
      )
        .bind(id, user.id, friend.id, message, createdAt)
        .run();
      return json(
        {
          ok: true,
          message: {
            id,
            senderId: user.id,
            recipientId: friend.id,
            body: message,
            createdAt,
            seenAt: "",
            expiresAt: "",
          },
        },
        201,
      );
    } catch (error) {
      console.error("NFD friend message send failed", error);
      return json({ error: "Your message could not be sent right now." }, 503);
    }
  }

  async function markFriendMessagesSeen(request, env, friendId) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to open your messages." }, 401);
    if (!env.DB) return json({ error: "NFD messages are unavailable right now." }, 503);
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return json({ error: "NFD could not mark those messages as seen." }, 415);
    }
    try {
      await ensureMessagingTables(env);
      const friend = await getAcceptedFriend(env, user.id, friendId);
      if (!friend) return json({ error: "Messages are available only between accepted NFD friends." }, 403);
      const body = await request.json().catch(() => null);
      const messageIds = Array.isArray(body?.messageIds)
        ? [
            ...new Set(body.messageIds.filter((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id))),
          ].slice(0, 50)
        : [];
      if (!messageIds.length) return json({ ok: true, marked: 0 });
      const seenAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const placeholders = messageIds.map(() => "?").join(", ");
      const result = await env.DB.prepare(
        `
      UPDATE nfd_messages SET seen_at = ?, expires_at = ?
      WHERE id IN (${placeholders}) AND sender_id = ? AND recipient_id = ? AND seen_at IS NULL
    `,
      )
        .bind(seenAt, expiresAt, ...messageIds, friend.id, user.id)
        .run();
      return json({ ok: true, marked: Number(result.meta?.changes) || 0, seenAt, expiresAt });
    } catch (error) {
      console.error("NFD message seen update failed", error);
      return json({ error: "NFD could not update the message status right now." }, 503);
    }
  }

  async function suggestNfdFriends(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to find NFD friends." }, 401);
    if (!env.DB) return json({ error: "NFD friend search is unavailable right now." }, 503);
    const query = cleanSearchTerm(new URL(request.url).searchParams.get("q")).slice(0, 80);
    if (query.length < 2) return json({ suggestions: [], minimumCharacters: 2 });
    try {
      await ensureGhostTables(env);
      const result = await env.DB.prepare(
        `
      SELECT u.id, COALESCE(NULLIF(trim(u.display_name), ''), 'NFD member') AS display_name, p.handle
      FROM nfd_users u
      LEFT JOIN nfd_ghost_profiles p ON p.ghost_user_id = u.id AND p.active = 1
      WHERE u.id != ? AND u.active = 1 AND (u.provider != 'ghost' OR p.ghost_user_id IS NOT NULL)
        AND (instr(lower(COALESCE(u.display_name, '')), lower(?)) > 0
          OR instr(lower(substr(u.email, 1, instr(u.email, '@') - 1)), lower(?)) = 1
          OR instr(lower(COALESCE(p.handle, '')), lower(?)) = 1)
        AND NOT EXISTS (
          SELECT 1 FROM nfd_friend_requests f
          WHERE f.status IN ('pending', 'accepted')
            AND ((f.from_user_id = ? AND f.to_user_id = u.id) OR (f.from_user_id = u.id AND f.to_user_id = ?))
        )
      ORDER BY CASE WHEN instr(lower(COALESCE(u.display_name, '')), lower(?)) = 1 THEN 0 ELSE 1 END,
        lower(COALESCE(NULLIF(trim(u.display_name), ''), 'NFD member'))
      LIMIT 8
    `,
      )
        .bind(user.id, query, query, query, user.id, user.id, query)
        .all();
      return json({
        suggestions: (result.results || []).map((row) => ({
          id: row.id,
          name: row.display_name,
          handle: row.handle || "",
        })),
      });
    } catch (error) {
      console.error("NFD friend search failed", error);
      return json({ error: "NFD friend suggestions could not be loaded right now." }, 503);
    }
  }

  async function respondToFriendRequest(request, env, requestId, accept) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to respond to friend requests." }, 401);
    if (!env.DB) return json({ error: "NFD friends are unavailable right now." }, 503);
    try {
      await ensureGhostTables(env);
      const incoming = await env.DB.prepare(
        `
      SELECT f.from_user_id FROM nfd_friend_requests f
      INNER JOIN nfd_users u ON u.id = f.from_user_id
      WHERE f.id = ? AND f.to_user_id = ? AND f.status = 'pending' AND ${availableIdentitySql}
      LIMIT 1
    `,
      )
        .bind(requestId, user.id)
        .first();
      if (!incoming) return json({ error: "That incoming request is no longer available." }, 404);
      const result = await env.DB.prepare(
        `
      UPDATE nfd_friend_requests SET status = ?, updated_at = ?
      WHERE id = ? AND to_user_id = ? AND status = 'pending'
    `,
      )
        .bind(accept ? "accepted" : "rejected", new Date().toISOString(), requestId, user.id)
        .run();
      if (!(Number(result.meta?.changes) > 0))
        return json({ error: "That incoming request is no longer available." }, 404);
      await recordActivity(
        env,
        user.id,
        accept ? "friend_request_accepted" : "friend_request_rejected",
        "friend",
        incoming?.from_user_id || requestId,
      );
      return json({ ok: true, status: accept ? "accepted" : "rejected" });
    } catch (error) {
      console.error("Friend request response failed", error);
      return json({ error: "That friend request could not be updated right now." }, 503);
    }
  }

  async function removeFriendOrRequest(request, env, requestId) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to update NFD friends." }, 401);
    if (!env.DB) return json({ error: "NFD friends are unavailable right now." }, 503);
    try {
      const relationship = await env.DB.prepare(
        `
      SELECT from_user_id, to_user_id, status FROM nfd_friend_requests WHERE id = ? AND (
        (status = 'accepted' AND (from_user_id = ? OR to_user_id = ?)) OR
        (status = 'pending' AND (from_user_id = ? OR to_user_id = ?))
      ) LIMIT 1
    `,
      )
        .bind(requestId, user.id, user.id, user.id, user.id)
        .first();
      const result = await env.DB.prepare(
        `
      DELETE FROM nfd_friend_requests
      WHERE id = ? AND (
        (status = 'accepted' AND (from_user_id = ? OR to_user_id = ?))
        OR (status = 'pending' AND (from_user_id = ? OR to_user_id = ?))
      )
    `,
      )
        .bind(requestId, user.id, user.id, user.id, user.id)
        .run();
      if (!(Number(result.meta?.changes) > 0))
        return json({ error: "That friend or request was not found." }, 404);
      const friendId =
        relationship?.from_user_id === user.id ? relationship?.to_user_id : relationship?.from_user_id;
      await recordActivity(
        env,
        user.id,
        relationship?.status === "accepted" ? "friend_removed" : "friend_request_removed",
        "friend",
        friendId || requestId,
      );
      return json({ ok: true });
    } catch (error) {
      console.error("NFD friend removal failed", error);
      return json({ error: "That friend or request could not be removed right now." }, 503);
    }
  }

  return {
    manageFriends,
    listMessageThreads,
    getFriendMessages,
    sendFriendMessage,
    markFriendMessagesSeen,
    suggestNfdFriends,
    respondToFriendRequest,
    removeFriendOrRequest,
  };
}
