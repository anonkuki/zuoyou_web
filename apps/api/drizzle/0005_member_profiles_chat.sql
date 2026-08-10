ALTER TABLE users ADD COLUMN guild_title TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN college TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN grade TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN skills TEXT NOT NULL DEFAULT '[]';
ALTER TABLE users ADD COLUMN interests TEXT NOT NULL DEFAULT '[]';
ALTER TABLE users ADD COLUMN avatar_color TEXT NOT NULL DEFAULT '#2f6f64';
ALTER TABLE users ADD COLUMN profile_visibility TEXT NOT NULL DEFAULT 'MEMBERS' CHECK(profile_visibility IN ('MEMBERS','PRIVATE'));
ALTER TABLE users ADD COLUMN last_seen_at TEXT;

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('DIRECT','DEPARTMENT')),
  direct_key TEXT UNIQUE,
  department_id TEXT REFERENCES departments(id),
  title TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK((type='DIRECT' AND direct_key IS NOT NULL AND department_id IS NULL) OR (type='DEPARTMENT' AND direct_key IS NULL AND department_id IS NOT NULL))
);

CREATE TABLE conversation_participants (
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TEXT,
  muted INTEGER NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL,
  PRIMARY KEY(conversation_id,user_id)
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  reply_to_id TEXT REFERENCES messages(id),
  edited_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX conversation_department_idx ON conversations(department_id,type);
CREATE INDEX conversation_participant_user_idx ON conversation_participants(user_id,conversation_id);
CREATE INDEX message_conversation_time_idx ON messages(conversation_id,created_at DESC,id DESC);
