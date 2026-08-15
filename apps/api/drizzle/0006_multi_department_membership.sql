CREATE TABLE application_departments (
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  department_id TEXT NOT NULL REFERENCES departments(id),
  preference_order INTEGER NOT NULL DEFAULT 0 CHECK(preference_order >= 0),
  PRIMARY KEY(application_id, department_id)
);

CREATE INDEX application_department_order_idx
  ON application_departments(application_id, preference_order);

INSERT OR IGNORE INTO application_departments(application_id, department_id, preference_order)
  SELECT id, department_id, 0 FROM applications;

CREATE TABLE user_departments (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id TEXT NOT NULL REFERENCES departments(id),
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
  joined_at TEXT NOT NULL,
  PRIMARY KEY(user_id, department_id)
);

CREATE INDEX user_department_membership_idx
  ON user_departments(department_id, user_id);

INSERT OR IGNORE INTO user_departments(user_id, department_id, is_primary, joined_at)
  SELECT id, department_id, 1, created_at FROM users WHERE department_id IS NOT NULL;

UPDATE departments SET description='角色造型、服装道具与舞台呈现' WHERE id='dept-cos' AND description='COS部的公会驻地与专业协作小组';
UPDATE departments SET description='摄影摄像、直播与活动技术支持' WHERE id='dept-tech' AND description='技术部的公会驻地与专业协作小组';
UPDATE departments SET description='乐队排练、歌曲编排与现场演出' WHERE id='dept-music' AND description='轻音部的公会驻地与专业协作小组';
UPDATE departments SET description='绘画、设定创作与社团原创企划' WHERE id='dept-original' AND description='原创部的公会驻地与专业协作小组';
UPDATE departments SET description='宅舞排练、舞台编排与演出' WHERE id='dept-dance' AND description='舞装部的公会驻地与专业协作小组';
UPDATE departments SET description='海报文案、新媒体运营与活动宣传' WHERE id='dept-publicity' AND description='外宣部的公会驻地与专业协作小组';
