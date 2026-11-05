import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const normalize = (file) => file.replaceAll("\\", "/");
const isProjectFile = (file) =>
  /^(?:worker|web|scripts|test|db|drizzle)\//.test(file) ||
  /^(?:\.gitignore|AGENTS\.md|README\.md|package\.json|package-lock\.json|eslint\.config\.js|wrangler\.jsonc)$/.test(
    file,
  );
const run = (label, command, args) => {
  console.log(`\n${label}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed.`);
};

const testMap = new Map([
  ["web/assets/app.js", ["test/app-source-bundle.test.js", "test/trust-score.test.js"]],
  [
    "worker/routes/experiences.js",
    [
      "test/experience-edit.test.js",
      "test/experience-feed-poll.test.js",
      "test/profile-post-pagination.test.js",
    ],
  ],
  ["worker/routes/social.js", ["test/friend-discovery.test.js", "test/agreements.test.js"]],
  ["worker/routes/agreements.js", ["test/agreements.test.js"]],
  ["worker/routes/admin.js", ["test/admin-directory.test.js"]],
  ["worker/routes/stories.js", ["test/story-routes.test.js"]],
  ["worker/routes/trust-score.js", ["test/trust-score-routes.test.js", "test/trust-score.test.js"]],
  ["worker/lib/fetch-retry.js", ["test/fetch-retry.test.js"]],
  ["worker/index.js", ["test/local-test-auth.test.js", "test/session.test.js"]],
]);

try {
  const changed = new Set(
    [
      ...git(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]).split(/\r?\n/),
      ...git(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "HEAD"]).split(/\r?\n/),
      ...git(["ls-files", "--others", "--exclude-standard"]).split(/\r?\n/),
    ]
      .filter(Boolean)
      .map(normalize)
      .filter(isProjectFile),
  );

  if (!changed.size) {
    const lastCommitFiles = git(["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"]);
    for (const file of lastCommitFiles.split(/\r?\n/).filter(Boolean)) changed.add(normalize(file));
  }

  if (!changed.size) throw new Error("No changed files found in the working tree or latest commit.");
  console.log(`Checking ${changed.size} changed file(s).`);

  const appPartsChanged = [...changed].some((file) => /^web\/assets\/app\/parts\/.*\.js$/.test(file));
  if (appPartsChanged) {
    run("Assemble screen source", process.execPath, [path.join(root, "scripts/assemble-app.mjs")]);
    changed.add("web/assets/app.js");
  }

  const eslintFiles = [...changed].filter(
    (file) =>
      /\.(?:js|mjs|cjs)$/.test(file) && !file.includes("/dist/") && !/^web\/assets\/app\/parts\//.test(file),
  );
  if (eslintFiles.length) {
    const eslintCli = path.join(root, "node_modules", "eslint", "bin", "eslint.js");
    if (!existsSync(eslintCli)) throw new Error("ESLint is not installed. Run npm ci first.");
    run("Focused lint", process.execPath, [eslintCli, ...eslintFiles]);
  }

  const formatFiles = [...changed].filter(
    (file) =>
      /\.(?:js|mjs|cjs|css|html|ts|json|jsonc|md)$/.test(file) &&
      file !== "web/assets/app.js" &&
      !/^web\/assets\/app\/parts\//.test(file),
  );
  if (formatFiles.length) {
    const prettierCli = path.join(root, "node_modules", "prettier", "bin", "prettier.cjs");
    if (!existsSync(prettierCli)) throw new Error("Prettier is not installed. Run npm ci first.");
    run("Focused formatting check", process.execPath, [prettierCli, "--check", ...formatFiles]);
  }

  const tests = new Set([...changed].filter((file) => /^test\/.*\.test\.js$/.test(file)));
  let fullSuite = [...changed].some((file) =>
    /^(?:db\/|drizzle\/|worker\/db\/|package-lock\.json$)/.test(file),
  );
  for (const file of changed) {
    for (const testFile of testMap.get(file) || []) tests.add(testFile);
    if (/^web\/assets\/app\/parts\/.*\.js$/.test(file)) {
      for (const testFile of testMap.get("web/assets/app.js") || []) tests.add(testFile);
    }
  }

  if (fullSuite) {
    run("Data-layer regression suite", process.execPath, ["--test"]);
  } else if (tests.size) {
    const existingTests = [...tests].filter((file) => existsSync(path.join(root, file)));
    run("Focused feature tests", process.execPath, ["--test", ...existingTests]);
  } else {
    console.log("No mapped automated test for these files. Do the affected-flow smoke check before release.");
  }

  run("Production build", process.execPath, [path.join(root, "scripts", "build-worker.mjs")]);
} catch (error) {
  console.error(`Focused check stopped: ${error.message}`);
  process.exitCode = 1;
}
