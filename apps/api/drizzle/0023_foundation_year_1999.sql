INSERT INTO site_settings(key, value, updated_at)
VALUES ('foundedYear', '1999', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value='1999', updated_at=CURRENT_TIMESTAMP;
