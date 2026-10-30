ALTER TABLE `nfd_sessions` ADD `last_activity_at` text DEFAULT '' NOT NULL;
UPDATE `nfd_sessions` SET `last_activity_at` = datetime('now') WHERE `last_activity_at` = '';
