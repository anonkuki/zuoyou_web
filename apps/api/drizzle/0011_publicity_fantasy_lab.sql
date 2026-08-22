UPDATE departments
SET name = '外宣&幻想研',
    description = '宣传运营、影像记录与动漫文化研究',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'dept-publicity';

UPDATE conversations
SET title = '外宣&幻想研协作频道',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE department_id = 'dept-publicity' AND type = 'DEPARTMENT';
