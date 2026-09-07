ALTER TABLE users ADD COLUMN avatar_storage_key TEXT;

DROP TRIGGER IF EXISTS users_uid_required_insert;
DROP TRIGGER IF EXISTS users_uid_required_update;

CREATE TRIGGER users_uid_required_insert
BEFORE INSERT ON users
WHEN NEW.uid IS NULL OR length(trim(NEW.uid)) < 3 OR length(trim(NEW.uid)) > 24
BEGIN
  SELECT RAISE(ABORT, 'users.uid must contain between 3 and 24 characters');
END;

CREATE TRIGGER users_uid_required_update
BEFORE UPDATE OF uid ON users
WHEN NEW.uid IS NULL OR length(trim(NEW.uid)) < 3 OR length(trim(NEW.uid)) > 24
BEGIN
  SELECT RAISE(ABORT, 'users.uid must contain between 3 and 24 characters');
END;

CREATE TABLE page_uploads (
  id TEXT PRIMARY KEY,
  page_key TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id),
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX page_uploads_page_idx ON page_uploads(page_key, created_at);
