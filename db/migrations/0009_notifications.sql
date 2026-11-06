CREATE TABLE `nfd_notification_state` (
	`user_id` text PRIMARY KEY NOT NULL,
	`read_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `nfd_friend_notifications_accepted_idx` ON `nfd_friend_requests` (`from_user_id`,`status`,`updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `nfd_friend_notifications_incoming_idx` ON `nfd_friend_requests` (`to_user_id`,`status`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `nfd_message_notifications_idx` ON `nfd_messages` (`recipient_id`,`created_at`,`id`);