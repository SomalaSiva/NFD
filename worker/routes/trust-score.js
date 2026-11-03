import {
  TRUST_CLASSIFICATIONS,
  TRUST_SCORE_BASE,
  TRUST_SCORE_DRAFT_POLICY,
  getTrustOutcome,
} from "../lib/trust-score-rules.js";

export function createTrustScoreRoutes({
  getCurrentUser,
  isAdmin,
  ensureTrustScoreTables,
  json,
  cleanSearchTerm,
}) {
  async function searchPeople(request, env) {
    const viewer = await getCurrentUser(request, env);
    if (!viewer) return json({ error: "Sign in to search Trust Score profiles." }, 401);
    if (!env.DB) return json({ error: "Trust Score profiles are unavailable right now." }, 503);
    const query = cleanSearchTerm(new URL(request.url).searchParams.get("q"));
    if (query.length < 2) return json({ people: [] });
    try {
      const result = await env.DB.prepare(
        `
        SELECT u.id, COALESCE(NULLIF(trim(u.display_name), ''), 'NFD member') AS name,
          u.profile_photo_key
        FROM nfd_users u
        WHERE u.active = 1 AND u.provider != 'ghost'
          AND (instr(lower(COALESCE(u.display_name, '')), lower(?)) > 0 OR instr(lower(u.id), lower(?)) > 0)
        ORDER BY CASE WHEN lower(u.display_name) = lower(?) THEN 0 ELSE 1 END, lower(u.display_name)
        LIMIT 12
      `,
      )
        .bind(query, query, query)
        .all();
      return json({
        people: (result.results || []).map((person) => ({
          userId: person.id,
          name: person.name,
          photoUrl: person.profile_photo_key ? `/api/profile-photo/${encodeURIComponent(person.id)}` : "",
        })),
      });
    } catch (error) {
      console.error("Trust Score profile search failed", error);
      return json({ error: "Trust Score profiles could not be searched right now." }, 503);
    }
  }

  async function getRules(request, env) {
    const user = await getCurrentUser(request, env);
    if (!user) return json({ error: "Sign in to view Trust Score options." }, 401);
    return json({
      classifications: Object.entries(TRUST_CLASSIFICATIONS).map(([key, value]) => ({ key, ...value })),
      statusLabel: "Unverified allegation",
      recognitionLabel: "Positive recognition",
    });
  }

  async function getDashboard(request, env) {
    const viewer = await getCurrentUser(request, env);
    if (!viewer) return json({ error: "Sign in to view Trust Score profiles." }, 401);
    if (!env.DB) return json({ error: "Trust Score is unavailable right now." }, 503);
    try {
      await ensureTrustScoreTables(env);
      const url = new URL(request.url);
      const requestedId = url.searchParams.get("userId")?.trim().slice(0, 200) || viewer.id;
      const profile = await env.DB.prepare(
        `
        SELECT id, COALESCE(NULLIF(trim(display_name), ''), 'NFD member') AS name, profile_photo_key
        FROM nfd_users WHERE id = ? AND active = 1 AND provider != 'ghost' LIMIT 1
      `,
      )
        .bind(requestedId)
        .first();
      if (!profile) return json({ error: "That Trust Score profile could not be found." }, 404);

      const rows = await env.DB.prepare(
        `
        SELECT a.id, a.experience_id, a.author_user_id, a.classification, a.outcome, a.status,
          a.created_at, e.short_description, e.visibility,
          CASE WHEN e.visibility = 'anonymous' OR author.active != 1 THEN NULL
            ELSE COALESCE(NULLIF(trim(author.display_name), ''), 'NFD member') END AS author_name
        FROM nfd_trust_allegations a
        INNER JOIN experiences e ON e.id = a.experience_id AND e.status = 'shared'
        INNER JOIN nfd_users author ON author.id = a.author_user_id
        WHERE a.subject_user_id = ? AND (
          a.author_user_id = ? OR e.visibility IN ('public', 'anonymous') OR
          (e.visibility = 'friends' AND EXISTS (
            SELECT 1 FROM nfd_friend_requests f WHERE f.status = 'accepted'
              AND ((f.from_user_id = a.author_user_id AND f.to_user_id = ?) OR
                   (f.from_user_id = ? AND f.to_user_id = a.author_user_id))
          ))
        )
        ORDER BY a.created_at DESC, a.id DESC LIMIT 100
      `,
      )
        .bind(profile.id, viewer.id, viewer.id, viewer.id)
        .all();

      const profileRows = rows.results || [];
      const pollAggregates = await getPollAggregates(
        env,
        profileRows.map((row) => row.id),
      );
      const allegations = profileRows.map((row) => ({
        id: row.id,
        experienceId: row.experience_id,
        classification: row.classification,
        classificationLabel: TRUST_CLASSIFICATIONS[row.classification]?.label || "Other",
        outcome: row.outcome,
        outcomeLabel:
          TRUST_CLASSIFICATIONS[row.classification]?.outcomes.find((item) => item.value === row.outcome)
            ?.label || "Reported experience",
        polarity: getTrustOutcome(row.classification, row.outcome)?.polarity || "negative",
        typeLabel:
          getTrustOutcome(row.classification, row.outcome)?.polarity === "positive"
            ? "Positive recognition · unverified"
            : "Unverified allegation",
        status: "unverified",
        shortDescription: row.short_description,
        createdAt: row.created_at,
        authorName: row.author_name || "Anonymous NFD member",
        poll: pollAggregates.get(row.id) || emptyPollAggregate(),
        canVote:
          getTrustOutcome(row.classification, row.outcome)?.polarity !== "positive" &&
          profile.id !== viewer.id,
      }));
      const positiveRecords = allegations.filter((record) => record.polarity === "positive");
      const negativeRecords = allegations.filter((record) => record.polarity !== "positive");
      const makeClassificationSummary = (records, polarity) =>
        Object.fromEntries(
          Object.entries(TRUST_CLASSIFICATIONS).map(([key, definition]) => [
            key,
            {
              key,
              label: definition.label,
              total: records.filter((record) => record.classification === key).length,
              outcomes: definition.outcomes
                .filter((outcome) => outcome.polarity === polarity)
                .map((outcome) => ({
                  ...outcome,
                  count: records.filter(
                    (record) => record.classification === key && record.outcome === outcome.value,
                  ).length,
                })),
            },
          ]),
        );
      const positiveClassifications = makeClassificationSummary(positiveRecords, "positive");
      const negativeClassifications = makeClassificationSummary(negativeRecords, "negative");
      return json({
        profile: {
          userId: profile.id,
          name: profile.name,
          photoUrl: profile.profile_photo_key ? `/api/profile-photo/${encodeURIComponent(profile.id)}` : "",
          score: TRUST_SCORE_BASE,
          isSelf: profile.id === viewer.id,
        },
        scoreNote: "Starting score. Allegations are unverified and do not change this score.",
        classifications: negativeClassifications,
        positiveClassifications,
        negativeClassifications,
        recognitions: positiveRecords,
        allegations: negativeRecords,
        rules: {
          statusLabel: "Unverified allegation",
          recognitionLabel: "Positive recognition",
          pollWeights: TRUST_SCORE_DRAFT_POLICY.pollWeights,
        },
      });
    } catch (error) {
      console.error("Trust Score dashboard failed", error);
      return json({ error: "Trust Score could not be loaded right now." }, 503);
    }
  }

  async function vote(request, env, allegationId) {
    const voter = await getCurrentUser(request, env);
    if (!voter) return json({ error: "Sign in to respond to this poll." }, 401);
    if (!env.DB) return json({ error: "This poll is unavailable right now." }, 503);
    const body = await request.json().catch(() => null);
    if (!body || !["believe", "not_believe"].includes(body.choice)) {
      return json({ error: "Choose Believe or Don’t believe." }, 400);
    }
    try {
      await ensureTrustScoreTables(env);
      const allegation = await env.DB.prepare(
        `
        SELECT a.id, a.author_user_id, a.subject_user_id, a.classification, a.outcome, e.visibility
        FROM nfd_trust_allegations a INNER JOIN experiences e ON e.id = a.experience_id
        WHERE a.id = ? AND e.status = 'shared' AND a.status = 'unverified' LIMIT 1
      `,
      )
        .bind(allegationId)
        .first();
      if (!allegation) return json({ error: "That unverified allegation could not be found." }, 404);
      if (getTrustOutcome(allegation.classification, allegation.outcome)?.polarity === "positive") {
        return json({ error: "Positive recognition posts do not use allegation polls." }, 400);
      }
      if (voter.id === allegation.subject_user_id) {
        return json({ error: "The person named in the allegation cannot vote in this poll." }, 403);
      }
      const canSee =
        allegation.visibility !== "friends" || (await areFriends(env, allegation.author_user_id, voter.id));
      if (!canSee) return json({ error: "This poll is not available to your account." }, 403);
      const receiverFriend = await areFriends(env, allegation.subject_user_id, voter.id);
      const creatorFriend = await areFriends(env, allegation.author_user_id, voter.id);
      const group = receiverFriend ? "receiver_friend" : creatorFriend ? "creator_friend" : "other";
      const weights = TRUST_SCORE_DRAFT_POLICY.pollWeights;
      const weight = receiverFriend
        ? weights.receiverFriend
        : creatorFriend
          ? weights.creatorFriend
          : weights.other;
      const now = new Date().toISOString();
      await env.DB.prepare(
        `
        INSERT INTO nfd_trust_allegation_votes
          (allegation_id, voter_user_id, choice, voter_group, weight, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(allegation_id, voter_user_id) DO UPDATE SET
          choice = excluded.choice, voter_group = excluded.voter_group,
          weight = excluded.weight, updated_at = excluded.updated_at
      `,
      )
        .bind(allegation.id, voter.id, body.choice, group, weight, now, now)
        .run();
      return json({ poll: await getPollAggregate(env, allegation.id) });
    } catch (error) {
      console.error("Trust Score poll vote failed", error);
      return json({ error: "Your poll response could not be saved right now." }, 503);
    }
  }

  async function adminSummary(request, env) {
    const admin = await getCurrentUser(request, env);
    if (!admin) return json({ error: "Sign in to open administration." }, 401);
    if (!(await isAdmin(request, env))) return json({ error: "Administrator access is required." }, 403);
    if (!env.DB) return json({ error: "Trust Score review data is unavailable right now." }, 503);
    try {
      await ensureTrustScoreTables(env);
      const rows = await env.DB.prepare(
        `
        SELECT a.id, a.classification, a.outcome, a.created_at,
          e.short_description,
          COALESCE(NULLIF(trim(author.display_name), ''), 'NFD member') AS author_name,
          COALESCE(NULLIF(trim(subject.display_name), ''), 'NFD member') AS subject_name,
          COUNT(v.voter_user_id) AS total_votes,
          SUM(CASE WHEN v.choice = 'believe' THEN 1 ELSE 0 END) AS believe_votes,
          SUM(CASE WHEN v.choice = 'not_believe' THEN 1 ELSE 0 END) AS not_believe_votes,
          SUM(CASE WHEN v.voter_group = 'receiver_friend' AND v.choice = 'believe' THEN 1 ELSE 0 END) AS receiver_friends_believe,
          SUM(CASE WHEN v.voter_group = 'receiver_friend' AND v.choice = 'not_believe' THEN 1 ELSE 0 END) AS receiver_friends_not_believe,
          SUM(CASE WHEN v.voter_group = 'creator_friend' AND v.choice = 'believe' THEN 1 ELSE 0 END) AS creator_friends_believe,
          SUM(CASE WHEN v.voter_group = 'creator_friend' AND v.choice = 'not_believe' THEN 1 ELSE 0 END) AS creator_friends_not_believe,
          SUM(CASE WHEN v.voter_group = 'other' AND v.choice = 'believe' THEN 1 ELSE 0 END) AS other_believe,
          SUM(CASE WHEN v.voter_group = 'other' AND v.choice = 'not_believe' THEN 1 ELSE 0 END) AS other_not_believe,
          SUM(CASE WHEN v.choice = 'believe' THEN v.weight ELSE 0 END) AS weighted_believe,
          SUM(CASE WHEN v.choice = 'not_believe' THEN v.weight ELSE 0 END) AS weighted_not_believe
        FROM nfd_trust_allegations a
        INNER JOIN experiences e ON e.id = a.experience_id
        INNER JOIN nfd_users author ON author.id = a.author_user_id
        INNER JOIN nfd_users subject ON subject.id = a.subject_user_id
        LEFT JOIN nfd_trust_allegation_votes v ON v.allegation_id = a.id
        GROUP BY a.id ORDER BY a.created_at DESC LIMIT 300
      `,
      ).all();
      return json({
        rules: { pollWeights: TRUST_SCORE_DRAFT_POLICY.pollWeights },
        allegations: (rows.results || []).map((row) => ({
          id: row.id,
          classification: row.classification,
          classificationLabel: TRUST_CLASSIFICATIONS[row.classification]?.label || "Other",
          outcome: row.outcome,
          outcomeLabel:
            TRUST_CLASSIFICATIONS[row.classification]?.outcomes.find((item) => item.value === row.outcome)
              ?.label || "Reported outcome",
          polarity: getTrustOutcome(row.classification, row.outcome)?.polarity || "negative",
          typeLabel:
            getTrustOutcome(row.classification, row.outcome)?.polarity === "positive"
              ? "Positive recognition"
              : "Unverified allegation",
          status: "unverified",
          createdAt: row.created_at,
          authorName: row.author_name,
          subjectName: row.subject_name,
          postSummary: row.short_description,
          votes: {
            total: Number(row.total_votes) || 0,
            believe: Number(row.believe_votes) || 0,
            notBelieve: Number(row.not_believe_votes) || 0,
            groups: {
              receiverFriends: {
                believe: Number(row.receiver_friends_believe) || 0,
                notBelieve: Number(row.receiver_friends_not_believe) || 0,
              },
              creatorFriends: {
                believe: Number(row.creator_friends_believe) || 0,
                notBelieve: Number(row.creator_friends_not_believe) || 0,
              },
              others: {
                believe: Number(row.other_believe) || 0,
                notBelieve: Number(row.other_not_believe) || 0,
              },
            },
            weighted: {
              believe: Number(row.weighted_believe) || 0,
              notBelieve: Number(row.weighted_not_believe) || 0,
            },
          },
        })),
      });
    } catch (error) {
      console.error("Admin Trust Score summary failed", error);
      return json({ error: "Trust Score review data could not be loaded right now." }, 503);
    }
  }

  async function getPollAggregate(env, allegationId) {
    const row = await env.DB.prepare(
      `
      SELECT COUNT(*) AS total,
        SUM(CASE WHEN choice = 'believe' THEN 1 ELSE 0 END) AS believe,
        SUM(CASE WHEN choice = 'not_believe' THEN 1 ELSE 0 END) AS not_believe,
        SUM(CASE WHEN choice = 'believe' THEN weight ELSE 0 END) AS weighted_believe,
        SUM(CASE WHEN choice = 'not_believe' THEN weight ELSE 0 END) AS weighted_not_believe
      FROM nfd_trust_allegation_votes WHERE allegation_id = ?
    `,
    )
      .bind(allegationId)
      .first();
    return shapePollAggregate(row);
  }

  async function getPollAggregates(env, allegationIds) {
    const aggregates = new Map();
    if (!allegationIds.length) return aggregates;
    const placeholders = allegationIds.map(() => "?").join(", ");
    const result = await env.DB.prepare(
      `
      SELECT allegation_id, COUNT(*) AS total,
        SUM(CASE WHEN choice = 'believe' THEN 1 ELSE 0 END) AS believe,
        SUM(CASE WHEN choice = 'not_believe' THEN 1 ELSE 0 END) AS not_believe,
        SUM(CASE WHEN choice = 'believe' THEN weight ELSE 0 END) AS weighted_believe,
        SUM(CASE WHEN choice = 'not_believe' THEN weight ELSE 0 END) AS weighted_not_believe
      FROM nfd_trust_allegation_votes WHERE allegation_id IN (${placeholders})
      GROUP BY allegation_id
    `,
    )
      .bind(...allegationIds)
      .all();
    for (const row of result.results || []) aggregates.set(row.allegation_id, shapePollAggregate(row));
    return aggregates;
  }

  function shapePollAggregate(row) {
    const total = Number(row?.total) || 0;
    const believe = Number(row?.believe) || 0;
    return {
      total,
      believe,
      notBelieve: Number(row?.not_believe) || 0,
      weightedBelieve: Number(row?.weighted_believe) || 0,
      weightedNotBelieve: Number(row?.weighted_not_believe) || 0,
      believePercent: total ? Math.round((believe * 100) / total) : 0,
    };
  }

  function emptyPollAggregate() {
    return {
      total: 0,
      believe: 0,
      notBelieve: 0,
      weightedBelieve: 0,
      weightedNotBelieve: 0,
      believePercent: 0,
    };
  }

  async function areFriends(env, firstUserId, secondUserId) {
    const row = await env.DB.prepare(
      `
      SELECT 1 AS yes FROM nfd_friend_requests
      WHERE status = 'accepted' AND ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))
      LIMIT 1
    `,
    )
      .bind(firstUserId, secondUserId, secondUserId, firstUserId)
      .first();
    return Boolean(row);
  }

  return { getRules, searchPeople, getDashboard, vote, adminSummary };
}
