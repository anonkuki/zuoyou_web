CREATE TABLE post_subboards (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX post_subboard_department_name_unique ON post_subboards(department_id, name);
CREATE INDEX post_subboard_department_idx ON post_subboards(department_id, created_at);

ALTER TABLE posts ADD COLUMN subboard_id TEXT REFERENCES post_subboards(id) ON DELETE SET NULL;
CREATE INDEX post_subboard_post_idx ON posts(subboard_id, created_at);
