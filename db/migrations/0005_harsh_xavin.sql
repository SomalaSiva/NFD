CREATE TABLE `nfd_agreement_outcome_responses` (
	`outcome_id` text NOT NULL,
	`user_id` text NOT NULL,
	`decision` text NOT NULL,
	`note` text,
	`responded_at` text NOT NULL,
	FOREIGN KEY (`outcome_id`) REFERENCES `nfd_agreement_outcomes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_agreement_outcome_responses_pair_unique` ON `nfd_agreement_outcome_responses` (`outcome_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `nfd_agreement_outcome_responses_outcome_idx` ON `nfd_agreement_outcome_responses` (`outcome_id`,`responded_at`);--> statement-breakpoint
CREATE TABLE `nfd_agreement_outcomes` (
	`id` text PRIMARY KEY NOT NULL,
	`agreement_id` text NOT NULL,
	`agreement_version` integer NOT NULL,
	`required_responses` integer NOT NULL,
	`reported_by` text NOT NULL,
	`outcome` text NOT NULL,
	`note` text,
	`status` text DEFAULT 'awaiting' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`agreement_id`) REFERENCES `nfd_agreements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reported_by`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_agreement_outcomes_version_unique` ON `nfd_agreement_outcomes` (`agreement_id`,`agreement_version`);--> statement-breakpoint
CREATE INDEX `nfd_agreement_outcomes_status_idx` ON `nfd_agreement_outcomes` (`status`,`created_at`);
