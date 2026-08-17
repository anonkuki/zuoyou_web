CREATE TABLE area_messages (
  id TEXT PRIMARY KEY,
  area_id TEXT NOT NULL,
  sender_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX area_message_area_idx ON area_messages(area_id, created_at);
