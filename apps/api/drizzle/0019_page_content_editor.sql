CREATE TABLE page_content_configs (
  page_key TEXT PRIMARY KEY,
  config_json TEXT NOT NULL DEFAULT '{"sections":[],"imageLinks":{}}',
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX page_content_configs_updated_by_idx ON page_content_configs(updated_by);
