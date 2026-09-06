ALTER TABLE post_assets ADD COLUMN file_name TEXT NOT NULL DEFAULT '';
ALTER TABLE post_assets ADD COLUMN asset_kind TEXT NOT NULL DEFAULT 'IMAGE' CHECK(asset_kind IN ('IMAGE','ATTACHMENT'));

CREATE INDEX post_asset_kind_idx ON post_assets(post_id,asset_kind,created_at);
