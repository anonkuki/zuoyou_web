ALTER TABLE applications ADD COLUMN college TEXT NOT NULL DEFAULT '未填写';
ALTER TABLE activity_results ADD COLUMN file_id TEXT REFERENCES files(id);
