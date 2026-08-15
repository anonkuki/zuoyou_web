INSERT OR IGNORE INTO conversations (
  id,
  type,
  direct_key,
  department_id,
  title,
  created_at,
  updated_at
)
SELECT
  'conversation-' || departments.id,
  'DEPARTMENT',
  NULL,
  departments.id,
  departments.name || '协作频道',
  departments.created_at,
  departments.updated_at
FROM departments
WHERE NOT EXISTS (
  SELECT 1
  FROM conversations
  WHERE conversations.type = 'DEPARTMENT'
    AND conversations.department_id = departments.id
);
