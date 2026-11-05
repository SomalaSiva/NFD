import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const partsDirectory = path.join(root, "web/assets/app/parts");
const partNames = JSON.parse(readFileSync(path.join(partsDirectory, "manifest.json"), "utf8"));

export function assembleAppSource() {
  return partNames.map((partName) => readFileSync(path.join(partsDirectory, partName), "utf8")).join("");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputPath = path.join(root, "web/assets/app.js");
  writeFileSync(outputPath, assembleAppSource(), "utf8");
  console.log(`Assembled ${partNames.length} ordered app source files.`);
}
