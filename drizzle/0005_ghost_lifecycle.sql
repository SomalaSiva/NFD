DROP INDEX `nfd_ghost_profiles_owner_user_id_unique`;--> statement-breakpoint
ALTER TABLE `nfd_ghost_profiles` ADD `active` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_ghost_profiles_active_owner_unique` ON `nfd_ghost_profiles` (`owner_user_id`) WHERE active = 1;