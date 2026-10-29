import { copyFileSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = realpathSync(process.cwd());
const dist = path.resolve(root, "dist");
if (path.dirname(dist) !== root) throw new Error("Build output must stay inside the Site project.");
const manifest = JSON.parse(readFileSync(path.join(root, ".openai/hosting.json"), "utf8"));
if (manifest.project_id !== "appgprj_6ae30d1941a08191acf02eca2acb1c0d" || manifest.d1 !== "DB" || manifest.r2 !== "BUCKET" || "static" in manifest) {
  throw new Error("The Worker build requires the NFD D1 and R2 bindings in .openai/hosting.json.");
}

const page = readFileSync(path.join(root, "web/index.html"), "utf8");
const pageBase64 = Buffer.from(page, "utf8").toString("base64");
const privacyPage = readFileSync(path.join(root, "web/privacy.html"), "utf8");
const privacyPageBase64 = Buffer.from(privacyPage, "utf8").toString("base64");
const worker = readFileSync(path.join(root, "worker/index.js"), "utf8");
rmSync(dist, { recursive: true, force: true });
mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
writeFileSync(path.join(dist, "server/index.js"), `const PAGE_HTML = new TextDecoder().decode(Uint8Array.from(atob("${pageBase64}"), (character) => character.charCodeAt(0)));\nconst PRIVACY_HTML = new TextDecoder().decode(Uint8Array.from(atob("${privacyPageBase64}"), (character) => character.charCodeAt(0)));\n${worker}`);
copyFileSync(path.join(root, ".openai/hosting.json"), path.join(dist, ".openai/hosting.json"));
console.log("Built the NFD Site Worker.");
