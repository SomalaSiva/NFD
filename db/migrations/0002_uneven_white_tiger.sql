CREATE TABLE `nfd_stories` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`original_filename` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_stories_object_key_unique` ON `nfd_stories` (`object_key`);--> statement-breakpoint
CREATE INDEX `nfd_stories_author_expires_idx` ON `nfd_stories` (`author_id`,`expires_at`);--> statement-breakpoint
CREATE INDEX `nfd_stories_expires_idx` ON `nfd_stories` (`expires_at`);--> statement-breakpoint
CREATE TABLE `nfd_story_views` (
	`story_id` text NOT NULL,
	`viewer_id` text NOT NULL,
	`viewed_at` text NOT NULL,
	FOREIGN KEY (`story_id`) REFERENCES `nfd_stories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`viewer_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_story_views_story_viewer_unique` ON `nfd_story_views` (`story_id`,`viewer_id`);--> statement-breakpoint
CREATE INDEX `nfd_story_views_viewer_idx` ON `nfd_story_views` (`viewer_id`,`viewed_at`);--> statement-breakpoint
ALTER TABLE `nfd_users` ADD `profile_photo_key` text;