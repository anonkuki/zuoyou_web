ALTER TABLE users ADD COLUMN uid TEXT;

UPDATE users
SET uid = printf('%05d', 10000 + (
  SELECT COUNT(*)
  FROM users AS earlier
  WHERE earlier.rowid <= users.rowid
));

CREATE UNIQUE INDEX users_uid_unique ON users(uid);

CREATE TRIGGER users_uid_required_insert
BEFORE INSERT ON users
WHEN NEW.uid IS NULL OR length(NEW.uid) != 5 OR NEW.uid GLOB '*[^0-9]*'
BEGIN
  SELECT RAISE(ABORT, 'users.uid must be a unique five-digit value');
END;

CREATE TRIGGER users_uid_required_update
BEFORE UPDATE OF uid ON users
WHEN NEW.uid IS NULL OR length(NEW.uid) != 5 OR NEW.uid GLOB '*[^0-9]*'
BEGIN
  SELECT RAISE(ABORT, 'users.uid must be a unique five-digit value');
END;
