// Idempotent compatibility schema setup. New schema changes belong in db/schema.ts and db/migrations.
let identityTablesPromise;
let engagementTablesPromise;
let moderationTablesPromise;
let experienceOptionColumnsPromise;
let evidenceCleanupTablePromise;
let ghostTablesPromise;
let adminTablesPromise;
let emailRestrictionTablesPromise;
let messagingTablesPromise;
let trustScoreTablesPromise;

export async function ensureAdminTable(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  adminTablesPromise ||= env.DB.prepare(
    `
    CREATE TABLE IF NOT EXISTS nfd_admin_users (
      email TEXT PRIMARY KEY NOT NULL,
      added_by TEXT NOT NULL,
      added_at TEXT NOT NULL
    )
  `,
  )
    .run()
    .catch((error) => {
      adminTablesPromise = undefined;
      throw error;
    });
  await adminTablesPromise;
}

export async function ensureEmailRestrictionTable(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  emailRestrictionTablesPromise ||= (async () => {
    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS nfd_blocked_emails (
        email TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
        reason TEXT NOT NULL DEFAULT '',
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `,
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS nfd_blocked_emails_created_idx ON nfd_blocked_emails (created_at)",
    ).run();
  })().catch((error) => {
    emailRestrictionTablesPromise = undefined;
    throw error;
  });
  await emailRestrictionTablesPromise;
}

export async function ensureMessagingTables(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  messagingTablesPromise ||= (async () => {
    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS nfd_messages (
        id TEXT PRIMARY KEY NOT NULL,
        sender_id TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL,
        seen_at TEXT,
        expires_at TEXT,
        FOREIGN KEY (sender_id) REFERENCES nfd_users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES nfd_users(id) ON DELETE CASCADE
      )
    `,
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS nfd_messages_sender_recipient_created_idx ON nfd_messages (sender_id, recipient_id, created_at)",
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS nfd_messages_recipient_sender_created_idx ON nfd_messages (recipient_id, sender_id, created_at)",
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS nfd_messages_expires_idx ON nfd_messages (expires_at)",
    ).run();
  })().catch((error) => {
    messagingTablesPromise = undefined;
    throw error;
  });
  await messagingTablesPromise;
}

export async function ensureTrustScoreTables(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  trustScoreTablesPromise ||= (async () => {
    const statements = [
      `CREATE TABLE IF NOT EXISTS nfd_trust_profiles (
        user_id TEXT PRIMARY KEY NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'Other',
        bio TEXT NOT NULL DEFAULT '',
        directory_visible INTEGER NOT NULL DEFAULT 0 CHECK (directory_visible IN (0, 1)),
        updated_at TEXT NOT NULL
      )`,
      "CREATE INDEX IF NOT EXISTS nfd_trust_profiles_directory_idx ON nfd_trust_profiles (directory_visible, updated_at)",
      `CREATE TABLE IF NOT EXISTS nfd_trust_commitments (
        id TEXT PRIMARY KEY NOT NULL,
        created_by TEXT NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE,
        title TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, due_at TEXT NOT NULL,
        status TEXT NOT NULL, fulfillment_reported_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
      "CREATE INDEX IF NOT EXISTS nfd_trust_commitments_creator_created_idx ON nfd_trust_commitments (created_by, created_at)",
      "CREATE INDEX IF NOT EXISTS nfd_trust_commitments_status_due_idx ON nfd_trust_commitments (status, due_at)",
      `CREATE TABLE IF NOT EXISTS nfd_trust_commitment_participants (
        id TEXT PRIMARY KEY NOT NULL,
        commitment_id TEXT NOT NULL REFERENCES nfd_trust_commitments(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'participant', invitation_status TEXT NOT NULL DEFAULT 'invited',
        fulfillment_confirmed_at TEXT, dispute_resolution TEXT, dispute_note TEXT, created_at TEXT NOT NULL,
        UNIQUE (commitment_id, user_id)
      )`,
      "CREATE INDEX IF NOT EXISTS nfd_trust_commitment_participant_user_idx ON nfd_trust_commitment_participants (user_id, created_at)",
      `CREATE TABLE IF NOT EXISTS nfd_trust_commitment_events (
        id TEXT PRIMARY KEY NOT NULL,
        commitment_id TEXT NOT NULL REFERENCES nfd_trust_commitments(id) ON DELETE CASCADE,
        actor_user_id TEXT NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE,
        action TEXT NOT NULL, details_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
      )`,
      "CREATE INDEX IF NOT EXISTS nfd_trust_commitment_events_created_idx ON nfd_trust_commitment_events (commitment_id, created_at)",
      `CREATE TABLE IF NOT EXISTS nfd_trust_agreements (
        id TEXT PRIMARY KEY NOT NULL,
        owner_user_id TEXT NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE,
        title TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
      "CREATE INDEX IF NOT EXISTS nfd_trust_agreements_owner_updated_idx ON nfd_trust_agreements (owner_user_id, updated_at)",
      `CREATE TABLE IF NOT EXISTS nfd_trust_agreement_versions (
        id TEXT PRIMARY KEY NOT NULL,
        agreement_id TEXT NOT NULL REFERENCES nfd_trust_agreements(id) ON DELETE CASCADE,
        version INTEGER NOT NULL, content_json TEXT NOT NULL,
        changed_by TEXT NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL,
        UNIQUE (agreement_id, version)
      )`,
      "CREATE INDEX IF NOT EXISTS nfd_trust_agreement_versions_created_idx ON nfd_trust_agreement_versions (agreement_id, created_at)",
      `CREATE TABLE IF NOT EXISTS nfd_trust_agreement_participants (
        id TEXT PRIMARY KEY NOT NULL,
        agreement_id TEXT NOT NULL REFERENCES nfd_trust_agreements(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        user_id TEXT NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE,
        responsibility TEXT NOT NULL, decision TEXT, decision_note TEXT NOT NULL DEFAULT '',
        decided_version INTEGER, fulfillment_confirmed_at TEXT, created_at TEXT NOT NULL,
        UNIQUE (agreement_id, version, user_id)
      )`,
      "CREATE INDEX IF NOT EXISTS nfd_trust_agreement_participant_user_idx ON nfd_trust_agreement_participants (user_id, created_at)",
      `CREATE TABLE IF NOT EXISTS nfd_trust_agreement_events (
        id TEXT PRIMARY KEY NOT NULL,
        agreement_id TEXT NOT NULL REFERENCES nfd_trust_agreements(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        actor_user_id TEXT NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE,
        action TEXT NOT NULL, details_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
      )`,
      "CREATE INDEX IF NOT EXISTS nfd_trust_agreement_events_created_idx ON nfd_trust_agreement_events (agreement_id, created_at)",
    ];
    for (const statement of statements) await env.DB.prepare(statement).run();
  })().catch((error) => {
    trustScoreTablesPromise = undefined;
    throw error;
  });
  await trustScoreTablesPromise;
}

export async function ensureGhostTables(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  ghostTablesPromise ||= (async () => {
    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS nfd_ghost_access (
        user_id TEXT PRIMARY KEY NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE,
        enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
        granted_by TEXT NOT NULL REFERENCES nfd_users(id),
        updated_at TEXT NOT NULL
      )
    `,
    ).run();
    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS nfd_ghost_profiles (
        ghost_user_id TEXT PRIMARY KEY NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE,
        owner_user_id TEXT NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE,
        handle TEXT NOT NULL COLLATE NOCASE UNIQUE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
      )
    `,
    ).run();
    let profileColumns = await env.DB.prepare("PRAGMA table_info(nfd_ghost_profiles)").all();
    if (!(profileColumns.results || []).some((column) => column.name === "handle")) {
      try {
        await env.DB.prepare("ALTER TABLE nfd_ghost_profiles ADD COLUMN handle TEXT").run();
      } catch (error) {
        profileColumns = await env.DB.prepare("PRAGMA table_info(nfd_ghost_profiles)").all();
        if (!(profileColumns.results || []).some((column) => column.name === "handle")) throw error;
      }
    }
    profileColumns = await env.DB.prepare("PRAGMA table_info(nfd_ghost_profiles)").all();
    if (!(profileColumns.results || []).some((column) => column.name === "updated_at")) {
      try {
        await env.DB.prepare("ALTER TABLE nfd_ghost_profiles ADD COLUMN updated_at TEXT").run();
      } catch (error) {
        profileColumns = await env.DB.prepare("PRAGMA table_info(nfd_ghost_profiles)").all();
        if (!(profileColumns.results || []).some((column) => column.name === "updated_at")) throw error;
      }
    }
    profileColumns = await env.DB.prepare("PRAGMA table_info(nfd_ghost_profiles)").all();
    if (!(profileColumns.results || []).some((column) => column.name === "active")) {
      try {
        await env.DB.prepare(
          "ALTER TABLE nfd_ghost_profiles ADD COLUMN active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))",
        ).run();
      } catch (error) {
        profileColumns = await env.DB.prepare("PRAGMA table_info(nfd_ghost_profiles)").all();
        if (!(profileColumns.results || []).some((column) => column.name === "active")) throw error;
      }
    }
    await env.DB.prepare(
      `
      UPDATE nfd_ghost_profiles
      SET handle = 'ghost-' || lower(substr(replace(ghost_user_id, '-', ''), -12))
      WHERE handle IS NULL OR trim(handle) = ''
    `,
    ).run();
    await env.DB.prepare(
      "UPDATE nfd_ghost_profiles SET updated_at = COALESCE(NULLIF(updated_at, ''), created_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL OR trim(updated_at) = ''",
    ).run();
    await env.DB.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS nfd_ghost_profiles_handle_unique ON nfd_ghost_profiles (handle COLLATE NOCASE)",
    ).run();
    await env.DB.prepare("DROP INDEX IF EXISTS nfd_ghost_profiles_owner_user_id_unique").run();
    await env.DB.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS nfd_ghost_profiles_active_owner_unique ON nfd_ghost_profiles (owner_user_id) WHERE active = 1",
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS nfd_ghost_profiles_owner_idx ON nfd_ghost_profiles (owner_user_id)",
    ).run();
  })().catch((error) => {
    ghostTablesPromise = undefined;
    throw error;
  });
  await ghostTablesPromise;
}

export async function ensureIdentityTables(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  identityTablesPromise ||= (async () => {
    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS nfd_users (
        id TEXT PRIMARY KEY NOT NULL,
        provider TEXT NOT NULL,
        provider_subject TEXT NOT NULL,
        email TEXT NOT NULL,
        display_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
        UNIQUE (provider, provider_subject)
      )
    `,
    ).run();
    const userColumns = await env.DB.prepare("PRAGMA table_info(nfd_users)").all();
    if (!(userColumns.results || []).some((column) => column.name === "active")) {
      try {
        await env.DB.prepare(
          "ALTER TABLE nfd_users ADD COLUMN active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))",
        ).run();
      } catch (error) {
        const refreshedColumns = await env.DB.prepare("PRAGMA table_info(nfd_users)").all();
        if (!(refreshedColumns.results || []).some((column) => column.name === "active")) throw error;
      }
    }
    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS nfd_sessions (
        session_hash TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_activity_at TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (user_id) REFERENCES nfd_users(id) ON DELETE CASCADE
      )
    `,
    ).run();
    const sessionColumns = await env.DB.prepare("PRAGMA table_info(nfd_sessions)").all();
    if (!(sessionColumns.results || []).some((column) => column.name === "last_activity_at")) {
      try {
        await env.DB.prepare(
          "ALTER TABLE nfd_sessions ADD COLUMN last_activity_at TEXT NOT NULL DEFAULT ''",
        ).run();
      } catch (error) {
        const refreshedColumns = await env.DB.prepare("PRAGMA table_info(nfd_sessions)").all();
        if (!(refreshedColumns.results || []).some((column) => column.name === "last_activity_at"))
          throw error;
      }
    }
    await env.DB.prepare(
      "UPDATE nfd_sessions SET last_activity_at = ? WHERE last_activity_at IS NULL OR last_activity_at = ''",
    )
      .bind(new Date().toISOString())
      .run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS nfd_sessions_user_id_idx ON nfd_sessions (user_id)",
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS nfd_sessions_expires_idx ON nfd_sessions (expires_at)",
    ).run();
    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS nfd_activity_audit (
        id TEXT PRIMARY KEY NOT NULL,
        actor_user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        details_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        FOREIGN KEY (actor_user_id) REFERENCES nfd_users(id) ON DELETE CASCADE
      )
    `,
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS nfd_activity_audit_created_idx ON nfd_activity_audit (created_at)",
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS nfd_activity_audit_actor_created_idx ON nfd_activity_audit (actor_user_id, created_at)",
    ).run();
  })().catch((error) => {
    identityTablesPromise = undefined;
    throw error;
  });
  await identityTablesPromise;
}

export async function ensureEngagementTables(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  engagementTablesPromise ||= (async () => {
    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS experience_reactions (
        experience_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        reaction TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (experience_id, user_id),
        FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES nfd_users(id) ON DELETE CASCADE
      )
    `,
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS experience_reactions_experience_idx ON experience_reactions (experience_id, reaction)",
    ).run();
    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS experience_comments (
        id TEXT PRIMARY KEY NOT NULL,
        experience_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES nfd_users(id) ON DELETE CASCADE
      )
    `,
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS experience_comments_experience_created_idx ON experience_comments (experience_id, created_at)",
    ).run();
  })().catch((error) => {
    engagementTablesPromise = undefined;
    throw error;
  });
  await engagementTablesPromise;
}

export async function ensureExperienceOptionColumns(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  experienceOptionColumnsPromise ||= (async () => {
    const definitions = [
      ["incident_time_end", "TEXT"],
      ["comments_enabled", "INTEGER NOT NULL DEFAULT 1"],
    ];
    for (const [column, definition] of definitions) {
      let columns = await env.DB.prepare("PRAGMA table_info(experiences)").all();
      if ((columns.results || []).some((item) => item.name === column)) continue;
      try {
        await env.DB.prepare(`ALTER TABLE experiences ADD COLUMN ${column} ${definition}`).run();
      } catch (error) {
        columns = await env.DB.prepare("PRAGMA table_info(experiences)").all();
        if (!(columns.results || []).some((item) => item.name === column)) throw error;
      }
    }
    let evidenceColumns = await env.DB.prepare("PRAGMA table_info(experience_evidence)").all();
    if (!(evidenceColumns.results || []).some((item) => item.name === "preview_object_key")) {
      try {
        await env.DB.prepare("ALTER TABLE experience_evidence ADD COLUMN preview_object_key TEXT").run();
      } catch (error) {
        evidenceColumns = await env.DB.prepare("PRAGMA table_info(experience_evidence)").all();
        if (!(evidenceColumns.results || []).some((item) => item.name === "preview_object_key")) throw error;
      }
    }
  })().catch((error) => {
    experienceOptionColumnsPromise = undefined;
    throw error;
  });
  await experienceOptionColumnsPromise;
}

export async function ensureEvidenceCleanupTable(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  evidenceCleanupTablePromise ||= env.DB.prepare(
    `
    CREATE TABLE IF NOT EXISTS nfd_evidence_cleanup (
      object_key TEXT PRIMARY KEY NOT NULL,
      queued_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0
    )
  `,
  )
    .run()
    .catch((error) => {
      evidenceCleanupTablePromise = undefined;
      throw error;
    });
  await evidenceCleanupTablePromise;
}

export async function ensureModerationTable(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  moderationTablesPromise ||= (async () => {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS nfd_moderation_settings (setting_key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    ).run();
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS nfd_moderation_usage (usage_day TEXT PRIMARY KEY NOT NULL, request_count INTEGER NOT NULL DEFAULT 0)`,
    ).run();
    await env.DB.prepare(
      `INSERT OR IGNORE INTO nfd_moderation_settings (setting_key, value, updated_at) VALUES ('enabled', 'false', ?)`,
    )
      .bind(new Date().toISOString())
      .run();
  })().catch((error) => {
    moderationTablesPromise = undefined;
    throw error;
  });
  await moderationTablesPromise;
}
