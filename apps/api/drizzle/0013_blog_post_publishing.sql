ALTER TABLE posts ADD COLUMN subtitle TEXT;
ALTER TABLE posts ADD COLUMN department_id TEXT REFERENCES departments(id);
ALTER TABLE posts ADD COLUMN body_json TEXT NOT NULL DEFAULT '[]';

CREATE TABLE post_placements (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL CHECK(scope_type IN ('GUILD','DEPARTMENT')),
  department_id TEXT REFERENCES departments(id),
  pinned INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  placed_by TEXT NOT NULL REFERENCES users(id),
  placed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK((scope_type='GUILD' AND department_id IS NULL) OR (scope_type='DEPARTMENT' AND department_id IS NOT NULL))
);
CREATE UNIQUE INDEX post_placement_scope_unique ON post_placements(post_id,scope_type,COALESCE(department_id,''));
CREATE INDEX post_placement_board_idx ON post_placements(scope_type,department_id,pinned,featured,placed_at);

CREATE TABLE post_votes (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY(post_id,user_id)
);

CREATE TABLE post_assets (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX post_asset_post_idx ON post_assets(post_id);

UPDATE posts SET body_json=json_array(json_object('type','PARAGRAPH','text',content)) WHERE body_json='[]';
INSERT OR IGNORE INTO post_placements(id,post_id,scope_type,department_id,pinned,featured,placed_by,placed_at,updated_at)
  SELECT 'legacy-placement-'||id,id,'GUILD',NULL,pinned,0,user_id,created_at,updated_at FROM posts WHERE pinned=1 AND deleted_at IS NULL;
