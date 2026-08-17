ALTER TABLE users ADD COLUMN attributes TEXT NOT NULL DEFAULT '[]';
ALTER TABLE announcements ADD COLUMN content TEXT NOT NULL DEFAULT '';

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX post_list_idx ON posts(deleted_at, pinned, created_at);

CREATE TABLE post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX post_comment_post_idx ON post_comments(post_id, created_at);
