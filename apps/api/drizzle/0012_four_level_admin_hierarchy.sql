CREATE TEMP TABLE role_migration_guard (
  legacy_admin_count INTEGER NOT NULL CHECK(legacy_admin_count <= 1)
);
INSERT INTO role_migration_guard SELECT COUNT(*) FROM users WHERE role='ADMIN';
DROP TABLE role_migration_guard;

CREATE TABLE users_four_level (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  password_hash TEXT,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('MEMBER','DEPARTMENT_ADMIN','DEPARTMENT_HEAD','VICE_PRESIDENT','PRESIDENT')),
  department_id TEXT REFERENCES departments(id),
  bio TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  guild_title TEXT NOT NULL DEFAULT '',
  college TEXT NOT NULL DEFAULT '',
  grade TEXT NOT NULL DEFAULT '',
  skills TEXT NOT NULL DEFAULT '[]',
  interests TEXT NOT NULL DEFAULT '[]',
  avatar_color TEXT NOT NULL DEFAULT '#2f6f64',
  profile_visibility TEXT NOT NULL DEFAULT 'MEMBERS' CHECK(profile_visibility IN ('MEMBERS','PRIVATE')),
  last_seen_at TEXT,
  attributes TEXT NOT NULL DEFAULT '[]',
  avatar_config TEXT
);

INSERT INTO users_four_level
SELECT id,username,password_hash,display_name,email,
  CASE role WHEN 'ADMIN' THEN 'PRESIDENT' WHEN 'DEPARTMENT_LEAD' THEN 'DEPARTMENT_HEAD' ELSE role END,
  department_id,bio,is_active,created_at,updated_at,guild_title,college,grade,skills,interests,
  avatar_color,profile_visibility,last_seen_at,attributes,avatar_config
FROM users;

DROP TABLE users;
ALTER TABLE users_four_level RENAME TO users;

CREATE TABLE role_assignments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK(role IN ('PRESIDENT','VICE_PRESIDENT','DEPARTMENT_HEAD','DEPARTMENT_ADMIN')),
  department_id TEXT REFERENCES departments(id),
  granted_by TEXT REFERENCES users(id),
  granted_at TEXT NOT NULL,
  revoked_by TEXT REFERENCES users(id),
  revoked_at TEXT,
  CHECK(
    (role IN ('PRESIDENT','VICE_PRESIDENT') AND department_id IS NULL)
    OR (role IN ('DEPARTMENT_HEAD','DEPARTMENT_ADMIN') AND department_id IS NOT NULL)
  )
);

CREATE INDEX role_assignment_user_idx ON role_assignments(user_id, revoked_at);
CREATE INDEX role_assignment_department_idx ON role_assignments(department_id, role, revoked_at);
CREATE UNIQUE INDEX role_assignment_active_user ON role_assignments(user_id) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX role_assignment_active_president ON role_assignments(role) WHERE role='PRESIDENT' AND revoked_at IS NULL;
CREATE UNIQUE INDEX role_assignment_active_department_head ON role_assignments(department_id, role) WHERE role='DEPARTMENT_HEAD' AND revoked_at IS NULL;

INSERT INTO role_assignments(id,user_id,role,department_id,granted_by,granted_at)
SELECT 'role-migrated-' || id,id,role,
  CASE WHEN role='DEPARTMENT_HEAD' THEN department_id ELSE NULL END,
  CASE WHEN role='DEPARTMENT_HEAD' THEN (SELECT id FROM users WHERE role='PRESIDENT' LIMIT 1) ELSE NULL END,
  updated_at
FROM users
WHERE role IN ('PRESIDENT','DEPARTMENT_HEAD');
