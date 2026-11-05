import test from "node:test";
import assert from "node:assert/strict";
import {
  findLocalTestUser,
  getLocalTestUser,
  isLocalTestAuthEnabled,
  LOCAL_TEST_USER_COOKIE,
  LOCAL_TEST_USERS,
} from "../worker/lib/local-test-auth.js";

const request = (url) => new Request(url);

test("local test authentication is enabled for loopback preview hosts", () => {
  assert.equal(isLocalTestAuthEnabled(request("http://127.0.0.1:8787/feed"), {}), true);
  assert.equal(isLocalTestAuthEnabled(request("http://localhost:8787/feed"), {}), true);
  assert.equal(isLocalTestAuthEnabled(request("http://[::1]:8787/feed"), {}), true);
});

test("local test authentication stays disabled for live and network hosts", () => {
  assert.equal(isLocalTestAuthEnabled(request("https://nfd.nofacedocs.com/feed"), {}), false);
  assert.equal(isLocalTestAuthEnabled(request("http://192.168.1.10:8787/feed"), {}), false);
});

test("local test identities include ten regular dummy users and a default tester", () => {
  assert.equal(LOCAL_TEST_USERS.length, 11);
  assert.equal(LOCAL_TEST_USERS[0].id, "local-test-user");
  assert.deepEqual(
    LOCAL_TEST_USERS.slice(1).map(({ name }) => name),
    Array.from({ length: 10 }, (_, index) => `Dummy ${index + 1}`),
  );
  assert.equal(
    LOCAL_TEST_USERS.every((user) => user.email.endsWith("@nfd.invalid")),
    true,
  );
  assert.equal(findLocalTestUser("local-test-dummy-10")?.name, "Dummy 10");
  assert.equal(findLocalTestUser("not-allowlisted"), null);
});

test("local test identity selection accepts only allowlisted cookie values", () => {
  assert.equal(getLocalTestUser(request("http://127.0.0.1:8787/friends")).id, "local-test-user");
  assert.equal(
    getLocalTestUser(
      new Request("http://127.0.0.1:8787/friends", {
        headers: { cookie: `${LOCAL_TEST_USER_COOKIE}=local-test-dummy-03` },
      }),
    ).name,
    "Dummy 3",
  );
  assert.equal(
    getLocalTestUser(
      new Request("http://127.0.0.1:8787/friends", {
        headers: { cookie: `${LOCAL_TEST_USER_COOKIE}=someone-else` },
      }),
    ).id,
    "local-test-user",
  );
});
