const baseUrl = (process.env.NFD_LIVE_URL || "https://nfd.nofacedocs.com").replace(/\/$/, "");
const routes = ["/", "/feed", "/messages", "/profile", "/trust-score"];

const results = await Promise.all(
  routes.map(async (route) => {
    const response = await fetch(new URL(route, baseUrl), {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    return { route, status: response.status, ok: response.ok };
  }),
);

for (const result of results) {
  console.log(`${result.ok ? "PASS" : "FAIL"} ${result.status} ${result.route}`);
}

if (results.some((result) => !result.ok)) process.exitCode = 1;
