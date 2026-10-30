CREATE TABLE `experience_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`experience_id` text NOT NULL,
	`user_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `experience_comments_experience_created_idx` ON `experience_comments` (`experience_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `experience_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`experience_id` text NOT NULL,
	`object_key` text NOT NULL,
	`preview_object_key` text,
	`original_filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `experience_evidence_object_key_unique` ON `experience_evidence` (`object_key`);--> statement-breakpoint
CREATE INDEX `experience_evidence_experience_id_idx` ON `experience_evidence` (`experience_id`);--> statement-breakpoint
CREATE TABLE `experience_reactions` (
	`experience_id` text NOT NULL,
	`user_id` text NOT NULL,
	`reaction` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `experience_reactions_experience_user_unique` ON `experience_reactions` (`experience_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `experience_reactions_experience_idx` ON `experience_reactions` (`experience_id`,`reaction`);--> statement-breakpoint
CREATE TABLE `experiences` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`experience_category` text NOT NULL,
	`incident_category` text NOT NULL,
	`place` text NOT NULL,
	`place_category` text NOT NULL,
	`incident_time` text NOT NULL,
	`incident_time_end` text,
	`incident_time_zone` text NOT NULL,
	`location_details` text,
	`short_description` text NOT NULL,
	`full_description` text NOT NULL,
	`visibility` text DEFAULT 'public' NOT NULL,
	`comments_enabled` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'shared' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `experiences_author_created_idx` ON `experiences` (`author_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `experiences_visibility_created_idx` ON `experiences` (`visibility`,`created_at`);--> statement-breakpoint
CREATE INDEX `experiences_status_created_idx` ON `experiences` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `nfd_activity_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text,
	`details_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `nfd_activity_audit_created_idx` ON `nfd_activity_audit` (`created_at`);--> statement-breakpoint
CREATE INDEX `nfd_activity_audit_actor_created_idx` ON `nfd_activity_audit` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `nfd_admin_users` (
	`email` text PRIMARY KEY NOT NULL,
	`added_by` text NOT NULL,
	`added_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nfd_blocked_emails` (
	`email` text PRIMARY KEY NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `nfd_blocked_emails_created_idx` ON `nfd_blocked_emails` (`created_at`);--> statement-breakpoint
CREATE TABLE `nfd_evidence_cleanup` (
	`object_key` text PRIMARY KEY NOT NULL,
	`queued_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nfd_friend_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`from_user_id` text NOT NULL,
	`to_user_id` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`from_user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_friend_requests_pair_unique` ON `nfd_friend_requests` (`from_user_id`,`to_user_id`);--> statement-breakpoint
CREATE INDEX `nfd_friend_requests_from_status_idx` ON `nfd_friend_requests` (`from_user_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `nfd_friend_requests_to_status_idx` ON `nfd_friend_requests` (`to_user_id`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `nfd_ghost_access` (
	`user_id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`granted_by` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `nfd_ghost_profiles` (
	`ghost_user_id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`handle` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`ghost_user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_ghost_profiles_handle_unique` ON `nfd_ghost_profiles` ("handle" COLLATE NOCASE);--> statement-breakpoint
CREATE INDEX `nfd_ghost_profiles_owner_idx` ON `nfd_ghost_profiles` (`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_ghost_profiles_active_owner_unique` ON `nfd_ghost_profiles` (`owner_user_id`) WHERE active = 1;--> statement-breakpoint
CREATE TABLE `nfd_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`seen_at` text,
	`expires_at` text,
	FOREIGN KEY (`sender_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `nfd_messages_sender_recipient_created_idx` ON `nfd_messages` (`sender_id`,`recipient_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `nfd_messages_recipient_sender_created_idx` ON `nfd_messages` (`recipient_id`,`sender_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `nfd_messages_expires_idx` ON `nfd_messages` (`expires_at`);--> statement-breakpoint
CREATE TABLE `nfd_moderation_settings` (
	`setting_key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nfd_moderation_usage` (
	`usage_day` text PRIMARY KEY NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nfd_sessions` (
	`session_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `nfd_sessions_user_id_idx` ON `nfd_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `nfd_users` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_subject` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_users_provider_subject_unique` ON `nfd_users` (`provider`,`provider_subject`);