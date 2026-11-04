CREATE INDEX IF NOT EXISTS experiences_author_status_page_idx ON experiences (author_id, status, created_at, id);
