CREATE TABLE IF NOT EXISTS `experience_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`experience_id` text NOT NULL,
	`user_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `experience_comments_experience_created_idx` ON `experience_comments` (`experience_id`,`created_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `experience_reactions` (
	`experience_id` text NOT NULL,
	`user_id` text NOT NULL,
	`reaction` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `experience_reactions_experience_user_unique` ON `experience_reactions` (`experience_id`,`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `experience_reactions_experience_idx` ON `experience_reactions` (`experience_id`,`reaction`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `nfd_activity_audit` (
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
CREATE INDEX IF NOT EXISTS `nfd_activity_audit_created_idx` ON `nfd_activity_audit` (`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `nfd_activity_audit_actor_created_idx` ON `nfd_activity_audit` (`actor_user_id`,`created_at`);