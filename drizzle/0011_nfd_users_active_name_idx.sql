CREATE INDEX IF NOT EXISTS nfd_users_active_name_idx ON nfd_users (active, display_name COLLATE NOCASE, id);
