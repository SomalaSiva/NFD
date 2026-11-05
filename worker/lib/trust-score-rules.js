// Single editable source for Trust Score classifications and draft scoring policy.
// Keep scoring constants here; UI labels are derived from these classifications.
export const TRUST_SCORE_BASE = 40;
export const TRUST_SCORE_MIN = 1;
export const TRUST_SCORE_MAX = 100;

export const TRUST_CLASSIFICATIONS = Object.freeze({
  timeline: Object.freeze({
    label: "Timeline",
    description: "Was a mutually understood deadline met?",
    outcomes: Object.freeze([
      { value: "succeeded", label: "Deadline met", polarity: "positive" },
      { value: "missed", label: "Deadline missed", polarity: "negative" },
    ]),
  }),
  wordkeep: Object.freeze({
    label: "WordKeep",
    description: "Was a clear promise followed through?",
    outcomes: Object.freeze([
      { value: "kept", label: "Promise kept", polarity: "positive" },
      { value: "broke", label: "Promise not kept", polarity: "negative" },
    ]),
  }),
  payment_property: Object.freeze({
    label: "Payment & property",
    description: "Was an agreed repayment or return completed?",
    outcomes: Object.freeze([
      { value: "returned", label: "Repaid or returned as agreed", polarity: "positive" },
      { value: "not_returned", label: "Not repaid or returned as agreed", polarity: "negative" },
    ]),
  }),
  communication: Object.freeze({
    label: "Communication",
    description: "Was agreed follow-up or communication completed?",
    outcomes: Object.freeze([
      { value: "followed_through", label: "Followed through", polarity: "positive" },
      { value: "did_not_respond", label: "Did not respond as agreed", polarity: "negative" },
    ]),
  }),
  kindness_support: Object.freeze({
    label: "Kindness & support",
    description: "Was support or help offered and provided as described?",
    outcomes: Object.freeze([
      { value: "help_provided", label: "Help offered or provided", polarity: "positive" },
      { value: "help_not_provided", label: "Promised help not provided", polarity: "negative" },
    ]),
  }),
  respect_safety: Object.freeze({
    label: "Respect & safety",
    description: "Were personal boundaries and respectful behavior maintained?",
    outcomes: Object.freeze([
      {
        value: "boundaries_respected",
        label: "Treated respectfully; boundaries respected",
        polarity: "positive",
      },
      {
        value: "aggressive_disrespectful",
        label: "Aggressive or disrespectful behavior",
        polarity: "negative",
      },
    ]),
  }),
});

// Draft only: these values are deliberately not applied to user scores yet.
// The current product score remains the neutral starting score until the policy
// is reviewed and explicitly finalized.
export const TRUST_SCORE_DRAFT_POLICY = Object.freeze({
  verifiedIdentityBonus: 10,
  fulfilledAgreementPercent: 1,
  brokenAgreementPercent: -5,
  disputedAgreementPercent: -1,
  allegationReceiverFriendsPenalty: -10,
  pollWeights: Object.freeze({ receiverFriend: 4, creatorFriend: 2, other: 1 }),
  allegationStatus: "unverified",
});

export function getTrustClassification(classification, outcome) {
  const definition = TRUST_CLASSIFICATIONS[classification];
  if (!definition || !definition.outcomes.some((entry) => entry.value === outcome)) return null;
  return definition;
}

export function getTrustOutcome(classification, outcome) {
  return TRUST_CLASSIFICATIONS[classification]?.outcomes.find((entry) => entry.value === outcome) || null;
}

export function getTrustScoreDisplay(value = TRUST_SCORE_BASE) {
  const score = Number.isFinite(Number(value)) ? Math.round(Number(value)) : TRUST_SCORE_BASE;
  return Math.max(TRUST_SCORE_MIN, Math.min(TRUST_SCORE_MAX, score));
}
