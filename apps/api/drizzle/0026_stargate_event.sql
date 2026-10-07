CREATE TABLE stargate_records (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  seq INTEGER NOT NULL UNIQUE CHECK(seq > 0),
  created_at TEXT NOT NULL
);

CREATE INDEX stargate_records_seq_idx ON stargate_records(seq DESC);
