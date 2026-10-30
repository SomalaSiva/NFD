import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const nfdUsers = sqliteTable(
  "nfd_users",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    providerSubject: text("provider_subject").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    active: integer("active").notNull().default(1),
  },
  (table) => [uniqueIndex("nfd_users_provider_subject_unique").on(table.provider, table.providerSubject)],
);

export const nfdBlockedEmails = sqliteTable(
  "nfd_blocked_emails",
  {
    email: text("email").primaryKey(),
    reason: text("reason").notNull().default(""),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("nfd_blocked_emails_created_idx").on(table.createdAt)],
);

export const nfdSessions = sqliteTable(
  "nfd_sessions",
  {
    sessionHash: text("session_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => nfdUsers.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
    lastActivityAt: text("last_activity_at").notNull().default(""),
  },
  (table) => [index("nfd_sessions_user_id_idx").on(table.userId)],
);

export const nfdGhostAccess = sqliteTable("nfd_ghost_access", {
  userId: text("user_id")
    .primaryKey()
    .references(() => nfdUsers.id, { onDelete: "cascade" }),
  enabled: integer("enabled").notNull().default(0),
  grantedBy: text("granted_by")
    .notNull()
    .references(() => nfdUsers.id),
  updatedAt: text("updated_at").notNull(),
});

export const nfdGhostProfiles = sqliteTable(
  "nfd_ghost_profiles",
  {
    ghostUserId: text("ghost_user_id")
      .primaryKey()
      .references(() => nfdUsers.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => nfdUsers.id, { onDelete: "cascade" }),
    handle: text("handle").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    active: integer("active").notNull().default(1),
  },
  (table) => [
    uniqueIndex("nfd_ghost_profiles_handle_unique").on(sql`${table.handle} COLLATE NOCASE`),
    index("nfd_ghost_profiles_owner_idx").on(table.ownerUserId),
    uniqueIndex("nfd_ghost_profiles_active_owner_unique")
      .on(table.ownerUserId)
      .where(sql`active = 1`),
  ],
);

export const experiences = sqliteTable(
  "experiences",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id").notNull(),
    experienceCategory: text("experience_category").notNull(),
    incidentCategory: text("incident_category").notNull(),
    place: text("place").notNull(),
    placeCategory: text("place_category").notNull(),
    incidentTime: text("incident_time").notNull(),
    incidentTimeEnd: text("incident_time_end"),
    incidentTimeZone: text("incident_time_zone").notNull(),
    locationDetails: text("location_details"),
    shortDescription: text("short_description").notNull(),
    fullDescription: text("full_description").notNull(),
    visibility: text("visibility").notNull().default("public"),
    commentsEnabled: integer("comments_enabled").notNull().default(1),
    status: text("status").notNull().default("shared"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("experiences_author_created_idx").on(table.authorId, table.createdAt),
    index("experiences_visibility_created_idx").on(table.visibility, table.createdAt),
    index("experiences_status_created_idx").on(table.status, table.createdAt),
  ],
);

export const nfdFriendRequests = sqliteTable(
  "nfd_friend_requests",
  {
    id: text("id").primaryKey(),
    fromUserId: text("from_user_id")
      .notNull()
      .references(() => nfdUsers.id, { onDelete: "cascade" }),
    toUserId: text("to_user_id")
      .notNull()
      .references(() => nfdUsers.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("nfd_friend_requests_pair_unique").on(table.fromUserId, table.toUserId),
    index("nfd_friend_requests_from_status_idx").on(table.fromUserId, table.status, table.createdAt),
    index("nfd_friend_requests_to_status_idx").on(table.toUserId, table.status, table.createdAt),
  ],
);

export const experienceEvidence = sqliteTable(
  "experience_evidence",
  {
    id: text("id").primaryKey(),
    experienceId: text("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull().unique(),
    previewObjectKey: text("preview_object_key"),
    originalFilename: text("original_filename").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("experience_evidence_experience_id_idx").on(table.experienceId)],
);

export const experienceReactions = sqliteTable(
  "experience_reactions",
  {
    experienceId: text("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => nfdUsers.id, { onDelete: "cascade" }),
    reaction: text("reaction").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("experience_reactions_experience_user_unique").on(table.experienceId, table.userId),
    index("experience_reactions_experience_idx").on(table.experienceId, table.reaction),
  ],
);

export const experienceComments = sqliteTable(
  "experience_comments",
  {
    id: text("id").primaryKey(),
    experienceId: text("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => nfdUsers.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("experience_comments_experience_created_idx").on(table.experienceId, table.createdAt)],
);

export const nfdMessages = sqliteTable(
  "nfd_messages",
  {
    id: text("id").primaryKey(),
    senderId: text("sender_id")
      .notNull()
      .references(() => nfdUsers.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => nfdUsers.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull(),
    seenAt: text("seen_at"),
    expiresAt: text("expires_at"),
  },
  (table) => [
    index("nfd_messages_sender_recipient_created_idx").on(table.senderId, table.recipientId, table.createdAt),
    index("nfd_messages_recipient_sender_created_idx").on(table.recipientId, table.senderId, table.createdAt),
    index("nfd_messages_expires_idx").on(table.expiresAt),
  ],
);

export const nfdActivityAudit = sqliteTable(
  "nfd_activity_audit",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => nfdUsers.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    detailsJson: text("details_json").notNull().default("{}"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("nfd_activity_audit_created_idx").on(table.createdAt),
    index("nfd_activity_audit_actor_created_idx").on(table.actorUserId, table.createdAt),
  ],
);

export const nfdEvidenceCleanup = sqliteTable("nfd_evidence_cleanup", {
  objectKey: text("object_key").primaryKey(),
  queuedAt: text("queued_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
});

// Tables kept in sync with the production D1 schema. Runtime queries use D1's
// prepared-statement API; these definitions are the schema reference for tools.
export const nfdAdminUsers = sqliteTable("nfd_admin_users", {
  email: text("email").primaryKey().notNull(),
  addedBy: text("added_by").notNull(),
  addedAt: text("added_at").notNull(),
});

export const nfdModerationSettings = sqliteTable("nfd_moderation_settings", {
  settingKey: text("setting_key").primaryKey().notNull(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const nfdModerationUsage = sqliteTable("nfd_moderation_usage", {
  usageDay: text("usage_day").primaryKey().notNull(),
  requestCount: integer("request_count").notNull().default(0),
});
