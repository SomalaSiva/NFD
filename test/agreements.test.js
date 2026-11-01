import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { createAgreementRoutes } from "../worker/routes/agreements.js";

function setup({ user = { id: "user-1" } } = {}) {
  return createAgreementRoutes({
    getCurrentUser: async () => user,
    json: (body, status = 200) => Response.json(body, { status }),
    recordActivity: async () => {},
    availableIdentitySql: "u.active = 1",
    cleanSearchTerm: (value) => (typeof value === "string" ? value : ""),
  });
}

function request(body, headers = { "content-type": "application/json" }) {
  return new Request("https://nfd.test/api/trust-score/agreement-draft", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

test("agreement generator requires a signed-in user", async () => {
  const routes = setup({ user: null });
  const response = await routes.generateDraft(
    request({ description: "Borrow a bicycle", geminiConsent: true }),
    {
      GEMINI_API_KEY: "test-key",
    },
  );

  assert.equal(response.status, 401);
  assert.match((await response.json()).error, /sign in/i);
});

test("agreement generator validates consent, description, and request type", async () => {
  const routes = setup();
  const env = { GEMINI_API_KEY: "test-key" };

  assert.equal(
    (await routes.generateDraft(request({ description: "", geminiConsent: true }), env)).status,
    400,
  );
  assert.equal((await routes.generateDraft(request({ description: "Borrow a bicycle" }), env)).status, 400);
  assert.equal(
    (await routes.generateDraft(request({ description: "A".repeat(3001), geminiConsent: true }), env)).status,
    413,
  );
  assert.equal(
    (
      await routes.generateDraft(
        request({ description: "Borrow a bicycle", geminiConsent: true }, { "content-type": "text/plain" }),
        env,
      )
    ).status,
    415,
  );
});

test("agreement generator sends the brief to Gemini and returns the editable draft", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  let sentRequest;
  globalThis.fetch = async (url, options) => {
    sentRequest = { url, options };
    return Response.json({
      candidates: [
        { content: { parts: [{ text: "Bicycle Loan Agreement\n\n[Party A]" }] }, finishReason: "STOP" },
      ],
    });
  };

  const routes = setup();
  const response = await routes.generateDraft(
    request({ description: "Lend a bicycle for a week", geminiConsent: true }),
    { GEMINI_API_KEY: "test-key" },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).draft, "Bicycle Loan Agreement\n\n[Party A]");
  assert.match(sentRequest.url, /gemini-3\.1-flash-lite:generateContent$/);
  assert.equal(sentRequest.options.headers["x-goog-api-key"], "test-key");
  assert.match(sentRequest.options.body, /Lend a bicycle for a week/);
  assert.match(sentRequest.options.body, /Never invent names/);
});

test("agreement generator reports missing credentials and provider errors safely", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  t.after(() => {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  });
  console.error = () => {};
  const routes = setup();

  assert.equal(
    (await routes.generateDraft(request({ description: "Borrow a bicycle", geminiConsent: true }), {}))
      .status,
    503,
  );

  globalThis.fetch = async () => Response.json({ error: "provider details" }, { status: 429 });
  const response = await routes.generateDraft(
    request({ description: "Borrow a bicycle", geminiConsent: true }),
    { GEMINI_API_KEY: "test-key" },
  );
  assert.equal(response.status, 503);
  assert.doesNotMatch((await response.json()).error, /provider details/i);
});

test("stored agreements require sign-in and validate a title, body, and NFD approver", async () => {
  const routes = setup({ user: null });
  const response = await routes.listStoredAgreements(
    new Request("https://nfd.test/api/trust-score/agreements"),
    {
      DB: {},
    },
  );
  assert.equal(response.status, 401);

  const signedIn = setup();
  const invalid = await signedIn.createStoredAgreement(
    request({ title: "", body: "Agreement text", participantIds: [] }),
    { DB: {} },
  );
  assert.equal(invalid.status, 400);
  assert.match((await invalid.json()).error, /title/i);

  const noApprover = await signedIn.createStoredAgreement(
    request({ title: "Loan", body: "Agreement text", participantIds: ["user-1"] }),
    { DB: {} },
  );
  assert.equal(noApprover.status, 400);
  assert.match((await noApprover.json()).error, /at least one/i);
});

test("agreement responses accept only approve or decline decisions", async () => {
  const routes = setup();
  const response = await routes.respondToStoredAgreement(
    request({ decision: "edit" }),
    { DB: {} },
    "b6eaa238-918a-4a35-a57b-20e3283f2fb5",
  );
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /approve or decline/i);
});

test("outcome reports require a signed-in user and validate report categories", async () => {
  const routes = setup({ user: null });
  const unauthenticated = await routes.reportAgreementOutcome(
    request({ outcome: "completed" }),
    { DB: {} },
    "b6eaa238-918a-4a35-a57b-20e3283f2fb5",
  );
  assert.equal(unauthenticated.status, 401);

  const signedIn = setup();
  const invalid = await signedIn.reportAgreementOutcome(
    request({ outcome: "innocent" }),
    { DB: {} },
    "b6eaa238-918a-4a35-a57b-20e3283f2fb5",
  );
  assert.equal(invalid.status, 400);
  assert.match((await invalid.json()).error, /valid outcome/i);
});

test("outcome disagreements require an explanation and support confirm or dispute only", async () => {
  const routes = setup();
  const agreementId = "b6eaa238-918a-4a35-a57b-20e3283f2fb5";
  const base = { DB: {} };
  const missingNote = await routes.respondToAgreementOutcome(
    request({ outcomeId: "outcome-1", decision: "dispute" }),
    base,
    agreementId,
  );
  assert.equal(missingNote.status, 400);
  assert.match((await missingNote.json()).error, /explanation/i);

  const invalidDecision = await routes.respondToAgreementOutcome(
    request({ outcomeId: "outcome-1", decision: "ignore" }),
    base,
    agreementId,
  );
  assert.equal(invalidDecision.status, 400);
  assert.match((await invalidDecision.json()).error, /confirm or disagree/i);
});

test("participants can record a disagreement and the count remains separate from confirmed outcomes", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const migration = await readFile(
    new URL("../drizzle/0009_trust_agreement_outcomes.sql", import.meta.url),
    "utf8",
  );
  sqlite.exec(`
    CREATE TABLE nfd_users (id TEXT PRIMARY KEY, display_name TEXT, active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE nfd_ghost_profiles (ghost_user_id TEXT, handle TEXT, active INTEGER);
    CREATE TABLE nfd_agreements (
      id TEXT PRIMARY KEY, created_by TEXT NOT NULL, status TEXT NOT NULL,
      current_version INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE nfd_agreement_versions (
      id TEXT PRIMARY KEY, agreement_id TEXT NOT NULL, version INTEGER NOT NULL, title TEXT NOT NULL,
      body TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE nfd_agreement_participants (
      agreement_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL,
      status TEXT NOT NULL, accepted_version INTEGER, created_at TEXT NOT NULL, responded_at TEXT
    );
    ${migration.replaceAll("--> statement-breakpoint", "")}
    INSERT INTO nfd_users VALUES ('user-1', 'Alex', 1), ('user-2', 'Sam', 1), ('user-3', 'Jo', 1);
    INSERT INTO nfd_ghost_profiles VALUES ('user-3', 'jotest', 1);
    INSERT INTO nfd_agreements VALUES
      ('agreement-1', 'user-1', 'active', 1, '2026-10-01', '2026-10-01');
    INSERT INTO nfd_agreement_versions VALUES
      ('version-1', 'agreement-1', 1, 'Shared project', 'Terms', 'user-1', '2026-10-01');
    INSERT INTO nfd_agreement_participants VALUES
      ('agreement-1', 'user-1', 'creator', 'accepted', 1, '2026-10-01', '2026-10-01'),
      ('agreement-1', 'user-2', 'participant', 'accepted', 1, '2026-10-01', '2026-10-01'),
      ('agreement-1', 'user-3', 'participant', 'accepted', 1, '2026-10-01', '2026-10-01');
  `);

  const database = {
    prepare(sql) {
      let values = [];
      return {
        bind(...parameters) {
          values = parameters;
          return this;
        },
        all() {
          return { results: sqlite.prepare(sql).all(...values) };
        },
        first() {
          return sqlite.prepare(sql).get(...values) || null;
        },
        run() {
          return { meta: { changes: Number(sqlite.prepare(sql).run(...values).changes) } };
        },
      };
    },
    async batch(statements) {
      return statements.map((statement) => statement.run());
    },
  };
  let activeUserId = "user-1";
  const routes = createAgreementRoutes({
    getCurrentUser: async () => ({ id: activeUserId }),
    json: (body, status = 200) => Response.json(body, { status }),
    recordActivity: async () => {},
    availableIdentitySql: "u.active = 1",
    cleanSearchTerm: (value) => (typeof value === "string" ? value : ""),
  });
  const env = { DB: database };
  const agreementId = "agreement-1";

  const report = await routes.reportAgreementOutcome(
    request({ outcome: "delayed", note: "The delivery happened after the agreed date." }),
    env,
    agreementId,
  );
  assert.equal(report.status, 201);
  const { outcomeId } = await report.json();

  activeUserId = "user-2";
  const dispute = await routes.respondToAgreementOutcome(
    request({ outcomeId, decision: "dispute", note: "We agreed on a different delivery date." }),
    env,
    agreementId,
  );
  assert.equal(dispute.status, 200);

  activeUserId = "user-3";
  const confirm = await routes.respondToAgreementOutcome(
    request({ outcomeId, decision: "confirm" }),
    env,
    agreementId,
  );
  assert.equal(confirm.status, 200);

  const listing = await routes.listStoredAgreements(
    new Request("https://nfd.test/api/trust-score/agreements"),
    env,
  );
  const result = await listing.json();
  assert.equal(result.summary.disputed, 1);
  assert.equal(result.summary.confirmed, 0);
  assert.equal(result.agreements[0].outcomes[0].status, "disputed");
  assert.equal(result.agreements[0].outcomes[0].responses.length, 2);
  assert.match(result.agreements[0].outcomes[0].responses[0].name, /Sam|Jo/);

  const createAgreement = async (id) => {
    sqlite
      .prepare("INSERT INTO nfd_agreements VALUES (?, 'user-1', 'active', 1, '2026-10-02', '2026-10-02')")
      .run(id);
    sqlite
      .prepare(
        "INSERT INTO nfd_agreement_versions VALUES (?, ?, 1, 'Repeat work', 'Terms', 'user-1', '2026-10-02')",
      )
      .run(`version-${id}`, id);
    sqlite
      .prepare(
        "INSERT INTO nfd_agreement_participants VALUES (?, 'user-1', 'creator', 'accepted', 1, '2026-10-02', '2026-10-02')",
      )
      .run(id);
    sqlite
      .prepare(
        "INSERT INTO nfd_agreement_participants VALUES (?, 'user-2', 'participant', 'accepted', 1, '2026-10-02', '2026-10-02')",
      )
      .run(id);
    const outcomeResponse = await routes.reportAgreementOutcome(request({ outcome: "completed" }), env, id);
    assert.equal(outcomeResponse.status, 201);
    const { outcomeId: completedOutcomeId } = await outcomeResponse.json();
    activeUserId = "user-2";
    const confirmResponse = await routes.respondToAgreementOutcome(
      request({ outcomeId: completedOutcomeId, decision: "confirm" }),
      env,
      id,
    );
    assert.equal(confirmResponse.status, 200);
    activeUserId = "user-1";
  };
  activeUserId = "user-1";
  await createAgreement("agreement-2");
  await createAgreement("agreement-3");
  const updatedListing = await routes.listStoredAgreements(
    new Request("https://nfd.test/api/trust-score/agreements"),
    env,
  );
  const updated = await updatedListing.json();
  assert.equal(updated.summary.completed, 2, "repeat agreements with the same person count separately");
  assert.equal(updated.summary.confirmed, 2);

  const search = await routes.searchAgreementParticipants(
    new Request("https://nfd.test/api/trust-score/agreement-people?q=jo"),
    env,
  );
  const searchResult = await search.json();
  assert.deepEqual(searchResult.people, [{ userId: "user-3", name: "Jo", handle: "jotest" }]);
  assert.equal(JSON.stringify(searchResult).includes("@gmail"), false);
  const savedForNonFriend = await routes.createStoredAgreement(
    new Request("https://nfd.test/api/trust-score/agreements", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "NFD-wide approval", body: "Terms", participantIds: ["user-3"] }),
    }),
    env,
  );
  assert.equal(savedForNonFriend.status, 201, "any active NFD member may be selected, not only friends");
  const saved = await savedForNonFriend.json();
  assert.equal(
    sqlite
      .prepare("SELECT COUNT(*) AS count FROM nfd_agreement_participants WHERE agreement_id = ?")
      .get(saved.agreementId).count,
    2,
  );
  sqlite.close();
});
