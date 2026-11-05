import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assembleAppSource } from "../scripts/assemble-app.mjs";

const generatedBundle = await readFile(new URL("../web/assets/app.js", import.meta.url), "utf8");

test("screen source parts assemble into the unchanged classic app bundle", () => {
  assert.equal(assembleAppSource(), generatedBundle);
  assert.match(generatedBundle, /^const picker = document\.getElementById\("evidence-files"\);/);
  assert.match(generatedBundle, /if \(location\.pathname === "\/login"\)/);
  assert.match(generatedBundle, /if \(location\.pathname === "\/share"\)/);
  assert.match(generatedBundle, /async function updateNavigation\(\)/);
});
