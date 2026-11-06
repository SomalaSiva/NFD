import { ensureGhostTables, ensureStoryTables, ensureMessagingTables } from "../db/ensure.js";

export const notificationSchema = [
  "CREATE TABLE IF NOT EXISTS nfd_notification_state (user_id TEXT PRIMARY KEY NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE, read_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS nfd_notification_reads (user_id TEXT NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE, notification_id TEXT NOT NULL, read_at TEXT NOT NULL, PRIMARY KEY (user_id, notification_id))",
  "CREATE INDEX IF NOT EXISTS nfd_friend_notifications_accepted_idx ON nfd_friend_requests(from_user_id, status, updated_at, id)",
  "CREATE INDEX IF NOT EXISTS nfd_friend_notifications_incoming_idx ON nfd_friend_requests(to_user_id, status, created_at, id)",
  "CREATE INDEX IF NOT EXISTS nfd_message_notifications_idx ON nfd_messages(recipient_id, created_at, id)",
];
const ready = new WeakMap();
async function ensureNotifications(env) {
  if (!ready.has(env.DB))
    ready.set(
      env.DB,
      (async () => {
        await ensureStoryTables(env);
        await ensureGhostTables(env);
        await ensureMessagingTables(env);
        for (const sql of notificationSchema) await env.DB.prepare(sql).run();
      })().catch((error) => {
        ready.delete(env.DB);
        throw error;
      }),
    );
  await ready.get(env.DB);
}

export function createNotificationRoutes({
  getCurrentUser,
  availableIdentitySql,
  ensure = ensureNotifications,
}) {
  function sources(userId, now, after, before, cursorId, limit, unreadOnly) {
    const cutoff = new Date(Date.parse(now) - 90 * 86400000).toISOString();
    const definitions = [
      {
        kind: "request",
        table: "nfd_friend_requests",
        actor: "from_user_id",
        owner: "to_user_id",
        time: "created_at",
        filter: "n.status = 'pending'",
      },
      {
        kind: "accepted",
        table: "nfd_friend_requests",
        actor: "to_user_id",
        owner: "from_user_id",
        time: "updated_at",
        filter: "n.status = 'accepted'",
      },
      {
        kind: "message",
        table: "nfd_messages",
        actor: "sender_id",
        owner: "recipient_id",
        time: "created_at",
        filter: `(n.expires_at IS NULL OR n.expires_at > ?) AND n.created_at > ?
          ${unreadOnly ? "AND n.seen_at IS NULL" : ""}
          AND EXISTS (SELECT 1 FROM nfd_friend_requests f WHERE f.status = 'accepted'
            AND ((f.from_user_id = n.sender_id AND f.to_user_id = n.recipient_id)
              OR (f.to_user_id = n.sender_id AND f.from_user_id = n.recipient_id)))`,
      },
    ];
    return definitions.map((d) => {
      const eventId = `('${d.kind}:' || n.id)`;
      return {
        sql: `SELECT * FROM (SELECT ${eventId} AS id, '${d.kind}' AS kind,
          n.${d.actor} AS actorId, COALESCE(NULLIF(trim(u.display_name), ''), 'NFD member') AS name,
          n.${d.time} AS createdAt, ${d.kind === "message" ? "n.seen_at" : "NULL"} AS seenAt
          FROM ${d.table} n JOIN nfd_users u ON u.id = n.${d.actor}
          WHERE n.${d.owner} = ? AND ${d.filter} AND ${availableIdentitySql}
            AND n.${d.time} > ? AND n.${d.time} <= ?
            AND (n.${d.time} < ? OR (n.${d.time} = ? AND ${eventId} < ?))
          ORDER BY n.${d.time} DESC, n.id DESC LIMIT ?) `,
        values: [
          userId,
          ...(d.kind === "message" ? [now, cutoff] : []),
          after,
          now,
          before,
          before,
          cursorId,
          limit,
        ],
      };
    });
  }
  async function handle(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) return Response.json({ error: "Sign in to view notifications." }, { status: 401 });
    if (!env.DB) return Response.json({ error: "Notifications are unavailable." }, { status: 503 });
    try {
      const now = new Date().toISOString();
      const url = new URL(request.url);
      let cursor = [now, "~"];
      if (url.searchParams.has("cursor")) {
        try {
          const raw = url.searchParams.get("cursor");
          if (raw.length > 600) throw new Error();
          cursor = JSON.parse(atob(raw));
          if (
            !Array.isArray(cursor) ||
            cursor.length !== 2 ||
            typeof cursor[0] !== "string" ||
            !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(cursor[0]) ||
            !Number.isFinite(Date.parse(cursor[0])) ||
            new Date(cursor[0]).toISOString() !== cursor[0] ||
            typeof cursor[1] !== "string" ||
            cursor[1].length > 250
          )
            throw new Error();
        } catch {
          return Response.json({ error: "Invalid notification cursor." }, { status: 400 });
        }
      }
      if (request.method === "POST") {
        if (!request.headers.get("content-type")?.includes("application/json"))
          return Response.json({ error: "Expected JSON." }, { status: 415 });
        const body = await request.json().catch(() => null);
        if (
          typeof body?.notificationId === "string" &&
          /^(request|accepted|message):[0-9a-f-]{1,100}$/i.test(body.notificationId)
        ) {
          await ensure(env);
          await env.DB.prepare(
            "INSERT OR IGNORE INTO nfd_notification_reads (user_id, notification_id, read_at) VALUES (?, ?, ?)",
          )
            .bind(user.id, body.notificationId, now)
            .run();
          return Response.json({ ok: true });
        }
        const readAt = body?.readAt;
        if (
          typeof readAt !== "string" ||
          !Number.isFinite(Date.parse(readAt)) ||
          new Date(readAt).toISOString() !== readAt ||
          readAt > now
        ) {
          return Response.json({ error: "Invalid notification date." }, { status: 400 });
        }
        await ensure(env);
        await env.DB.prepare(
          "INSERT INTO nfd_notification_state (user_id, read_at) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET read_at = MAX(nfd_notification_state.read_at, excluded.read_at)",
        )
          .bind(user.id, readAt)
          .run();
        return Response.json({ ok: true });
      }
      await ensure(env);
      const state = await env.DB.prepare("SELECT read_at FROM nfd_notification_state WHERE user_id = ?")
        .bind(user.id)
        .first();
      const readAt = state?.read_at || "";
      const summary = url.searchParams.get("summary") === "1";
      const parts = sources(
        user.id,
        now,
        summary ? readAt : "",
        cursor[0],
        cursor[1],
        summary ? 100 : 31,
        summary,
      );
      const sql = `SELECT * FROM (${parts.map((p) => p.sql).join(" UNION ALL ")}) ORDER BY createdAt DESC, id DESC LIMIT ?`;
      const result = await env.DB.prepare(sql)
        .bind(...parts.flatMap((p) => p.values), summary ? 100 : 31)
        .all();
      const rows = result.results || [];
      if (summary) {
        const unread = rows.filter(
          (row) => row.createdAt > readAt && (row.kind !== "message" || !row.seenAt),
        );
        const ids = unread.map((row) => row.id);
        const read = ids.length
          ? await env.DB.prepare(
              `SELECT notification_id FROM nfd_notification_reads WHERE user_id = ? AND notification_id IN (${ids.map(() => "?").join(",")})`,
            )
              .bind(user.id, ...ids)
              .all()
          : { results: [] };
        return Response.json(
          { unreadCount: Math.max(0, unread.length - (read.results || []).length) },
          { headers: { "cache-control": "no-store" } },
        );
      }
      const items = rows.slice(0, 30).map((row) => ({
        id: row.id,
        kind: row.kind,
        name: row.name,
        createdAt: row.createdAt,
        unread: row.createdAt > readAt && (row.kind !== "message" || !row.seenAt),
        href:
          row.kind === "message"
            ? `/messages?friend=${encodeURIComponent(row.actorId)}`
            : row.kind === "request"
              ? "/profile?tab=requests"
              : "/profile?tab=friends",
      }));
      const last = items.at(-1);
      const unreadIds = items.filter((item) => item.unread).map((item) => item.id);
      if (unreadIds.length) {
        const read = await env.DB.prepare(
          `SELECT notification_id FROM nfd_notification_reads WHERE user_id = ? AND notification_id IN (${unreadIds.map(() => "?").join(",")})`,
        )
          .bind(user.id, ...unreadIds)
          .all();
        const readIds = new Set((read.results || []).map((row) => row.notification_id));
        items.forEach((item) => {
          if (readIds.has(item.id)) item.unread = false;
        });
      }
      return Response.json(
        {
          items,
          snapshotAt: now,
          nextCursor: rows.length > 30 ? btoa(JSON.stringify([last.createdAt, last.id])) : null,
        },
        { headers: { "cache-control": "no-store" } },
      );
    } catch (error) {
      console.error("Notifications failed", error);
      return Response.json(
        { error: "Notifications could not be loaded. Please try again." },
        { status: 503 },
      );
    }
  }
  return { handle };
}
