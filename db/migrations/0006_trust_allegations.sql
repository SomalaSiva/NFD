CREATE TABLE `nfd_trust_allegation_votes` (
	`allegation_id` text NOT NULL,
	`voter_user_id` text NOT NULL,
	`choice` text NOT NULL,
	`voter_group` text NOT NULL,
	`weight` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`allegation_id`) REFERENCES `nfd_trust_allegations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`voter_user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_trust_votes_allegation_voter_unique` ON `nfd_trust_allegation_votes` (`allegation_id`,`voter_user_id`);--> statement-breakpoint
CREATE INDEX `nfd_trust_votes_allegation_group_idx` ON `nfd_trust_allegation_votes` (`allegation_id`,`voter_group`,`choice`);--> statement-breakpoint
CREATE TABLE `nfd_trust_allegations` (
	`id` text PRIMARY KEY NOT NULL,
	`experience_id` text NOT NULL,
	`author_user_id` text NOT NULL,
	`subject_user_id` text NOT NULL,
	`classification` text NOT NULL,
	`outcome` text NOT NULL,
	`status` text DEFAULT 'unverified' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_trust_allegations_experience_unique` ON `nfd_trust_allegations` (`experience_id`);--> statement-breakpoint
CREATE INDEX `nfd_trust_allegations_subject_created_idx` ON `nfd_trust_allegations` (`subject_user_id`,`created_at`);