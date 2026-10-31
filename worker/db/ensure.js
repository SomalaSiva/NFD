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
let storyTablesPromise;
let appSettingsTablePromise;

export async function ensureAppSettings(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  appSettingsTablePromise ||= (async () => {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS nfd_app_settings (setting_key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    ).run();
    await env.DB.prepare(
      `INSERT OR IGNORE INTO nfd_app_settings (setting_key, value, updated_at) VALUES ('session_idle_minutes', '4', ?)`,
    )
      .bind(new Date().toISOString())
      .run();
  })().catch((error) => {
    appSettingsTablePromise = undefined;
    throw error;
  });
  await appSettingsTablePromise;
}

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

export async function ensureStoryTables(env) {
  if (!env.DB) throw new Error("The NFD database is unavailable.");
  await ensureIdentityTables(env);
  storyTablesPromise ||= (async () => {
    const userColumns = await env.DB.prepare("PRAGMA table_info(nfd_users)").all();
    if (!(userColumns.results || []).some((column) => column.name === "profile_photo_key")) {
      try {
        await env.DB.prepare("ALTER TABLE nfd_users ADD COLUMN profile_photo_key TEXT").run();
      } catch (error) {
        const refreshedColumns = await env.DB.prepare("PRAGMA table_info(nfd_users)").all();
        if (!(refreshedColumns.results || []).some((column) => column.name === "profile_photo_key"))
          throw error;
      }
    }
    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS nfd_stories (
        id TEXT PRIMARY KEY NOT NULL,
        author_id TEXT NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE,
        object_key TEXT NOT NULL UNIQUE,
        content_type TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        caption TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )
    `,
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS nfd_stories_author_expires_idx ON nfd_stories (author_id, expires_at)",
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS nfd_stories_expires_idx ON nfd_stories (expires_at)",
    ).run();
    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS nfd_story_views (
        story_id TEXT NOT NULL REFERENCES nfd_stories(id) ON DELETE CASCADE,
        viewer_id TEXT NOT NULL REFERENCES nfd_users(id) ON DELETE CASCADE,
        viewed_at TEXT NOT NULL,
        PRIMARY KEY (story_id, viewer_id)
      )
    `,
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS nfd_story_views_viewer_idx ON nfd_story_views (viewer_id, viewed_at)",
    ).run();
  })().catch((error) => {
    storyTablesPromise = undefined;
    throw error;
  });
  await storyTablesPromise;
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
