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
ALTER TABLE `experiences` ADD `visibility` text DEFAULT 'public' NOT NULL;--> statement-breakpoint
CREATE INDEX `experiences_visibility_created_idx` ON `experiences` (`visibility`,`created_at`);
