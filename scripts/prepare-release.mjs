import { execFileSync, spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import path from "node:path";

const root = realpathSync(process.cwd());
const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

try {
  const gitRoot = realpathSync(git(["rev-parse", "--show-toplevel"]));
  if (gitRoot !== root) throw new Error("Run release preparation from the project root checkout.");

  const branch = git(["branch", "--show-current"]);
  if (branch !== "main") throw new Error(`Expected the canonical main checkout; found branch "${branch}".`);

  const dirty = git(["status", "--porcelain", "--untracked-files=no"]);
  if (dirty) throw new Error("Commit or discard tracked changes before preparing a release.");

  const sha = git(["rev-parse", "HEAD"]);
  const remoteSha = git(["rev-parse", "origin/main"]);
  const remoteIsAncestor = spawnSync("git", ["merge-base", "--is-ancestor", "origin/main", "HEAD"], {
    cwd: root,
    stdio: "ignore",
  });
  if (remoteIsAncestor.status !== 0) {
    throw new Error(
      `origin/main (${remoteSha.slice(0, 7)}) is ahead of or diverged from local HEAD (${sha.slice(0, 7)}).`,
    );
  }

  const result = spawnSync(process.execPath, [path.join(root, "scripts", "check-changed.mjs")], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("Fast release checks failed; do not publish this build.");

  execFileSync("git", ["push", "origin", "HEAD:refs/heads/main"], { cwd: root, stdio: "inherit" });

  console.log(`Release source SHA: ${sha}`);
  console.log(`Built artifact: ${path.join(root, "dist", "server", "index.js")}`);
  console.log("Publish this exact pushed source through OpenAI Sites. Do not run wrangler deploy.");
} catch (error) {
  console.error(`Release preparation stopped: ${error.message}`);
  process.exitCode = 1;
}
