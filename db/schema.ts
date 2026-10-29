import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const experiences = sqliteTable("experiences", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull(),
  experienceCategory: text("experience_category").notNull(),
  incidentCategory: text("incident_category").notNull(),
  place: text("place").notNull(),
  placeCategory: text("place_category").notNull(),
  incidentTime: text("incident_time").notNull(),
  incidentTimeZone: text("incident_time_zone").notNull(),
  locationDetails: text("location_details"),
  shortDescription: text("short_description").notNull(),
  fullDescription: text("full_description").notNull(),
  status: text("status").notNull().default("shared"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("experiences_author_created_idx").on(table.authorId, table.createdAt),
  index("experiences_status_created_idx").on(table.status, table.createdAt),
]);

export const experienceEvidence = sqliteTable("experience_evidence", {
  id: text("id").primaryKey(),
  experienceId: text("experience_id").notNull().references(() => experiences.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull().unique(),
  originalFilename: text("original_filename").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("experience_evidence_experience_id_idx").on(table.experienceId)]);
