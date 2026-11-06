import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source = readFileSync(new URL("../worker/index.js", import.meta.url), "utf8");
const auth = source.slice(
  source.indexOf("const authenticatedRequests"),
  source.indexOf("async function getGoogleActivitySigningKey"),
);
function fixture({ active = 1, restricted = false, known = true } = {}) {
  let writes = 0,
    reads = 0;
  let account = known ? { id: "tester", email: "tester@nfd.invalid", active } : null;
  const context = {
    WeakMap,
    Date,
    console,
    getCookie: () => "",
    GOOGLE_SESSION_COOKIE: "session",
    CHATGPT_IDLE_COOKIE: "idle",
    ensureIdentityTables: async () => {},
    adminRoutes: { isRestrictedEmail: async () => restricted },
    recordActivity: async () => {},
  };
  vm.createContext(context);
  vm.runInContext(auth + ";this.getAuth=getAuthenticatedUser;", context);
  const env = {
    DB: {
      prepare() {
        return {
          bind() {
            return this;
          },
          async first() {
            reads++;
            return account;
          },
          async run() {
            writes++;
            account = { id: "tester", email: "tester@nfd.invalid", active: 1 };
          },
        };
      },
    },
  };
  const request = () =>
    new Request("http://localhost/api/auth-status", {
      headers: {
        "oai-authenticated-user-id": "tester",
        "oai-authenticated-user-email": "tester@nfd.invalid",
      },
    });
  return {
    get: context.getAuth,
    env,
    request,
    counts: () => ({ writes, reads }),
    deactivate: () => {
      account.active = 0;
    },
  };
}
test("authentication reuses work only within one request and avoids unchanged identity writes", async () => {
  const f = fixture(),
    request = f.request();
  const [a, b] = await Promise.all([f.get(request, f.env), f.get(request, f.env)]);
  assert.equal(a.id, "tester");
  assert.equal(b.id, "tester");
  assert.deepEqual(f.counts(), { writes: 0, reads: 1 });
  f.deactivate();
  assert.equal(await f.get(f.request(), f.env), null);
  assert.equal(f.counts().reads, 2);
});
test("new users are persisted once and restricted identities remain blocked", async () => {
  const f = fixture({ known: false });
  assert.equal((await f.get(f.request(), f.env)).id, "tester");
  assert.equal(f.counts().writes, 1);
  const blocked = fixture({ restricted: true });
  assert.equal(await blocked.get(blocked.request(), blocked.env), null);
  assert.equal(blocked.counts().writes, 0);
});
