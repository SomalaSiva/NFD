import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../web/index.html", import.meta.url), "utf8");
const normalizedHtml = html.replace(/\s+/g, " ");
const appJs = await readFile(new URL("../web/assets/app.js", import.meta.url), "utf8");

test("Trust Score exposes agreement-based, confirmed outcome tracking", () => {
  assert.match(normalizedHtml, /data-trust-tab="record"/);
  assert.match(normalizedHtml, /aria-controls="trust-panel-record"/);
  assert.match(normalizedHtml, /id="trust-panel-record"[\s\S]*?aria-labelledby="trust-tab-record"/);
  assert.match(normalizedHtml, /Each agreement outcome counts separately/);
  assert.match(normalizedHtml, /Approval makes an agreement active, but does not mark it completed/);
  assert.match(normalizedHtml, /disagreements are counted separately/i);
  assert.match(normalizedHtml, /id="trust-record-disputed-count"/);
  assert.match(normalizedHtml, /id="trust-record-completed-count"/);
  assert.match(normalizedHtml, /id="trust-record-awaiting-count"/);
  assert.match(normalizedHtml, /A trust score is not enabled yet/);
});

test("Trust Score provides in-app agreement storage and participant approval controls", () => {
  assert.match(normalizedHtml, /data-trust-tab="my-agreements"/);
  assert.match(normalizedHtml, /Save in NFD &amp; request approval/);
  assert.match(normalizedHtml, /Search by name, NFD ID, or Ghost ID/);
  assert.match(normalizedHtml, /Select one or more people; they do not need to be friends/);
  assert.match(normalizedHtml, /Any later change needs approval from everyone again/);
  assert.match(appJs, /Approve this version/);
  assert.match(appJs, /propose-change/);
  assert.match(appJs, /Disputed outcomes:/);
  assert.match(appJs, /Disagreement recorded by/);
  assert.match(appJs, /Report outcome/);
  assert.match(appJs, /agreement-people/);
  assert.match(appJs, /completed agreements:/i);
  assert.match(appJs, /outcome-response/);
});

test("Trust record scenarios keep disputes and safety reports separate from commitment outcomes", () => {
  assert.match(normalizedHtml, /Completed late/);
  assert.match(normalizedHtml, /Partially completed/);
  assert.match(normalizedHtml, /Confirmed not completed/);
  assert.match(normalizedHtml, /Disputed or awaiting response/);
  assert.match(normalizedHtml, /A one-sided allegation does not become a public score entry/);
});
