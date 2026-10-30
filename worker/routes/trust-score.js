export function createTrustScoreRoutes(services) {
  const {
    getCurrentUser,
    ensureIdentityTables,
    ensureGhostTables,
    ensureTrustScoreTables,
    recordActivity,
    availableIdentitySql,
    json,
    cleanSearchTerm,
  } = services;

  const agreementFields = ["scope", "dates", "payment", "completion", "changes"];
  const categories = new Set(["Services", "Business", "Everyday commitments", "Other"]);
  const placeholders = (items) => items.map(() => "?").join(", ");
  const parse = (value, fallback = {}) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };
  const cleanText = (value, label, max, required = true) => {
    const cleaned =
      typeof value === "string"
        ? value.trim().replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
        : "";
    if (required && !cleaned) throw new Error(`${label} is required.`);
    if (cleaned.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
    return cleaned;
  };
  async function authenticated(request, env, message) {
    const user = await getCurrentUser(request, env);
    if (!user) return { response: json({ error: message }, 401) };
    if (!env.DB) return { response: json({ error: "Trust Score is unavailable right now." }, 503) };
    await ensureIdentityTables(env);
    await ensureGhostTables(env);
    await ensureTrustScoreTables(env);
    return { user };
  }
  async function requestBody(request) {
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json"))
      throw new Error("Send the form as JSON.");
    return request.json();
  }
  async function profileSummary(env, userId) {
    const result = await env.DB.prepare(
      `SELECT
        COUNT(DISTINCT CASE WHEN c.status = 'fulfilled_on_time' THEN c.id END) AS on_time,
        COUNT(DISTINCT CASE WHEN c.status = 'fulfilled_late' THEN c.id END) AS late,
        COUNT(DISTINCT CASE WHEN c.status = 'disputed' THEN c.id END) AS disputed,
        COUNT(DISTINCT CASE WHEN c.status IN ('awaiting_acceptance', 'active', 'awaiting_confirmation') THEN c.id END) AS in_progress,
        COUNT(DISTINCT CASE WHEN c.status IN ('fulfilled_on_time', 'fulfilled_late', 'disputed') THEN c.id END) AS total
      FROM nfd_trust_commitments c
      INNER JOIN nfd_trust_commitment_participants p ON p.commitment_id = c.id
      WHERE p.user_id = ?`,
    )
      .bind(userId)
      .first();
    const agreements = await env.DB.prepare(
      `SELECT COUNT(DISTINCT a.id) AS fulfilled FROM nfd_trust_agreements a
       INNER JOIN nfd_trust_agreement_participants p ON p.agreement_id = a.id AND p.version = a.version
       WHERE p.user_id = ? AND a.status = 'fulfilled'`,
    )
      .bind(userId)
      .first();
    return {
      onTime: Number(result?.on_time) || 0,
      late: Number(result?.late) || 0,
      disputed: Number(result?.disputed) || 0,
      inProgress: Number(result?.in_progress) || 0,
      total: Number(result?.total) || 0,
      agreementsFulfilled: Number(agreements?.fulfilled) || 0,
    };
  }

  async function profileSummaries(env, userIds) {
    if (!userIds.length) return new Map();
    const members = userIds.map(() => "(?)").join(", ");
    const result = await env.DB.prepare(
      `WITH members(user_id) AS (VALUES ${members}),
        commitment_counts AS (
          SELECT p.user_id,
            COUNT(DISTINCT CASE WHEN c.status = 'fulfilled_on_time' THEN c.id END) AS on_time,
            COUNT(DISTINCT CASE WHEN c.status = 'fulfilled_late' THEN c.id END) AS late,
            COUNT(DISTINCT CASE WHEN c.status = 'disputed' THEN c.id END) AS disputed,
            COUNT(DISTINCT CASE WHEN c.status IN ('awaiting_acceptance', 'active', 'awaiting_confirmation') THEN c.id END) AS in_progress,
            COUNT(DISTINCT CASE WHEN c.status IN ('fulfilled_on_time', 'fulfilled_late', 'disputed') THEN c.id END) AS total
          FROM members m INNER JOIN nfd_trust_commitment_participants p ON p.user_id = m.user_id
          INNER JOIN nfd_trust_commitments c ON c.id = p.commitment_id GROUP BY p.user_id
        ),
        agreement_counts AS (
          SELECT p.user_id, COUNT(DISTINCT a.id) AS fulfilled
          FROM members m INNER JOIN nfd_trust_agreement_participants p ON p.user_id = m.user_id
          INNER JOIN nfd_trust_agreements a ON a.id = p.agreement_id AND a.version = p.version
          WHERE a.status = 'fulfilled' GROUP BY p.user_id
        )
        SELECT m.user_id, COALESCE(c.on_time, 0) AS on_time, COALESCE(c.late, 0) AS late,
          COALESCE(c.disputed, 0) AS disputed, COALESCE(c.in_progress, 0) AS in_progress,
          COALESCE(c.total, 0) AS total, COALESCE(a.fulfilled, 0) AS agreements_fulfilled
        FROM members m LEFT JOIN commitment_counts c ON c.user_id = m.user_id
        LEFT JOIN agreement_counts a ON a.user_id = m.user_id`,
    )
      .bind(...userIds)
      .all();
    return new Map(
      (result.results || []).map((row) => [
        row.user_id,
        {
          onTime: Number(row.on_time) || 0,
          late: Number(row.late) || 0,
          disputed: Number(row.disputed) || 0,
          inProgress: Number(row.in_progress) || 0,
          total: Number(row.total) || 0,
          agreementsFulfilled: Number(row.agreements_fulfilled) || 0,
        },
      ]),
    );
  }

  async function getProfile(request, env) {
    const auth = await authenticated(request, env, "Sign in to view your Trust Score profile.");
    if (auth.response) return auth.response;
    try {
      const [row, summary] = await Promise.all([
        env.DB.prepare(
          "SELECT role, city, category, bio, directory_visible, updated_at FROM nfd_trust_profiles WHERE user_id = ? LIMIT 1",
        )
          .bind(auth.user.id)
          .first(),
        profileSummary(env, auth.user.id),
      ]);
      return json({
        profile: {
          name: auth.user.name || "NFD member",
          role: row?.role || "",
          city: row?.city || "",
          category: row?.category || "Other",
          bio: row?.bio || "",
          directoryVisible: Number(row?.directory_visible) === 1,
          updatedAt: row?.updated_at || "",
        },
        summary,
      });
    } catch (error) {
      console.error("Trust Score profile lookup failed", error);
      return json({ error: "Your Trust Score profile could not be loaded right now." }, 503);
    }
  }

  async function saveProfile(request, env) {
    const auth = await authenticated(request, env, "Sign in to update your Trust Score profile.");
    if (auth.response) return auth.response;
    try {
      const body = await requestBody(request);
      const role = cleanText(body.role, "Role", 80, false);
      const city = cleanText(body.city, "City", 80, false);
      const category = categories.has(body.category) ? body.category : "Other";
      const bio = cleanText(body.bio, "About", 500, false);
      const visible = body.directoryVisible === true;
      const now = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO nfd_trust_profiles (user_id, role, city, category, bio, directory_visible, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET role = excluded.role, city = excluded.city,
           category = excluded.category, bio = excluded.bio,
           directory_visible = excluded.directory_visible, updated_at = excluded.updated_at`,
      )
        .bind(auth.user.id, role, city, category, bio, visible ? 1 : 0, now)
        .run();
      await recordActivity(env, auth.user.id, "trust_profile_updated", "trust_profile", auth.user.id, {
        directoryVisible: visible,
      });
      return getProfile(request, env);
    } catch (error) {
      if (error instanceof SyntaxError) return json({ error: "The profile form was invalid." }, 400);
      if (
        error.message?.startsWith("Role ") ||
        error.message?.startsWith("City ") ||
        error.message?.startsWith("About ") ||
        error.message?.startsWith("Send ")
      )
        return json({ error: error.message }, 400);
      console.error("Trust Score profile update failed", error);
      return json({ error: "Your Trust Score profile could not be saved right now." }, 503);
    }
  }

  async function listPeople(request, env) {
    const auth = await authenticated(request, env, "Sign in to find people on Trust Score.");
    if (auth.response) return auth.response;
    const url = new URL(request.url);
    const query = cleanSearchTerm(url.searchParams.get("q")).slice(0, 80);
    const category = cleanSearchTerm(url.searchParams.get("category"));
    try {
      const clauses = ["u.id != ?", "p.directory_visible = 1", availableIdentitySql];
      const binds = [auth.user.id];
      if (query) {
        clauses.push(
          "(instr(lower(CASE WHEN u.provider = 'ghost' THEN COALESCE(gp.handle, '') ELSE COALESCE(u.display_name, '') END), lower(?)) > 0 OR instr(lower(p.role), lower(?)) > 0 OR instr(lower(p.city), lower(?)) > 0 OR instr(lower(p.bio), lower(?)) > 0)",
        );
        binds.push(query, query, query, query);
      }
      if (categories.has(category)) {
        clauses.push("p.category = ?");
        binds.push(category);
      }
      const rows = await env.DB.prepare(
        `SELECT u.id, CASE WHEN u.provider = 'ghost' THEN COALESCE(gp.handle, 'NFD member')
           ELSE COALESCE(NULLIF(trim(u.display_name), ''), 'NFD member') END AS display_name,
           u.provider, p.role, p.city, p.category, p.bio
         FROM nfd_users u INNER JOIN nfd_trust_profiles p ON p.user_id = u.id
         LEFT JOIN nfd_ghost_profiles gp ON gp.ghost_user_id = u.id AND gp.active = 1
         WHERE ${clauses.join(" AND ")}
         ORDER BY lower(CASE WHEN u.provider = 'ghost' THEN COALESCE(gp.handle, 'NFD member')
           ELSE COALESCE(NULLIF(trim(u.display_name), ''), 'NFD member') END), u.id LIMIT 100`,
      )
        .bind(...binds)
        .all();
      const summaries = await profileSummaries(
        env,
        (rows.results || []).map((row) => row.id),
      );
      const people = (rows.results || []).map((row) => ({
        id: row.id,
        name: row.display_name || "NFD member",
        provider: row.provider,
        role: row.role,
        city: row.city,
        category: row.category,
        bio: row.bio,
        summary: summaries.get(row.id) || {
          onTime: 0,
          late: 0,
          disputed: 0,
          inProgress: 0,
          total: 0,
          agreementsFulfilled: 0,
        },
      }));
      return json({ people, total: people.length, limited: people.length === 100 });
    } catch (error) {
      console.error("Trust Score directory lookup failed", error);
      return json({ error: "People could not be loaded right now." }, 503);
    }
  }

  async function commitmentDetails(env, commitmentId) {
    const commitment = await env.DB.prepare("SELECT * FROM nfd_trust_commitments WHERE id = ? LIMIT 1")
      .bind(commitmentId)
      .first();
    if (!commitment) return null;
    const [people, events] = await Promise.all([
      env.DB.prepare(
        `SELECT p.user_id, p.role, p.invitation_status, p.fulfillment_confirmed_at,
          p.dispute_resolution, p.dispute_note,
          CASE WHEN u.provider = 'ghost' THEN COALESCE(gp.handle, 'NFD member')
            ELSE COALESCE(NULLIF(trim(u.display_name), ''), 'NFD member') END AS name
         FROM nfd_trust_commitment_participants p
         INNER JOIN nfd_users u ON u.id = p.user_id
         LEFT JOIN nfd_ghost_profiles gp ON gp.ghost_user_id = u.id AND gp.active = 1
         WHERE p.commitment_id = ? ORDER BY p.created_at, p.user_id`,
      )
        .bind(commitmentId)
        .all(),
      env.DB.prepare(
        `SELECT e.action, e.details_json, e.created_at,
          CASE WHEN u.provider = 'ghost' THEN COALESCE(gp.handle, 'NFD member')
            ELSE COALESCE(NULLIF(trim(u.display_name), ''), 'NFD member') END AS actor_name
         FROM nfd_trust_commitment_events e
         INNER JOIN nfd_users u ON u.id = e.actor_user_id
         LEFT JOIN nfd_ghost_profiles gp ON gp.ghost_user_id = u.id AND gp.active = 1
         WHERE e.commitment_id = ? ORDER BY e.created_at DESC LIMIT 100`,
      )
        .bind(commitmentId)
        .all(),
    ]);
    return {
      id: commitment.id,
      createdBy: commitment.created_by,
      title: commitment.title,
      description: commitment.description,
      category: commitment.category,
      dueAt: commitment.due_at,
      status: commitment.status,
      fulfillmentReportedAt: commitment.fulfillment_reported_at || "",
      createdAt: commitment.created_at,
      updatedAt: commitment.updated_at,
      participants: (people.results || []).map((row) => ({
        id: row.user_id,
        name: row.name,
        role: row.role,
        invitationStatus: row.invitation_status,
        fulfillmentConfirmed: Boolean(row.fulfillment_confirmed_at),
        disputeResolution: row.dispute_resolution || "",
        disputeNote: row.dispute_note || "",
      })),
      events: (events.results || []).map((row) => ({
        action: row.action,
        details: parse(row.details_json),
        createdAt: row.created_at,
        actorName: row.actor_name,
      })),
    };
  }

  async function addCommitmentEvent(env, id, userId, action, details = {}) {
    await env.DB.prepare(
      "INSERT INTO nfd_trust_commitment_events (id, commitment_id, actor_user_id, action, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(crypto.randomUUID(), id, userId, action, JSON.stringify(details), new Date().toISOString())
      .run();
  }

  async function listCommitments(request, env) {
    const auth = await authenticated(request, env, "Sign in to open your commitments.");
    if (auth.response) return auth.response;
    try {
      const rows = await env.DB.prepare(
        `SELECT c.id, c.created_by, c.title, c.description, c.category, c.due_at, c.status,
          c.fulfillment_reported_at, c.created_at, c.updated_at
         FROM nfd_trust_commitments c
         INNER JOIN nfd_trust_commitment_participants p ON p.commitment_id = c.id AND p.user_id = ?
         ORDER BY c.updated_at DESC, c.id LIMIT 100`,
      )
        .bind(auth.user.id)
        .all();
      const commitments = await Promise.all(
        (rows.results || []).map((row) => commitmentDetails(env, row.id)),
      );
      return json({ commitments });
    } catch (error) {
      console.error("Trust Score commitments lookup failed", error);
      return json({ error: "Your commitments could not be loaded right now." }, 503);
    }
  }

  async function createCommitment(request, env) {
    const auth = await authenticated(request, env, "Sign in to create a commitment.");
    if (auth.response) return auth.response;
    try {
      const body = await requestBody(request);
      const title = cleanText(body.title, "Title", 160);
      const description = cleanText(body.description, "Description", 4000);
      const category = categories.has(body.category) ? body.category : "Other";
      const dueAtInput = cleanText(body.dueAt, "Due date", 40);
      const dueAtDate = new Date(dueAtInput);
      if (!Number.isFinite(dueAtDate.getTime())) throw new Error("Enter a valid due date.");
      const participantIds = Array.isArray(body.participantIds)
        ? [...new Set(body.participantIds.filter((id) => typeof id === "string" && id !== auth.user.id))]
        : [];
      if (!participantIds.length || participantIds.length > 19)
        throw new Error("Choose between 1 and 19 other NFD participants.");
      const allowed = await env.DB.prepare(
        `SELECT u.id FROM nfd_users u
         INNER JOIN nfd_trust_profiles p ON p.user_id = u.id AND p.directory_visible = 1
         WHERE u.id IN (${placeholders(participantIds)}) AND ${availableIdentitySql}`,
      )
        .bind(...participantIds)
        .all();
      if ((allowed.results || []).length !== participantIds.length)
        throw new Error("Only active, discoverable NFD members can be invited to a commitment.");
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const rows = [
        { userId: auth.user.id, role: "creator", invitationStatus: "accepted" },
        ...participantIds.map((userId) => ({ userId, role: "participant", invitationStatus: "invited" })),
      ];
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO nfd_trust_commitments
           (id, created_by, title, description, category, due_at, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'awaiting_acceptance', ?, ?)`,
        ).bind(id, auth.user.id, title, description, category, dueAtDate.toISOString(), now, now),
        ...rows.map((row) =>
          env.DB.prepare(
            `INSERT INTO nfd_trust_commitment_participants
             (id, commitment_id, user_id, role, invitation_status, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
          ).bind(crypto.randomUUID(), id, row.userId, row.role, row.invitationStatus, now),
        ),
        env.DB.prepare(
          `INSERT INTO nfd_trust_commitment_events (id, commitment_id, actor_user_id, action, details_json, created_at)
           VALUES (?, ?, ?, 'Commitment created; waiting for participants', '{}', ?)`,
        ).bind(crypto.randomUUID(), id, auth.user.id, now),
      ]);
      await recordActivity(env, auth.user.id, "trust_commitment_created", "trust_commitment", id);
      return json({ commitment: await commitmentDetails(env, id) }, 201);
    } catch (error) {
      if (error instanceof SyntaxError) return json({ error: "The commitment form was invalid." }, 400);
      if (
        /required|characters|Choose between|valid due date|Only active|Send the form/.test(
          error.message || "",
        )
      )
        return json({ error: error.message }, 400);
      console.error("Trust Score commitment creation failed", error);
      return json({ error: "The commitment could not be created right now." }, 503);
    }
  }

  async function commitmentAction(request, env, id, action) {
    const auth = await authenticated(request, env, "Sign in to update a commitment.");
    if (auth.response) return auth.response;
    try {
      const commitment = await env.DB.prepare(
        `SELECT c.* FROM nfd_trust_commitments c
         INNER JOIN nfd_trust_commitment_participants p ON p.commitment_id = c.id AND p.user_id = ?
         WHERE c.id = ? LIMIT 1`,
      )
        .bind(auth.user.id, id)
        .first();
      if (!commitment) return json({ error: "That commitment was not found." }, 404);
      const participant = await env.DB.prepare(
        "SELECT * FROM nfd_trust_commitment_participants WHERE commitment_id = ? AND user_id = ? LIMIT 1",
      )
        .bind(id, auth.user.id)
        .first();
      const now = new Date().toISOString();
      let newStatus = commitment.status;
      if (action === "accept" || action === "decline") {
        if (commitment.status !== "awaiting_acceptance" || participant.invitation_status !== "invited")
          return json({ error: "This invitation is no longer waiting for a response." }, 409);
        const inviteStatus = action === "accept" ? "accepted" : "declined";
        await env.DB.prepare(
          "UPDATE nfd_trust_commitment_participants SET invitation_status = ? WHERE commitment_id = ? AND user_id = ? AND invitation_status = 'invited'",
        )
          .bind(inviteStatus, id, auth.user.id)
          .run();
        const counts = await env.DB.prepare(
          `SELECT SUM(CASE WHEN invitation_status = 'invited' THEN 1 ELSE 0 END) AS waiting,
                  SUM(CASE WHEN invitation_status = 'declined' THEN 1 ELSE 0 END) AS declined
           FROM nfd_trust_commitment_participants WHERE commitment_id = ?`,
        )
          .bind(id)
          .first();
        if (Number(counts?.declined) > 0) newStatus = "declined";
        else if (Number(counts?.waiting) === 0) newStatus = "active";
        await env.DB.prepare("UPDATE nfd_trust_commitments SET status = ?, updated_at = ? WHERE id = ?")
          .bind(newStatus, now, id)
          .run();
        await addCommitmentEvent(
          env,
          id,
          auth.user.id,
          action === "accept" ? "Invitation accepted" : "Invitation declined",
        );
      } else if (action === "report") {
        if (commitment.created_by !== auth.user.id || commitment.status !== "active")
          return json(
            { error: "Only the creator can report fulfillment after all participants accept." },
            409,
          );
        newStatus = "awaiting_confirmation";
        await env.DB.prepare(
          "UPDATE nfd_trust_commitments SET status = ?, fulfillment_reported_at = ?, updated_at = ? WHERE id = ?",
        )
          .bind(newStatus, now, now, id)
          .run();
        await env.DB.prepare(
          "UPDATE nfd_trust_commitment_participants SET fulfillment_confirmed_at = NULL WHERE commitment_id = ?",
        )
          .bind(id)
          .run();
        await addCommitmentEvent(
          env,
          id,
          auth.user.id,
          "Fulfillment reported; awaiting confirmation from everyone",
        );
      } else if (action === "confirm") {
        if (commitment.status !== "awaiting_confirmation" || participant.invitation_status !== "accepted")
          return json({ error: "This commitment is not awaiting your confirmation." }, 409);
        await env.DB.prepare(
          "UPDATE nfd_trust_commitment_participants SET fulfillment_confirmed_at = ? WHERE commitment_id = ? AND user_id = ? AND fulfillment_confirmed_at IS NULL",
        )
          .bind(now, id, auth.user.id)
          .run();
        const counts = await env.DB.prepare(
          `SELECT COUNT(*) AS total, SUM(CASE WHEN fulfillment_confirmed_at IS NOT NULL THEN 1 ELSE 0 END) AS confirmed
           FROM nfd_trust_commitment_participants WHERE commitment_id = ? AND invitation_status = 'accepted'`,
        )
          .bind(id)
          .first();
        if (Number(counts?.total) === Number(counts?.confirmed)) {
          const status =
            Date.parse(commitment.due_at) >= Date.parse(commitment.fulfillment_reported_at || now)
              ? "fulfilled_on_time"
              : "fulfilled_late";
          await env.DB.prepare("UPDATE nfd_trust_commitments SET status = ?, updated_at = ? WHERE id = ?")
            .bind(status, now, id)
            .run();
        }
        await addCommitmentEvent(env, id, auth.user.id, "Fulfillment confirmed");
      } else if (action === "dispute") {
        if (!["active", "awaiting_confirmation"].includes(commitment.status))
          return json({ error: "Only an active commitment can be disputed." }, 409);
        const body = await requestBody(request);
        const note = cleanText(body.note, "Dispute details", 2000);
        const resolution = ["fulfilled_on_time", "fulfilled_late", "cancelled"].includes(body.resolution)
          ? body.resolution
          : "";
        if (!resolution) return json({ error: "Choose a proposed outcome." }, 400);
        newStatus = "disputed";
        await env.DB.prepare("UPDATE nfd_trust_commitments SET status = ?, updated_at = ? WHERE id = ?")
          .bind(newStatus, now, id)
          .run();
        await env.DB.prepare(
          `UPDATE nfd_trust_commitment_participants SET fulfillment_confirmed_at = NULL,
            dispute_resolution = NULL, dispute_note = NULL WHERE commitment_id = ?`,
        )
          .bind(id)
          .run();
        await env.DB.prepare(
          `UPDATE nfd_trust_commitment_participants SET dispute_resolution = ?, dispute_note = ?
           WHERE commitment_id = ? AND user_id = ?`,
        )
          .bind(resolution, note, id, auth.user.id)
          .run();
        await addCommitmentEvent(env, id, auth.user.id, "Dispute opened", {
          note,
          proposedResolution: resolution,
        });
      } else if (action === "resolve") {
        if (commitment.status !== "disputed")
          return json({ error: "This commitment has no open dispute." }, 409);
        const body = await requestBody(request);
        const resolution = ["fulfilled_on_time", "fulfilled_late", "cancelled"].includes(body.resolution)
          ? body.resolution
          : "";
        const note = cleanText(body.note, "Resolution note", 2000, false);
        if (!resolution) return json({ error: "Choose a proposed outcome." }, 400);
        await env.DB.prepare(
          `UPDATE nfd_trust_commitment_participants SET dispute_resolution = ?, dispute_note = ?
           WHERE commitment_id = ? AND user_id = ?`,
        )
          .bind(resolution, note, id, auth.user.id)
          .run();
        const proposals = await env.DB.prepare(
          `SELECT COUNT(*) AS total, SUM(CASE WHEN dispute_resolution = ? THEN 1 ELSE 0 END) AS matching,
                  SUM(CASE WHEN dispute_resolution IS NULL THEN 1 ELSE 0 END) AS waiting
           FROM nfd_trust_commitment_participants WHERE commitment_id = ? AND invitation_status = 'accepted'`,
        )
          .bind(resolution, id)
          .first();
        if (Number(proposals?.waiting) === 0 && Number(proposals?.matching) === Number(proposals?.total)) {
          newStatus = resolution;
          await env.DB.prepare("UPDATE nfd_trust_commitments SET status = ?, updated_at = ? WHERE id = ?")
            .bind(newStatus, now, id)
            .run();
        }
        await addCommitmentEvent(env, id, auth.user.id, "Dispute resolution proposed", { resolution, note });
      } else if (action === "cancel") {
        if (
          commitment.created_by !== auth.user.id ||
          !["awaiting_acceptance", "active"].includes(commitment.status)
        )
          return json({ error: "This commitment can no longer be cancelled." }, 409);
        newStatus = "cancelled";
        await env.DB.prepare("UPDATE nfd_trust_commitments SET status = ?, updated_at = ? WHERE id = ?")
          .bind(newStatus, now, id)
          .run();
        await addCommitmentEvent(env, id, auth.user.id, "Commitment cancelled");
      } else {
        return json({ error: "Unknown commitment action." }, 404);
      }
      await recordActivity(env, auth.user.id, `trust_commitment_${action}`, "trust_commitment", id);
      return json({ commitment: await commitmentDetails(env, id) });
    } catch (error) {
      if (error instanceof SyntaxError) return json({ error: "The commitment response was invalid." }, 400);
      if (/required|characters|Send the form/.test(error.message || ""))
        return json({ error: error.message }, 400);
      console.error("Trust Score commitment action failed", error);
      return json({ error: "That commitment could not be updated right now." }, 503);
    }
  }

  function validateAgreement(body) {
    const title = cleanText(body.title, "Title", 160);
    const description = cleanText(body.description, "Description", 4000);
    if (!Array.isArray(body.participants) || body.participants.length < 2 || body.participants.length > 20)
      throw new Error("Add between 2 and 20 participants, including yourself.");
    const participants = body.participants.map((participant) => ({
      userId: cleanText(participant.userId, "Participant", 200),
      responsibility: cleanText(participant.responsibility, "Responsibility", 3000),
    }));
    if (new Set(participants.map((participant) => participant.userId)).size !== participants.length)
      throw new Error("Each participant must be different.");
    const terms = {};
    for (const field of agreementFields) terms[field] = cleanText(body.terms?.[field], field, 4000);
    return { title, description, participants, terms };
  }

  async function validAgreementParticipants(env, userId, participantIds) {
    if (!participantIds.includes(userId)) throw new Error("Include yourself as a participant.");
    const distinctIds = [...new Set(participantIds)];
    if (distinctIds.length !== participantIds.length) throw new Error("Each participant must be different.");
    const result = await env.DB.prepare(
      `SELECT u.id FROM nfd_users u
       LEFT JOIN nfd_trust_profiles p ON p.user_id = u.id
       WHERE u.id IN (${placeholders(distinctIds)}) AND ${availableIdentitySql}
         AND (p.directory_visible = 1 OR u.id = ?)
       ORDER BY u.id`,
    )
      .bind(...distinctIds, userId)
      .all();
    if ((result.results || []).length !== distinctIds.length)
      throw new Error("Only active NFD members with a public Trust Score profile can be added.");
  }

  async function addAgreementEvent(env, id, version, userId, action, details = {}) {
    await env.DB.prepare(
      `INSERT INTO nfd_trust_agreement_events
       (id, agreement_id, version, actor_user_id, action, details_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        crypto.randomUUID(),
        id,
        version,
        userId,
        action,
        JSON.stringify(details),
        new Date().toISOString(),
      )
      .run();
  }

  async function agreementDetails(env, id, userId) {
    const agreement = await env.DB.prepare("SELECT * FROM nfd_trust_agreements WHERE id = ? LIMIT 1")
      .bind(id)
      .first();
    if (!agreement) return null;
    const access = await env.DB.prepare(
      "SELECT user_id FROM nfd_trust_agreement_participants WHERE agreement_id = ? AND user_id = ? LIMIT 1",
    )
      .bind(id, userId)
      .first();
    if (agreement.owner_user_id !== userId && !access) return null;
    const [versionRows, eventRows] = await Promise.all([
      env.DB.prepare(
        `SELECT v.version, v.content_json, v.reason, v.created_at,
          CASE WHEN u.provider = 'ghost' THEN COALESCE(gp.handle, 'NFD member')
            ELSE COALESCE(NULLIF(trim(u.display_name), ''), 'NFD member') END AS changed_by_name
         FROM nfd_trust_agreement_versions v
         INNER JOIN nfd_users u ON u.id = v.changed_by
         LEFT JOIN nfd_ghost_profiles gp ON gp.ghost_user_id = u.id AND gp.active = 1
         WHERE v.agreement_id = ? ORDER BY v.version DESC`,
      )
        .bind(id)
        .all(),
      env.DB.prepare(
        `SELECT e.version, e.action, e.details_json, e.created_at,
          CASE WHEN u.provider = 'ghost' THEN COALESCE(gp.handle, 'NFD member')
            ELSE COALESCE(NULLIF(trim(u.display_name), ''), 'NFD member') END AS actor_name
         FROM nfd_trust_agreement_events e
         INNER JOIN nfd_users u ON u.id = e.actor_user_id
         LEFT JOIN nfd_ghost_profiles gp ON gp.ghost_user_id = u.id AND gp.active = 1
         WHERE e.agreement_id = ? ORDER BY e.created_at DESC LIMIT 200`,
      )
        .bind(id)
        .all(),
    ]);
    const [participants, approvals] = await Promise.all([
      env.DB.prepare(
        `SELECT p.version, p.user_id, p.responsibility, p.decision, p.decision_note, p.decided_version,
          p.fulfillment_confirmed_at,
          CASE WHEN u.provider = 'ghost' THEN COALESCE(gp.handle, 'NFD member')
            ELSE COALESCE(NULLIF(trim(u.display_name), ''), 'NFD member') END AS name
         FROM nfd_trust_agreement_participants p
         INNER JOIN nfd_users u ON u.id = p.user_id
         LEFT JOIN nfd_ghost_profiles gp ON gp.ghost_user_id = u.id AND gp.active = 1
         WHERE p.agreement_id = ? ORDER BY p.version DESC, p.created_at, p.user_id`,
      )
        .bind(id)
        .all(),
      env.DB.prepare(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN decision = 'approved' AND decided_version = ? THEN 1 ELSE 0 END) AS approved FROM nfd_trust_agreement_participants WHERE agreement_id = ? AND version = ?",
      )
        .bind(agreement.version, id, agreement.version)
        .first(),
    ]);
    const currentVersion = (versionRows.results || []).find(
      (row) => Number(row.version) === Number(agreement.version),
    );
    const isOwner = agreement.owner_user_id === userId;
    const visibleVersions = new Set(
      (participants.results || [])
        .filter((participant) => participant.user_id === userId)
        .map((participant) => Number(participant.version)),
    );
    const canSeeCurrentVersion = isOwner || visibleVersions.has(Number(agreement.version));
    const visibleVersionRows = (versionRows.results || []).filter(
      (row) => isOwner || visibleVersions.has(Number(row.version)),
    );
    const visibleDisplayVersion = canSeeCurrentVersion ? currentVersion : visibleVersionRows[0];
    const visibleDisplayContent = parse(visibleDisplayVersion?.content_json);
    const visibleEvents = (eventRows.results || []).filter(
      (row) => isOwner || visibleVersions.has(Number(row.version)),
    );
    return {
      id: agreement.id,
      ownerUserId: agreement.owner_user_id,
      title: visibleDisplayContent.title || agreement.title,
      description: visibleDisplayContent.description || agreement.description,
      status: canSeeCurrentVersion ? agreement.status : "previous_version",
      version: Number(visibleDisplayVersion?.version || agreement.version),
      createdAt: agreement.created_at,
      updatedAt: agreement.updated_at,
      isOwner: agreement.owner_user_id === userId,
      approvals: canSeeCurrentVersion
        ? { approved: Number(approvals?.approved) || 0, total: Number(approvals?.total) || 0 }
        : { approved: 0, total: 0 },
      participants: (canSeeCurrentVersion ? participants.results || [] : [])
        .filter((row) => Number(row.version) === Number(agreement.version))
        .map((row) => ({
          id: row.user_id,
          name: row.name,
          responsibility: row.responsibility,
          decision: row.decision || "",
          decisionNote: row.decision_note || "",
          fulfillmentConfirmed: Boolean(row.fulfillment_confirmed_at),
        })),
      terms: visibleDisplayContent.terms || {},
      history: visibleVersionRows.map((row) => {
        const content = parse(row.content_json);
        return {
          version: Number(row.version),
          content: {
            ...content,
            participants: (content.participants || []).map((person) => ({
              ...person,
              name:
                (participants.results || []).find(
                  (participant) =>
                    Number(participant.version) === Number(row.version) &&
                    participant.user_id === person.userId,
                )?.name || (person.userId === userId ? "You" : "NFD member"),
            })),
          },
          reason: row.reason,
          createdAt: row.created_at,
          changedBy: row.changed_by_name,
        };
      }),
      events: visibleEvents.map((row) => ({
        version: Number(row.version),
        action: row.action,
        details: parse(row.details_json),
        createdAt: row.created_at,
        actorName: row.actor_name,
      })),
    };
  }

  async function listAgreements(request, env) {
    const auth = await authenticated(request, env, "Sign in to open your agreements.");
    if (auth.response) return auth.response;
    try {
      const result = await env.DB.prepare(
        `SELECT DISTINCT a.id, a.updated_at FROM nfd_trust_agreements a
         LEFT JOIN nfd_trust_agreement_participants p ON p.agreement_id = a.id
         WHERE a.owner_user_id = ? OR p.user_id = ? ORDER BY a.updated_at DESC, a.id LIMIT 100`,
      )
        .bind(auth.user.id, auth.user.id)
        .all();
      const agreements = await Promise.all(
        (result.results || []).map((row) => agreementDetails(env, row.id, auth.user.id)),
      );
      return json({ agreements: agreements.filter(Boolean) });
    } catch (error) {
      console.error("Trust Score agreements lookup failed", error);
      return json({ error: "Your agreements could not be loaded right now." }, 503);
    }
  }

  async function createAgreement(request, env) {
    const auth = await authenticated(request, env, "Sign in to create an agreement.");
    if (auth.response) return auth.response;
    try {
      const body = await requestBody(request);
      const content = validateAgreement(body);
      const participants = content.participants;
      await validAgreementParticipants(
        env,
        auth.user.id,
        participants.map((participant) => participant.userId),
      );
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const version = 1;
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO nfd_trust_agreements (id, owner_user_id, title, description, status, version, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'draft', 1, ?, ?)`,
        ).bind(id, auth.user.id, content.title, content.description, now, now),
        env.DB.prepare(
          `INSERT INTO nfd_trust_agreement_versions
           (id, agreement_id, version, content_json, changed_by, reason, created_at) VALUES (?, ?, ?, ?, ?, 'Original agreement', ?)`,
        ).bind(crypto.randomUUID(), id, version, JSON.stringify(content), auth.user.id, now),
        ...participants.map((participant) =>
          env.DB.prepare(
            `INSERT INTO nfd_trust_agreement_participants
             (id, agreement_id, version, user_id, responsibility, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
          ).bind(crypto.randomUUID(), id, version, participant.userId, participant.responsibility, now),
        ),
      ]);
      await addAgreementEvent(env, id, version, auth.user.id, "Draft created");
      await recordActivity(env, auth.user.id, "trust_agreement_created", "trust_agreement", id);
      return json({ agreement: await agreementDetails(env, id, auth.user.id) }, 201);
    } catch (error) {
      if (error instanceof SyntaxError) return json({ error: "The agreement form was invalid." }, 400);
      if (
        /required|characters|between 2|Include yourself|different|active NFD|public Trust Score|Send the form/.test(
          error.message || "",
        )
      )
        return json({ error: error.message }, 400);
      console.error("Trust Score agreement creation failed", error);
      return json({ error: "The agreement could not be created right now." }, 503);
    }
  }

  async function agreementAction(request, env, id, action) {
    const auth = await authenticated(request, env, "Sign in to update an agreement.");
    if (auth.response) return auth.response;
    try {
      const existing = await env.DB.prepare(
        `SELECT a.* FROM nfd_trust_agreements a
         LEFT JOIN nfd_trust_agreement_participants p ON p.agreement_id = a.id AND p.user_id = ?
         WHERE a.id = ? AND (a.owner_user_id = ? OR p.user_id = ?) LIMIT 1`,
      )
        .bind(auth.user.id, id, auth.user.id, auth.user.id)
        .first();
      if (!existing) return json({ error: "That agreement was not found." }, 404);
      const currentVersion = Number(existing.version);
      const actor = await env.DB.prepare(
        "SELECT * FROM nfd_trust_agreement_participants WHERE agreement_id = ? AND version = ? AND user_id = ? LIMIT 1",
      )
        .bind(id, currentVersion, auth.user.id)
        .first();
      const now = new Date().toISOString();
      if (action === "revise") {
        if (
          existing.owner_user_id !== auth.user.id ||
          ["awaiting_fulfillment", "fulfilled"].includes(existing.status)
        )
          return json({ error: "This agreement can no longer be revised." }, 409);
        const body = await requestBody(request);
        if (Number(body.version) !== currentVersion)
          return json({ error: "This agreement changed. Refresh and review the latest version." }, 409);
        const content = validateAgreement(body);
        const reason = cleanText(body.reason, "Reason for change", 2000);
        await validAgreementParticipants(
          env,
          auth.user.id,
          content.participants.map((participant) => participant.userId),
        );
        const nextVersion = currentVersion + 1;
        await env.DB.batch([
          env.DB.prepare(
            "UPDATE nfd_trust_agreements SET title = ?, description = ?, status = 'draft', version = ?, updated_at = ? WHERE id = ? AND version = ?",
          ).bind(content.title, content.description, nextVersion, now, id, currentVersion),
          env.DB.prepare(
            `INSERT INTO nfd_trust_agreement_versions
             (id, agreement_id, version, content_json, changed_by, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ).bind(crypto.randomUUID(), id, nextVersion, JSON.stringify(content), auth.user.id, reason, now),
          ...content.participants.map((participant) =>
            env.DB.prepare(
              `INSERT INTO nfd_trust_agreement_participants
               (id, agreement_id, version, user_id, responsibility, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            ).bind(crypto.randomUUID(), id, nextVersion, participant.userId, participant.responsibility, now),
          ),
        ]);
        await addAgreementEvent(env, id, nextVersion, auth.user.id, `Version ${nextVersion} drafted`, {
          reason,
        });
      } else if (action === "request") {
        if (existing.owner_user_id !== auth.user.id || existing.status !== "draft")
          return json({ error: "Only the creator can request approvals from a draft." }, 409);
        const version = await env.DB.prepare(
          "SELECT content_json FROM nfd_trust_agreement_versions WHERE agreement_id = ? AND version = ? LIMIT 1",
        )
          .bind(id, currentVersion)
          .first();
        const content = parse(version?.content_json);
        if (JSON.stringify(content).match(/\[To agree:/i))
          return json(
            { error: "Replace each [To agree: …] note with the agreed details before requesting approval." },
            400,
          );
        await env.DB.prepare(
          "UPDATE nfd_trust_agreements SET status = 'awaiting_approval', updated_at = ? WHERE id = ? AND version = ?",
        )
          .bind(now, id, currentVersion)
          .run();
        await addAgreementEvent(
          env,
          id,
          currentVersion,
          auth.user.id,
          "Approval requested from all participants",
        );
      } else if (action === "respond") {
        if (existing.status !== "awaiting_approval" || !actor)
          return json({ error: "This agreement version is not waiting for your response." }, 409);
        const body = await requestBody(request);
        const decision = ["approved", "changes", "declined"].includes(body.decision) ? body.decision : "";
        if (!decision) return json({ error: "Choose approve, request changes, or decline." }, 400);
        const note = decision === "approved" ? "" : cleanText(body.note, "Note", 2000);
        if (actor.decided_version === currentVersion)
          return json({ error: "You have already responded to this version." }, 409);
        await env.DB.prepare(
          `UPDATE nfd_trust_agreement_participants SET decision = ?, decision_note = ?, decided_version = ?
           WHERE agreement_id = ? AND version = ? AND user_id = ?`,
        )
          .bind(decision, note, currentVersion, id, currentVersion, auth.user.id)
          .run();
        let status = existing.status;
        if (decision === "changes") status = "changes_requested";
        else if (decision === "declined") status = "declined";
        else {
          const approvals = await env.DB.prepare(
            "SELECT COUNT(*) AS total, SUM(CASE WHEN decision = 'approved' AND decided_version = ? THEN 1 ELSE 0 END) AS approved FROM nfd_trust_agreement_participants WHERE agreement_id = ? AND version = ?",
          )
            .bind(currentVersion, id, currentVersion)
            .first();
          if (Number(approvals?.approved) === Number(approvals?.total)) status = "approved";
        }
        await env.DB.prepare("UPDATE nfd_trust_agreements SET status = ?, updated_at = ? WHERE id = ?")
          .bind(status, now, id)
          .run();
        await addAgreementEvent(env, id, currentVersion, auth.user.id, `Participant ${decision}`, { note });
      } else if (action === "fulfillment") {
        if (existing.owner_user_id !== auth.user.id || existing.status !== "approved")
          return json(
            { error: "Everyone must approve the current version before fulfillment is reported." },
            409,
          );
        await env.DB.prepare(
          "UPDATE nfd_trust_agreements SET status = 'awaiting_fulfillment', updated_at = ? WHERE id = ?",
        )
          .bind(now, id)
          .run();
        await addAgreementEvent(
          env,
          id,
          currentVersion,
          auth.user.id,
          "Fulfillment reported; awaiting confirmation",
        );
      } else if (action === "confirm") {
        if (existing.status !== "awaiting_fulfillment" || !actor)
          return json({ error: "This agreement is not awaiting your confirmation." }, 409);
        await env.DB.prepare(
          `UPDATE nfd_trust_agreement_participants SET fulfillment_confirmed_at = ?
           WHERE agreement_id = ? AND version = ? AND user_id = ? AND fulfillment_confirmed_at IS NULL`,
        )
          .bind(now, id, currentVersion, auth.user.id)
          .run();
        const confirmations = await env.DB.prepare(
          `SELECT COUNT(*) AS total, SUM(CASE WHEN fulfillment_confirmed_at IS NOT NULL THEN 1 ELSE 0 END) AS confirmed
           FROM nfd_trust_agreement_participants WHERE agreement_id = ? AND version = ?`,
        )
          .bind(id, currentVersion)
          .first();
        if (Number(confirmations?.total) === Number(confirmations?.confirmed))
          await env.DB.prepare(
            "UPDATE nfd_trust_agreements SET status = 'fulfilled', updated_at = ? WHERE id = ?",
          )
            .bind(now, id)
            .run();
        await addAgreementEvent(env, id, currentVersion, auth.user.id, "Fulfillment confirmed");
      } else {
        return json({ error: "Unknown agreement action." }, 404);
      }
      await recordActivity(env, auth.user.id, `trust_agreement_${action}`, "trust_agreement", id);
      return json({ agreement: await agreementDetails(env, id, auth.user.id) });
    } catch (error) {
      if (error instanceof SyntaxError) return json({ error: "The agreement response was invalid." }, 400);
      if (
        /required|characters|between 2|Include yourself|different|active NFD|public Trust Score|Send the form/.test(
          error.message || "",
        )
      )
        return json({ error: error.message }, 400);
      console.error("Trust Score agreement action failed", error);
      return json({ error: "That agreement could not be updated right now." }, 503);
    }
  }

  async function getPendingCount(userId, env) {
    if (!env.DB || !userId) return 0;
    try {
      await ensureIdentityTables(env);
      await ensureGhostTables(env);
      await ensureTrustScoreTables(env);
      const commitments = await env.DB.prepare(
        `SELECT COUNT(*) AS count FROM nfd_trust_commitment_participants p
         INNER JOIN nfd_trust_commitments c ON c.id = p.commitment_id
         WHERE p.user_id = ? AND p.invitation_status = 'invited' AND c.status = 'awaiting_acceptance'`,
      )
        .bind(userId)
        .first();
      const agreements = await env.DB.prepare(
        `SELECT COUNT(*) AS count FROM nfd_trust_agreement_participants p
         INNER JOIN nfd_trust_agreements a ON a.id = p.agreement_id AND a.version = p.version
         WHERE p.user_id = ? AND a.status = 'awaiting_approval' AND p.decided_version IS NULL`,
      )
        .bind(userId)
        .first();
      return (Number(commitments?.count) || 0) + (Number(agreements?.count) || 0);
    } catch (error) {
      console.error("Trust Score pending count lookup failed", error);
      return 0;
    }
  }

  return {
    getProfile,
    saveProfile,
    listPeople,
    listCommitments,
    createCommitment,
    commitmentAction,
    listAgreements,
    createAgreement,
    agreementAction,
    getPendingCount,
  };
}
