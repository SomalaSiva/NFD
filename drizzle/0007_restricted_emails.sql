CREATE TABLE `nfd_blocked_emails` (
	`email` text PRIMARY KEY NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `nfd_blocked_emails_created_idx` ON `nfd_blocked_emails` (`created_at`);