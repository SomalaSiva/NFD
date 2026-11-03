import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  TRUST_CLASSIFICATIONS,
  TRUST_SCORE_BASE,
  TRUST_SCORE_DRAFT_POLICY,
  getTrustClassification,
  getTrustOutcome,
  getTrustScoreDisplay,
} from "../worker/lib/trust-score-rules.js";

const html = await readFile(new URL("../web/index.html", import.meta.url), "utf8");
const normalizedHtml = html.replace(/\s+/g, " ");
const appJs = await readFile(new URL("../web/assets/app.js", import.meta.url), "utf8");
const appCss = await readFile(new URL("../web/assets/app.css", import.meta.url), "utf8");

test("Trust Score policy and editable classification source stay centralized", async () => {
  assert.equal(TRUST_SCORE_BASE, 40);
  assert.equal(getTrustScoreDisplay(0), 1);
  assert.equal(getTrustScoreDisplay(140), 100);
  assert.deepEqual(Object.keys(TRUST_CLASSIFICATIONS), [
    "timeline",
    "wordkeep",
    "payment_property",
    "communication",
    "kindness_support",
    "respect_safety",
  ]);
  assert.equal(getTrustClassification("timeline", "missed").label, "Timeline");
  assert.equal(getTrustClassification("timeline", "kept"), null);
  assert.equal(getTrustOutcome("timeline", "succeeded").polarity, "positive");
  assert.equal(getTrustOutcome("timeline", "missed").polarity, "negative");
  assert.equal(getTrustOutcome("kindness_support", "help_provided").polarity, "positive");
  assert.equal(getTrustOutcome("respect_safety", "aggressive_disrespectful").polarity, "negative");
  assert.deepEqual(TRUST_SCORE_DRAFT_POLICY.pollWeights, {
    receiverFriend: 4,
    creatorFriend: 2,
    other: 1,
  });
  assert.equal(TRUST_SCORE_DRAFT_POLICY.allegationReceiverFriendsPenalty, -10);
  assert.equal(TRUST_SCORE_DRAFT_POLICY.allegationStatus, "unverified");
  assert.match(
    await readFile(new URL("../worker/routes/trust-score.js", import.meta.url), "utf8"),
    /from "\.\.\/lib\/trust-score-rules\.js"/,
  );
});

test("positive experiences and unverified allegations share one Trust activity section", () => {
  assert.match(normalizedHtml, /id="trust-activity-overview-heading">Trust activity about you/);
  assert.match(normalizedHtml, /id="trust-overview-classifications"/);
  assert.doesNotMatch(normalizedHtml, /id="trust-overview-positive-classifications"/);
  assert.doesNotMatch(normalizedHtml, /Positive experiences about you/);
  assert.doesNotMatch(normalizedHtml, /Unverified allegations about you/);
  assert.match(normalizedHtml, /id="trust-profile-activity-list"/);
  assert.doesNotMatch(normalizedHtml, /id="trust-profile-positive-classifications"/);
  assert.match(appJs, /Positive recognition · unverified/);
  assert.match(appJs, /result\.positiveClassifications/);
  assert.match(appJs, /mergeTrustClassificationSummaries\(positive = \{\}, negative = \{\}\)/);
  assert.match(appJs, /"Positive" : "Unverified"/);
  assert.match(appJs, /trustProfileActivityList,[\s\S]*result\.recognitions[\s\S]*result\.allegations/);
  assert.match(appJs, /outcome\.polarity === "positive" \? "is-positive" : "is-allegation"/);
  assert.match(normalizedHtml, /Neither changes anyone’s score/);
});

test("Trust post target uses search and offers a safe unlinked option when no NFD profile matches", () => {
  assert.match(normalizedHtml, /id="trust-subject-search"[\s\S]*type="search"/);
  assert.match(normalizedHtml, /id="trust-subject-results"[\s\S]*role="listbox"[\s\S]*hidden/);
  assert.doesNotMatch(normalizedHtml, /id="trust-subject-not-in-nfd"/);
  assert.doesNotMatch(normalizedHtml, /<select[^>]+id="trust-subject"/);
  assert.match(appJs, /fetch\(`\/api\/trust-score\/people\?q=\$\{encodeURIComponent\(query\)\}`/);
  assert.match(appJs, /people\.filter\(\(person\) => trustAcceptedFriendIds\.has\(person\.userId\)\)/);
  assert.match(appJs, /trustSubjectResults\.append\(notInNfdOption\)/);
  assert.match(appJs, /Not in NFD — continue without a profile link/);
  assert.match(appJs, /function chooseNotInNfd\(\)/);
  assert.match(appJs, /regular post and will not be linked to a Trust Score profile/);
});

test("Trust Score exposes agreement-based, confirmed outcome tracking", () => {
  assert.match(normalizedHtml, /id="trust-score-overview-meter"/);
  assert.match(normalizedHtml, /Everyone currently starts at 40\/100/);
  assert.match(
    appJs,
    /trustScoreOverviewMeter\.replaceChildren\(createTrustScorePreview\("Your profile", true\)\)/,
  );
  assert.match(normalizedHtml, /data-trust-tab="record"/);
  assert.match(normalizedHtml, /aria-controls="trust-panel-record"/);
  assert.match(normalizedHtml, /id="trust-panel-record"[\s\S]*?aria-labelledby="trust-tab-record"/);
  assert.match(normalizedHtml, /Each agreement outcome counts separately/);
  assert.match(normalizedHtml, /Approval makes an agreement active, but does not mark it completed/);
  assert.match(normalizedHtml, /disagreements are counted separately/i);
  assert.match(normalizedHtml, /id="trust-record-disputed-count"/);
  assert.match(normalizedHtml, /id="trust-record-completed-count"/);
  assert.match(normalizedHtml, /id="trust-record-awaiting-count"/);
  assert.match(normalizedHtml, /Everyone currently starts at 40 \/ 100/);
});

test("Self profile and friend Trust Score tabs show the audience-visible score dashboard", () => {
  assert.match(normalizedHtml, /id="profile-summary"[\s\S]*?id="profile-summary-content"/);
  assert.match(normalizedHtml, /id="profile-summary-score"/);
  assert.match(normalizedHtml, /profile-photo-camera[\s\S]*?for="profile-photo-file"/);
  assert.doesNotMatch(normalizedHtml, /Google account/);
  assert.doesNotMatch(normalizedHtml, /profile-photo-choose/);
  assert.match(appJs, /scoreValue = 40/);
  assert.match(appJs, /aria-valuenow", String\(scoreNumber\)/);
  assert.match(appJs, /friend-profile-tab-trust/);
  assert.match(appJs, /trustTab\.dataset\.friendProfileTab = "trust"/);
  assert.match(appJs, /friend-profile-panel-trust/);
  assert.match(appJs, /updateFriendTab\(button\.dataset\.friendProfileTab, true\)/);
  assert.match(appJs, /loadFriendTrustDashboard\([\s\S]*?friend\.userId/);
  assert.match(appJs, /trustSection\.className = "friend-trust-dashboard trust-allegation-dashboard"/);
  assert.match(appJs, /result\.positiveClassifications,[\s\S]*result\.negativeClassifications/);
  assert.match(appJs, /audience-visible positive experiences and unverified allegations/i);
  assert.match(appJs, /profileSummaryScore\.replaceChildren\(createTrustScorePreview/);
  assert.match(appJs, /About: \$\{experience\.trustReport\.subjectName/);
  assert.match(appCss, /\.trust-feed-report \.trust-feed-report-detail[\s\S]*font-weight: 500/);
  assert.match(appCss, /grid-template-columns:\s*52px minmax\(0, 1fr\) minmax\(108px, 135px\)/);
  assert.match(appJs, /if \(compact\) section\.append\(track, scale\)/);
  assert.match(appJs, /profile-trust-score-current/);
  assert.match(appCss, /\.profile-trust-score-compact\s*\{\s*width:\s*min\(100%, 150px\);/);
  assert.match(
    appCss,
    /\.profile-summary-score\s*\{\s*min-width:\s*0;\s*width:\s*100%;\s*display:\s*flex;\s*justify-content:\s*flex-end;/,
  );
  assert.doesNotMatch(appJs, /profileSummary\.insertBefore\(createTrustScorePreview/);
  assert.doesNotMatch(appJs, /profileSummary\.innerHTML\s*=/);
  assert.match(appCss, /\.profile-photo-form \[hidden\]\s*\{\s*display:\s*none !important;/);
});

test("Profile loading keeps the photo controls mounted while replacing summary content", () => {
  const loadProfile = appJs.slice(
    appJs.indexOf("async function loadProfile"),
    appJs.indexOf("function activateProfileTab"),
  );
  assert.match(loadProfile, /profileSummaryContent\.replaceChildren/);
  assert.doesNotMatch(loadProfile, /profileSummary\.innerHTML/);
});

test("Trust Score provides in-app agreement storage and participant approval controls", () => {
  assert.match(normalizedHtml, /data-trust-tab="my-agreements"/);
  assert.doesNotMatch(normalizedHtml, /trust-feature-card|open-agreement-tab|Available now/);
  assert.match(normalizedHtml, /id="trust-panel-agreements"/);
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
