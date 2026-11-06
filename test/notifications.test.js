import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createNotificationRoutes, notificationSchema } from "../worker/routes/notifications.js";

function setup({ user = { id: "alice" }, fail = false } = {}) {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE nfd_users(id TEXT PRIMARY KEY, display_name TEXT, active INTEGER, email TEXT);
    CREATE TABLE nfd_friend_requests(id TEXT PRIMARY KEY, from_user_id TEXT, to_user_id TEXT, status TEXT, created_at TEXT, updated_at TEXT);
    CREATE TABLE nfd_messages(id TEXT PRIMARY KEY, sender_id TEXT, recipient_id TEXT, body TEXT, created_at TEXT, seen_at TEXT, expires_at TEXT);
    INSERT INTO nfd_users VALUES ('alice','Alice',1,'private-a@example.com'),('bob','Bob',1,'private-b@example.com'),('other','Other',1,'private-o@example.com');
    INSERT INTO nfd_friend_requests VALUES ('pair','bob','alice','accepted','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');`);
  for (const sql of notificationSchema) db.exec(sql);
  const statements = [];
  const DB = {
    prepare(sql) {
      let values = [];
      const stmt = {
        bind(...args) {
          values = args;
          return stmt;
        },
        async first() {
          if (fail) throw new Error("database offline");
          return db.prepare(sql).get(...values);
        },
        async all() {
          if (fail) throw new Error("database offline");
          statements.push({ sql, values });
          return { results: db.prepare(sql).all(...values) };
        },
        async run() {
          return db.prepare(sql).run(...values);
        },
      };
      return stmt;
    },
  };
  const routes = createNotificationRoutes({
    getCurrentUser: async () => user,
    availableIdentitySql: "u.active = 1",
    ensure: async () => {},
  });
  const request = (query = "") =>
    routes.handle(new Request("https://nfd.test/api/notifications" + query), { DB });
  function message(id, sender = "bob", recipient = "alice", { seen = null, expires = null } = {}) {
    db.prepare("INSERT INTO nfd_messages VALUES (?,?,?,?,?,?,?)").run(
      id,
      sender,
      recipient,
      "secret message body",
      new Date(Date.now() - 10000).toISOString(),
      seen,
      expires,
    );
  }
  return { db, DB, routes, request, message, statements };
}
test("notifications require authentication and fail closed when database is unavailable", async () => {
  const h = setup({ user: null });
  assert.equal((await h.request()).status, 401);
  const routes = createNotificationRoutes({
    getCurrentUser: async () => ({ id: "alice" }),
    availableIdentitySql: "u.active = 1",
  });
  assert.equal((await routes.handle(new Request("https://nfd.test/api/notifications"), {})).status, 503);
});
test("notification types are recipient-scoped and exclude private email and message body", async () => {
  const h = setup();
  h.db.exec(`INSERT INTO nfd_friend_requests VALUES
    ('incoming','other','alice','pending','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z'),
    ('accepted','alice','other','accepted','2026-01-01T00:00:00.000Z','2026-01-02T00:00:00.000Z');`);
  h.message("m1");
  h.message("other-message", "alice", "bob");
  const result = await (await h.request()).json();
  assert.deepEqual(new Set(result.items.map((x) => x.kind)), new Set(["message", "request", "accepted"]));
  assert.equal(result.items.length, 3);
  assert.ok(
    result.items.every(
      (x) => !JSON.stringify(x).includes("private-") && !JSON.stringify(x).includes("secret message"),
    ),
  );
  assert.ok(result.items.some((x) => x.href === "/messages?friend=bob"));
  assert.equal(result.items.find((x) => x.kind === "request").href, "/profile?tab=requests");
});
test("stable keyset pages return at most 30 with no duplicates at tied timestamps", async () => {
  const h = setup();
  for (let i = 0; i < 65; i++) h.message("m" + String(i).padStart(3, "0"));
  h.db.prepare("UPDATE nfd_messages SET created_at = ?").run(new Date(Date.now() - 10000).toISOString());
  let cursor = "",
    ids = [];
  do {
    const result = await (await h.request(cursor ? "?cursor=" + encodeURIComponent(cursor) : "")).json();
    assert.ok(result.items.length <= 30);
    ids.push(...result.items.map((x) => x.id));
    cursor = result.nextCursor;
  } while (cursor);
  assert.equal(ids.length, 65);
  assert.equal(new Set(ids).size, 65);
});
test("unread summary caps at 100 and excludes seen, expired and unavailable senders", async () => {
  const h = setup();
  for (let i = 0; i < 110; i++) h.message("m" + i);
  assert.equal((await (await h.request("?summary=1")).json()).unreadCount, 100);
  h.db.exec("UPDATE nfd_messages SET seen_at = '2026-01-01'");
  assert.equal((await (await h.request("?summary=1")).json()).unreadCount, 0);
  h.message("expired", "bob", "alice", { expires: "2026-01-01" });
  assert.equal((await (await h.request("?summary=1")).json()).unreadCount, 0);
  h.message("active");
  h.db.exec("UPDATE nfd_users SET active=0 WHERE id='bob'");
  assert.equal((await (await h.request("?summary=1")).json()).unreadCount, 0);
});
test("mark-read state is user-scoped, monotonic, and does not mark chat messages seen", async () => {
  const h = setup();
  h.message("m");
  const snapshot = new Date(Date.now() - 5000).toISOString();
  const post = (readAt) =>
    h.routes.handle(
      new Request("https://nfd.test/api/notifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ readAt, userId: "bob" }),
      }),
      { DB: h.DB },
    );
  assert.equal((await post(snapshot)).status, 200);
  assert.equal((await post("2020-01-01T00:00:00.000Z")).status, 200);
  assert.equal((await (await h.request("?summary=1")).json()).unreadCount, 0);
  assert.equal(h.db.prepare("SELECT seen_at FROM nfd_messages").get().seen_at, null);
  assert.equal(
    h.db.prepare("SELECT read_at FROM nfd_notification_state WHERE user_id='bob'").get(),
    undefined,
  );
  assert.equal(h.db.prepare("SELECT read_at FROM nfd_notification_state").get().read_at, snapshot);
  h.message("new");
  h.db.prepare("UPDATE nfd_messages SET created_at=? WHERE id='new'").run(new Date().toISOString());
  assert.equal((await (await h.request("?summary=1")).json()).unreadCount, 1);
});
test("invalid cursors and future read markers are rejected", async () => {
  const h = setup();
  assert.equal((await h.request("?cursor=invalid")).status, 400);
  assert.equal((await h.request("?cursor=" + "a".repeat(601))).status, 400);
  const r = await h.routes.handle(
    new Request("https://nfd.test/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ readAt: "2999-01-01T00:00:00.000Z" }),
    }),
    { DB: h.DB },
  );
  assert.equal(r.status, 400);
});
test("notification failures return 503 rather than empty success", async () => {
  const h = setup({ fail: true });
  assert.equal((await h.request()).status, 503);
});
test("SQLite uses recipient notification indexes", async () => {
  const h = setup();
  h.message("m");
  await h.request();
  const { sql, values } = h.statements.at(-1);
  const plan = h.db
    .prepare("EXPLAIN QUERY PLAN " + sql)
    .all(...values)
    .map((row) => row.detail)
    .join("\n");
  assert.match(plan, /nfd_friend_notifications_accepted_idx/);
  assert.match(plan, /nfd_friend_notifications_incoming_idx/);
  assert.match(plan, /nfd_message_notifications_idx/);
});
