import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createSocialRoutes } from "../worker/routes/social.js";

const currentUser = { id: "current-user", provider: "google" };

function makeMember(index) {
  return { id: `member-${index}`, display_name: `Member ${index}`, handle: null };
}

function setup(rows, { user = currentUser, databaseAvailable = true, queryError = null } = {}) {
  const statements = [];
  const routes = createSocialRoutes({
    getCurrentUser: async () => user,
    ensureGhostTables: async () => {},
    recordActivity: async () => {},
    json: (payload, status = 200) => Response.json(payload, { status }),
    cleanSearchTerm: (value) => value || "",
    availableIdentitySql: "u.active = 1",
  });
  const DB = {
    prepare(sql) {
      const statement = { sql, values: [] };
      statements.push(statement);
      return {
        bind(...values) {
          statement.values = values;
          return this;
        },
        async all() {
          if (queryError) throw queryError;
          return { results: rows(statement) };
        },
      };
    },
  };
  return { routes, env: databaseAvailable ? { DB } : {}, statements };
}

test("friend discovery shows 20 members and returns the next page offset", async () => {
  const { routes, env, statements } = setup(() =>
    Array.from({ length: 21 }, (_, index) => makeMember(index + 1)),
  );
  const response = await routes.suggestNfdFriends(
    new Request("https://nfd.test/api/friends/suggestions"),
    env,
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.suggestions.length, 20);
  assert.equal(result.nextOffset, 20);
  assert.equal(result.suggestions[0].id, "member-1");
  assert.equal("email" in result.suggestions[0], false);
  assert.match(statements[0].sql, /LIMIT \? OFFSET \?/);
  assert.match(statements[0].sql, /ORDER BY\s+u\.display_name COLLATE NOCASE, u\.id/);
  assert.match(statements[0].sql, /f\.status IN \('pending', 'accepted'\)/);
  assert.deepEqual(statements[0].values, [currentUser.id, currentUser.id, currentUser.id, 21, 0]);
});

test("friend discovery searches names and ghost IDs and stops when no more members remain", async () => {
  const { routes, env, statements } = setup(() => [makeMember(21), makeMember(22)]);
  const response = await routes.suggestNfdFriends(
    new Request("https://nfd.test/api/friends/suggestions?q=ghost&offset=20"),
    env,
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.suggestions.length, 2);
  assert.equal(result.nextOffset, null);
  assert.match(statements[0].sql, /p\.handle LIKE/);
  assert.match(statements[0].sql, /u\.display_name LIKE \? ESCAPE '!'/);
  assert.match(statements[0].sql, /p\.handle LIKE \? ESCAPE '!'/);
  assert.doesNotMatch(statements[0].sql, /instr\(lower\(/);
  assert.doesNotMatch(statements[0].sql, /u\.email/);
  assert.deepEqual(statements[0].values, [
    currentUser.id,
    "ghost%",
    "ghost%",
    currentUser.id,
    currentUser.id,
    "ghost%",
    21,
    20,
  ]);
});

test("friend discovery requires two characters for a search but allows browsing without a query", async () => {
  const { routes, env, statements } = setup(() => []);
  const response = await routes.suggestNfdFriends(
    new Request("https://nfd.test/api/friends/suggestions?q=x"),
    env,
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(result, { suggestions: [], nextOffset: null, minimumCharacters: 2 });
  assert.equal(statements.length, 0);
});

test("friend discovery does not query the database for signed-out users", async () => {
  const { routes, env, statements } = setup(() => [], { user: null });
  const response = await routes.suggestNfdFriends(
    new Request("https://nfd.test/api/friends/suggestions"),
    env,
  );

  assert.equal(response.status, 401);
  assert.equal(statements.length, 0);
});

test("friend discovery reports a missing database without throwing", async () => {
  const { routes, env, statements } = setup(() => [], { databaseAvailable: false });
  const response = await routes.suggestNfdFriends(
    new Request("https://nfd.test/api/friends/suggestions"),
    env,
  );

  assert.equal(response.status, 503);
  assert.equal(statements.length, 0);
});

test("friend search escapes LIKE wildcards, caps input and bounds large offsets", async () => {
  const { routes, env, statements } = setup(() => []);
  const longQuery = `${"a".repeat(78)}%_!extra`;
  const response = await routes.suggestNfdFriends(
    new Request(
      `https://nfd.test/api/friends/suggestions?q=${encodeURIComponent(longQuery)}&offset=999999999`,
    ),
    env,
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(result, { suggestions: [], nextOffset: null });
  assert.equal(statements[0].values[1], `${"a".repeat(78)}!%!_%`);
  assert.equal(statements[0].values.at(-1), 10_000);
  assert.equal(statements[0].values.at(-2), 21);
});

test("friend discovery stops pagination at the bounded offset ceiling", async () => {
  const { routes, env } = setup(() => Array.from({ length: 21 }, (_, index) => makeMember(index + 1)));
  const response = await routes.suggestNfdFriends(
    new Request("https://nfd.test/api/friends/suggestions?offset=10000"),
    env,
  );
  const result = await response.json();

  assert.equal(result.suggestions.length, 20);
  assert.equal(result.nextOffset, null);
});

test("friend discovery returns a temporary error when the database query fails", async (t) => {
  t.mock.method(console, "error", () => {});
  const { routes, env, statements } = setup(() => [], { queryError: new Error("unavailable") });
  const response = await routes.suggestNfdFriends(
    new Request("https://nfd.test/api/friends/suggestions"),
    env,
  );
  const result = await response.json();

  assert.equal(response.status, 503);
  assert.deepEqual(result, { error: "NFD friend suggestions could not be loaded right now." });
  assert.equal(statements.length, 1);
});

test("unfiltered friend discovery uses its indexed name ordering against SQLite", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    CREATE TABLE nfd_users (id TEXT PRIMARY KEY, provider TEXT NOT NULL, display_name TEXT, active INTEGER NOT NULL);
    CREATE INDEX nfd_users_active_name_idx ON nfd_users (active, display_name COLLATE NOCASE, id);
    CREATE TABLE nfd_ghost_profiles (ghost_user_id TEXT, handle TEXT, active INTEGER);
    CREATE TABLE nfd_friend_requests (from_user_id TEXT, to_user_id TEXT, status TEXT);
    CREATE INDEX nfd_friend_requests_from_status_idx ON nfd_friend_requests (from_user_id, status, to_user_id);
    CREATE INDEX nfd_friend_requests_to_status_idx ON nfd_friend_requests (to_user_id, status, from_user_id);
  `);
  const insertUser = sqlite.prepare(
    "INSERT INTO nfd_users (id, provider, display_name, active) VALUES (?, 'google', ?, 1)",
  );
  insertUser.run(currentUser.id, "Current user");
  for (let index = 1; index <= 25; index += 1) {
    insertUser.run(`member-${index}`, `Member ${String(index).padStart(2, "0")}`);
  }
  sqlite.prepare("INSERT INTO nfd_friend_requests VALUES (?, ?, 'accepted')").run(currentUser.id, "member-1");

  const statements = [];
  const routes = createSocialRoutes({
    getCurrentUser: async () => currentUser,
    ensureGhostTables: async () => {},
    recordActivity: async () => {},
    json: (payload, status = 200) => Response.json(payload, { status }),
    cleanSearchTerm: (value) => value || "",
    availableIdentitySql: "u.active = 1",
  });
  const env = {
    DB: {
      prepare(sql) {
        const statement = { sql, values: [] };
        statements.push(statement);
        return {
          bind(...values) {
            statement.values = values;
            return this;
          },
          async all() {
            return { results: sqlite.prepare(sql).all(...statement.values) };
          },
        };
      },
    },
  };

  try {
    const response = await routes.suggestNfdFriends(
      new Request("https://nfd.test/api/friends/suggestions"),
      env,
    );
    const result = await response.json();
    const browsePlan = sqlite
      .prepare(`EXPLAIN QUERY PLAN ${statements.at(-1).sql}`)
      .all(...statements.at(-1).values)
      .map((row) => row.detail)
      .join(" ");
    const searchResponse = await routes.suggestNfdFriends(
      new Request("https://nfd.test/api/friends/suggestions?q=Member%201"),
      env,
    );
    const searchResult = await searchResponse.json();
    const searchPlan = sqlite
      .prepare(`EXPLAIN QUERY PLAN ${statements.at(-1).sql}`)
      .all(...statements.at(-1).values)
      .map((row) => row.detail)
      .join(" ");

    assert.equal(response.status, 200);
    assert.equal(result.suggestions.length, 20);
    assert.equal(result.suggestions[0].id, "member-2");
    assert.equal(result.nextOffset, 20);
    assert.equal(searchResponse.status, 200);
    assert.equal(searchResult.suggestions.length, 10);
    assert.equal(searchResult.suggestions[0].id, "member-10");
    assert.equal(searchResult.nextOffset, null);
    assert.match(browsePlan, /nfd_users_active_name_idx/);
    assert.match(searchPlan, /nfd_users_active_name_idx/);
  } finally {
    sqlite.close();
  }
});
