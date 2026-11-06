import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createSocialRoutes } from "../worker/routes/social.js";
import { encodeMessageCursor, decodeMessageCursor } from "../worker/lib/message-page.js";

function fixture() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    CREATE TABLE nfd_messages (id TEXT PRIMARY KEY, sender_id TEXT, recipient_id TEXT, body TEXT, created_at TEXT, seen_at TEXT, expires_at TEXT);
    CREATE TABLE nfd_users (id TEXT PRIMARY KEY, display_name TEXT, active INTEGER);
    CREATE TABLE nfd_friend_requests (id TEXT PRIMARY KEY, from_user_id TEXT, to_user_id TEXT, status TEXT, updated_at TEXT);
    INSERT INTO nfd_users VALUES ('me','Me',1),('friend','Friend',1);
    INSERT INTO nfd_friend_requests VALUES ('f','me','friend','accepted','2026-01-01T00:00:00.000Z');
  `);
  const statements = [];
  const db = {
    prepare(sql) {
      statements.push(sql);
      let bindings = [];
      return {
        bind(...values) {
          bindings = values;
          return this;
        },
        async all() {
          return { results: sqlite.prepare(sql).all(...bindings) };
        },
        async first() {
          return sqlite.prepare(sql).get(...bindings) || null;
        },
        async run() {
          const r = sqlite.prepare(sql).run(...bindings);
          return { meta: { changes: Number(r.changes) } };
        },
      };
    },
  };
  const routes = createSocialRoutes({
    getCurrentUser: async () => ({ id: "me" }),
    ensureGhostTables: async () => {},
    json: (body, status = 200) => Response.json(body, { status }),
    availableIdentitySql: "u.active = 1",
  });
  return { sqlite, db, routes, statements };
}
const request = (path) => new Request("http://localhost" + path);
test("message cursors reject invalid and oversized inputs", () => {
  assert.equal(decodeMessageCursor("!"), null);
  assert.equal(decodeMessageCursor("a".repeat(601)), null);
  assert.deepEqual(decodeMessageCursor(encodeMessageCursor("2026-01-01T00:00:00.000Z", "id")), {
    time: "2026-01-01T00:00:00.000Z",
    id: "id",
  });
});
test("conversation paging has no duplicates at timestamp ties and unchanged reads return 304", async () => {
  const { sqlite, db, routes } = fixture();
  await routes.getFriendMessages(request("/api/messages/friend"), { DB: db }, "friend");
  const time = new Date().toISOString();
  const insert = sqlite.prepare(
    "INSERT INTO nfd_messages(id,sender_id,recipient_id,body,created_at) VALUES (?,?,?,?,?)",
  );
  for (let n = 0; n < 76; n++) insert.run(String(n).padStart(4, "0"), "me", "friend", "text " + n, time);
  const response = await routes.getFriendMessages(request("/api/messages/friend"), { DB: db }, "friend");
  const first = await response.json();
  assert.equal(first.messages.length, 50);
  assert.ok(first.nextCursor);
  const second = await (
    await routes.getFriendMessages(
      request("/api/messages/friend?before=" + first.nextCursor),
      { DB: db },
      "friend",
    )
  ).json();
  assert.equal(second.messages.length, 26);
  assert.equal(new Set([...first.messages, ...second.messages].map((m) => m.id)).size, 76);
  const same = await routes.getFriendMessages(
    new Request("http://localhost/api/messages/friend", {
      headers: { "if-none-match": response.headers.get("etag") },
    }),
    { DB: db },
    "friend",
  );
  assert.equal(same.status, 304);
  assert.equal(
    (await routes.getFriendMessages(request("/api/messages/friend?before=bad!"), { DB: db }, "friend"))
      .status,
    400,
  );
  assert.equal(
    (await routes.getFriendMessages(request("/api/messages/stranger"), { DB: db }, "stranger")).status,
    403,
  );
  sqlite.close();
});
test("inbox is bounded, paginated, and excludes private user fields", async () => {
  const { sqlite, db, routes } = fixture();
  for (let n = 0; n < 60; n++) {
    const id = "peer" + String(n).padStart(3, "0");
    sqlite.prepare("INSERT INTO nfd_users VALUES (?,?,1)").run(id, id);
    sqlite
      .prepare("INSERT INTO nfd_friend_requests VALUES (?,?,?,'accepted',?)")
      .run(id, "me", id, "2026-01-01T00:00:00.000Z");
  }
  const first = await (await routes.listMessageThreads(request("/api/messages"), { DB: db })).json();
  assert.equal(first.friends.length, 50);
  assert.ok(first.nextCursor);
  const second = await (
    await routes.listMessageThreads(request("/api/messages?cursor=" + first.nextCursor), { DB: db })
  ).json();
  assert.equal(second.friends.length, 11);
  assert.equal(new Set([...first.friends, ...second.friends].map((f) => f.id)).size, 61);
  assert.ok(first.friends.every((f) => !Object.hasOwn(f, "email")));
  sqlite.close();
});

test("expired messages stay absent and an updated status invalidates conditional reads", async () => {
  const { sqlite, db, routes } = fixture();
  const now = new Date().toISOString();
  sqlite
    .prepare("INSERT INTO nfd_messages VALUES (?,?,?,?,?,?,?)")
    .run("visible", "friend", "me", "hello", now, null, null);
  sqlite
    .prepare("INSERT INTO nfd_messages VALUES (?,?,?,?,?,?,?)")
    .run("expired", "friend", "me", "hidden", now, now, new Date(Date.now() - 1000).toISOString());
  const first = await routes.getFriendMessages(request("/api/messages/friend"), { DB: db }, "friend");
  assert.deepEqual(
    (await first.clone().json()).messages.map((m) => m.id),
    ["visible"],
  );
  sqlite
    .prepare("UPDATE nfd_messages SET seen_at=?, expires_at=? WHERE id='visible'")
    .run(now, new Date(Date.now() + 3600000).toISOString());
  const updated = await routes.getFriendMessages(
    new Request("http://localhost/api/messages/friend", {
      headers: { "if-none-match": first.headers.get("etag") },
    }),
    { DB: db },
    "friend",
  );
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).messages[0].seenAt, now);
  sqlite.close();
});
test("inbox query can use the existing sender and recipient indexes", async () => {
  const { sqlite, db, routes, statements } = fixture();
  sqlite.exec(
    "CREATE INDEX perf_sender_idx ON nfd_messages(sender_id,recipient_id,created_at); CREATE INDEX perf_recipient_idx ON nfd_messages(recipient_id,sender_id,created_at);",
  );
  await routes.listMessageThreads(request("/api/messages"), { DB: db });
  const sql = statements.find((q) => q.includes("WITH visible_messages"));
  const now = new Date().toISOString();
  const plan = sqlite
    .prepare("EXPLAIN QUERY PLAN " + sql)
    .all("me", "me", "me", now, "2020-01-01", "me", "me", "me", "me", 51)
    .map((r) => r.detail)
    .join("\n");
  assert.match(plan, /perf_sender_idx/);
  assert.match(plan, /perf_recipient_idx/);
  sqlite.close();
});
