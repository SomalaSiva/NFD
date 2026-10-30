CREATE TABLE `nfd_trust_agreement_events` (
	`id` text PRIMARY KEY NOT NULL,
	`agreement_id` text NOT NULL,
	`version` integer NOT NULL,
	`actor_user_id` text NOT NULL,
	`action` text NOT NULL,
	`details_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`agreement_id`) REFERENCES `nfd_trust_agreements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `nfd_trust_agreement_events_created_idx` ON `nfd_trust_agreement_events` (`agreement_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `nfd_trust_agreement_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`agreement_id` text NOT NULL,
	`version` integer NOT NULL,
	`user_id` text NOT NULL,
	`responsibility` text NOT NULL,
	`decision` text,
	`decision_note` text DEFAULT '' NOT NULL,
	`decided_version` integer,
	`fulfillment_confirmed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`agreement_id`) REFERENCES `nfd_trust_agreements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_trust_agreement_participant_unique` ON `nfd_trust_agreement_participants` (`agreement_id`,`version`,`user_id`);--> statement-breakpoint
CREATE INDEX `nfd_trust_agreement_participant_user_idx` ON `nfd_trust_agreement_participants` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `nfd_trust_agreement_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`agreement_id` text NOT NULL,
	`version` integer NOT NULL,
	`content_json` text NOT NULL,
	`changed_by` text NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`agreement_id`) REFERENCES `nfd_trust_agreements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_trust_agreement_version_unique` ON `nfd_trust_agreement_versions` (`agreement_id`,`version`);--> statement-breakpoint
CREATE INDEX `nfd_trust_agreement_versions_created_idx` ON `nfd_trust_agreement_versions` (`agreement_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `nfd_trust_agreements` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`status` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `nfd_trust_agreements_owner_updated_idx` ON `nfd_trust_agreements` (`owner_user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `nfd_trust_commitment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`commitment_id` text NOT NULL,
	`actor_user_id` text NOT NULL,
	`action` text NOT NULL,
	`details_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`commitment_id`) REFERENCES `nfd_trust_commitments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `nfd_trust_commitment_events_created_idx` ON `nfd_trust_commitment_events` (`commitment_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `nfd_trust_commitment_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`commitment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'participant' NOT NULL,
	`invitation_status` text DEFAULT 'invited' NOT NULL,
	`fulfillment_confirmed_at` text,
	`dispute_resolution` text,
	`dispute_note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`commitment_id`) REFERENCES `nfd_trust_commitments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_trust_commitment_participant_unique` ON `nfd_trust_commitment_participants` (`commitment_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `nfd_trust_commitment_participant_user_idx` ON `nfd_trust_commitment_participants` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `nfd_trust_commitments` (
	`id` text PRIMARY KEY NOT NULL,
	`created_by` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`due_at` text NOT NULL,
	`status` text NOT NULL,
	`fulfillment_reported_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `nfd_trust_commitments_creator_created_idx` ON `nfd_trust_commitments` (`created_by`,`created_at`);--> statement-breakpoint
CREATE INDEX `nfd_trust_commitments_status_due_idx` ON `nfd_trust_commitments` (`status`,`due_at`);--> statement-breakpoint
CREATE TABLE `nfd_trust_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'Other' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`directory_visible` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `nfd_trust_profiles_directory_idx` ON `nfd_trust_profiles` (`directory_visible`,`updated_at`);