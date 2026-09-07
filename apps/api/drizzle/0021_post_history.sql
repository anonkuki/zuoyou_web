CREATE TABLE post_revisions (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  revision_no INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK(change_type IN ('CREATE','UPDATE','RESTORE')),
  restored_from_id TEXT REFERENCES post_revisions(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  UNIQUE(post_id, revision_no)
);

CREATE INDEX post_revisions_post_idx ON post_revisions(post_id, revision_no DESC);
CREATE INDEX post_revisions_actor_idx ON post_revisions(created_by);

INSERT INTO post_revisions(id,post_id,revision_no,snapshot_json,change_type,restored_from_id,created_by,created_at)
SELECT
  'post-revision-baseline-' || p.id,
  p.id,
  1,
  json_object(
    'title',p.title,'subtitle',p.subtitle,'content',p.content,'bodyJson',p.body_json,
    'departmentId',p.department_id,'subboardId',p.subboard_id,
    'imageAssetIds',json(COALESCE((SELECT json_group_array(a.id) FROM post_assets a WHERE a.post_id=p.id AND a.asset_kind='IMAGE'),'[]')),
    'attachmentIds',json(COALESCE((SELECT json_group_array(a.id) FROM post_assets a WHERE a.post_id=p.id AND a.asset_kind='ATTACHMENT'),'[]'))
  ),
  'CREATE',NULL,p.user_id,p.created_at
FROM posts p WHERE p.deleted_at IS NULL;
