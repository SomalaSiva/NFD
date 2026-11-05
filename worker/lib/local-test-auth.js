const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
export const LOCAL_TEST_USER_COOKIE = "nfd_local_test_user";
export const LOCAL_TEST_USERS = Object.freeze([
  { id: "local-test-user", name: "Local test user", email: "local-test@nfd.invalid" },
  ...Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return {
      id: `local-test-dummy-${String(number).padStart(2, "0")}`,
      name: `Dummy ${number}`,
      email: `dummy-${number}@nfd.invalid`,
    };
  }),
]);

export function getLocalTestUser(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const selectedId = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCAL_TEST_USER_COOKIE}=`))
    ?.slice(LOCAL_TEST_USER_COOKIE.length + 1);
  return LOCAL_TEST_USERS.find((user) => user.id === selectedId) || LOCAL_TEST_USERS[0];
}

export function findLocalTestUser(id) {
  return LOCAL_TEST_USERS.find((user) => user.id === id) || null;
}

export function isLocalTestAuthEnabled(request, env) {
  void env;
  try {
    const hostname = new URL(request.url).hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return LOCAL_HOSTS.has(hostname);
  } catch {
    return false;
  }
}
