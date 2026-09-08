ALTER TABLE users ADD COLUMN signature TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN profile_cover_storage_key TEXT;

CREATE TABLE profile_photos (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX profile_photos_owner_order_idx ON profile_photos(owner_id, sort_order, created_at);
