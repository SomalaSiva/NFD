CREATE TABLE `nfd_agreement_participants` (
	`agreement_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`accepted_version` integer,
	`created_at` text NOT NULL,
	`responded_at` text,
	FOREIGN KEY (`agreement_id`) REFERENCES `nfd_agreements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_agreement_participants_pair_unique` ON `nfd_agreement_participants` (`agreement_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `nfd_agreement_participants_user_status_idx` ON `nfd_agreement_participants` (`user_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `nfd_agreement_participants_agreement_status_idx` ON `nfd_agreement_participants` (`agreement_id`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `nfd_agreement_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`agreement_id` text NOT NULL,
	`version` integer NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`agreement_id`) REFERENCES `nfd_agreements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_agreement_versions_number_unique` ON `nfd_agreement_versions` (`agreement_id`,`version`);--> statement-breakpoint
CREATE INDEX `nfd_agreement_versions_created_idx` ON `nfd_agreement_versions` (`agreement_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `nfd_agreements` (
	`id` text PRIMARY KEY NOT NULL,
	`created_by` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`current_version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `nfd_agreements_created_by_updated_idx` ON `nfd_agreements` (`created_by`,`updated_at`);--> statement-breakpoint
CREATE INDEX `nfd_agreements_status_updated_idx` ON `nfd_agreements` (`status`,`updated_at`);