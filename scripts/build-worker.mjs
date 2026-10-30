import { copyFileSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { build } from "esbuild";

const root = realpathSync(process.cwd());
const dist = path.resolve(root, "dist");
if (path.dirname(dist) !== root) throw new Error("Build output must stay inside the Site project.");
const manifest = JSON.parse(readFileSync(path.join(root, ".openai/hosting.json"), "utf8"));
if (
  manifest.project_id !== "appgprj_6ae30d1941a08191acf02eca2acb1c0d" ||
  manifest.d1 !== "DB" ||
  manifest.r2 !== "BUCKET" ||
  "static" in manifest
) {
  throw new Error("The Worker build requires the NFD D1 and R2 bindings in .openai/hosting.json.");
}

const appCssBase64 = Buffer.from(
  readFileSync(path.join(root, "web/assets/app.css"), "utf8"),
  "utf8",
).toString("base64");
const appJsBase64 = Buffer.from(readFileSync(path.join(root, "web/assets/app.js"), "utf8"), "utf8").toString(
  "base64",
);
const appCss = Buffer.from(appCssBase64, "base64");
const appJs = Buffer.from(appJsBase64, "base64");
const cssAssetName = `app.${createHash("sha256").update(appCss).digest("hex").slice(0, 12)}.css`;
const jsAssetName = `app.${createHash("sha256").update(appJs).digest("hex").slice(0, 12)}.js`;
const page = readFileSync(path.join(root, "web/index.html"), "utf8")
  .replace("/assets/app.css", `/assets/${cssAssetName}`)
  .replace("/assets/app.js", `/assets/${jsAssetName}`);
const pageBase64 = Buffer.from(page, "utf8").toString("base64");
const privacyPage = readFileSync(path.join(root, "web/privacy.html"), "utf8");
const privacyPageBase64 = Buffer.from(privacyPage, "utf8").toString("base64");
const guidelinesPage = readFileSync(path.join(root, "web/guidelines.html"), "utf8");
const guidelinesPageBase64 = Buffer.from(guidelinesPage, "utf8").toString("base64");
const iconBase64 = readFileSync(path.join(root, "web/nfd-icon.png")).toString("base64");
const workerBuild = await build({
  entryPoints: [path.join(root, "worker/index.js")],
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2022",
  write: false,
});
const worker = workerBuild.outputFiles[0].text;
rmSync(dist, { recursive: true, force: true });
mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
writeFileSync(
  path.join(dist, "server/index.js"),
  `const APP_ICON = Uint8Array.from(atob("${iconBase64}"), (character) => character.charCodeAt(0));\nconst APP_CSS = new TextDecoder().decode(Uint8Array.from(atob("${appCssBase64}"), (character) => character.charCodeAt(0)));\nconst APP_JS = new TextDecoder().decode(Uint8Array.from(atob("${appJsBase64}"), (character) => character.charCodeAt(0)));\nconst PAGE_HTML = new TextDecoder().decode(Uint8Array.from(atob("${pageBase64}"), (character) => character.charCodeAt(0)));\nconst PRIVACY_HTML = new TextDecoder().decode(Uint8Array.from(atob("${privacyPageBase64}"), (character) => character.charCodeAt(0)));\nconst GUIDELINES_HTML = new TextDecoder().decode(Uint8Array.from(atob("${guidelinesPageBase64}"), (character) => character.charCodeAt(0)));\n${worker}`,
);
copyFileSync(path.join(root, ".openai/hosting.json"), path.join(dist, ".openai/hosting.json"));
console.log("Built the NFD Site Worker.");
