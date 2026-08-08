CREATE TABLE announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('RECRUITMENT','ACTIVITY','NOTICE')),
  href TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX announcements_public_order ON announcements(published, pinned, published_at);
