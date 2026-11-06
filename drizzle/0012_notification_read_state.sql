CREATE TABLE IF NOT EXISTS `nfd_notification_reads` (
	`user_id` text NOT NULL,
	`notification_id` text NOT NULL,
	`read_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `nfd_notification_reads_user_notification_unique` ON `nfd_notification_reads` (`user_id`,`notification_id`);