ALTER TABLE `nfd_users` ADD `username` text;--> statement-breakpoint
ALTER TABLE `nfd_users` ADD `bio` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `nfd_users_username_unique` ON `nfd_users` ("username" COLLATE NOCASE) WHERE username IS NOT NULL;
