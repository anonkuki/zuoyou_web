CREATE TABLE registration_requests (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  contact TEXT NOT NULL COLLATE NOCASE,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX registration_request_status_time_idx
  ON registration_requests(status, created_at DESC);

CREATE UNIQUE INDEX registration_request_pending_username_unique
  ON registration_requests(username)
  WHERE status = 'PENDING';

CREATE UNIQUE INDEX registration_request_pending_contact_unique
  ON registration_requests(contact)
  WHERE status = 'PENDING';
