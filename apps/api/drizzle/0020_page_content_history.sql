CREATE TABLE page_content_revisions (
  id TEXT PRIMARY KEY,
  page_key TEXT NOT NULL,
  revision_no INTEGER NOT NULL,
  config_json TEXT NOT NULL,
  changed_sections_json TEXT NOT NULL DEFAULT '[]',
  change_type TEXT NOT NULL CHECK(change_type IN ('BASELINE','UPDATE','RESTORE')),
  restored_from_id TEXT REFERENCES page_content_revisions(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  UNIQUE(page_key, revision_no)
);

CREATE INDEX page_content_revisions_page_idx ON page_content_revisions(page_key, revision_no DESC);
CREATE INDEX page_content_revisions_actor_idx ON page_content_revisions(created_by);

INSERT INTO page_content_revisions(
  id,page_key,revision_no,config_json,changed_sections_json,change_type,restored_from_id,created_by,created_at
)
SELECT
  'revision-baseline-' || replace(page_key, ':', '-'),
  page_key,
  1,
  config_json,
  '[{"sectionId":"page","changeKinds":["INITIAL"]}]',
  'BASELINE',
  NULL,
  updated_by,
  updated_at
FROM page_content_configs;
