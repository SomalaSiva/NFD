import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../web/index.html", import.meta.url), "utf8");
const normalizedHtml = html.replace(/\s+/g, " ");

test("Trust Score exposes an accessible people-based track record tab", () => {
  assert.match(normalizedHtml, /data-trust-tab="record"/);
  assert.match(normalizedHtml, /aria-controls="trust-panel-record"/);
  assert.match(normalizedHtml, /id="trust-panel-record"[\s\S]*?aria-labelledby="trust-tab-record"/);
  assert.match(normalizedHtml, /Distinct people, not agreement totals/);
  assert.match(normalizedHtml, /The current app does not yet save tracked agreements or calculate a score/);
});

test("Trust record scenarios keep disputes and safety reports separate from commitment outcomes", () => {
  assert.match(normalizedHtml, /Completed late/);
  assert.match(normalizedHtml, /Partially completed/);
  assert.match(normalizedHtml, /Confirmed not completed/);
  assert.match(normalizedHtml, /Disputed or awaiting response/);
  assert.match(normalizedHtml, /A one-sided allegation does not become a public score entry/);
});
