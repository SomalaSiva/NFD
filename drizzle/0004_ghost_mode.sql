CREATE TABLE IF NOT EXISTS `nfd_ghost_access` (
  `user_id` text PRIMARY KEY NOT NULL,
  `enabled` integer DEFAULT 0 NOT NULL,
  `granted_by` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`granted_by`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `nfd_ghost_profiles` (
  `ghost_user_id` text PRIMARY KEY NOT NULL,
  `owner_user_id` text NOT NULL,
  `handle` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`ghost_user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`owner_user_id`) REFERENCES `nfd_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `nfd_ghost_profiles_owner_user_id_unique` ON `nfd_ghost_profiles` (`owner_user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `nfd_ghost_profiles_owner_idx` ON `nfd_ghost_profiles` (`owner_user_id`);
