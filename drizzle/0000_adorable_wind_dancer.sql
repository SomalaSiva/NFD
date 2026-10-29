CREATE TABLE `experience_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`experience_id` text NOT NULL,
	`object_key` text NOT NULL,
	`original_filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `experience_evidence_object_key_unique` ON `experience_evidence` (`object_key`);--> statement-breakpoint
CREATE INDEX `experience_evidence_experience_id_idx` ON `experience_evidence` (`experience_id`);--> statement-breakpoint
CREATE TABLE `experiences` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`experience_category` text NOT NULL,
	`incident_category` text NOT NULL,
	`place` text NOT NULL,
	`place_category` text NOT NULL,
	`incident_time` text NOT NULL,
	`incident_time_zone` text NOT NULL,
	`location_details` text,
	`short_description` text NOT NULL,
	`full_description` text NOT NULL,
	`status` text DEFAULT 'shared' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `experiences_author_created_idx` ON `experiences` (`author_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `experiences_status_created_idx` ON `experiences` (`status`,`created_at`);