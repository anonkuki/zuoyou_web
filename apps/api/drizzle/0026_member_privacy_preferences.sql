ALTER TABLE users
  ADD COLUMN email_notifications_enabled INTEGER NOT NULL DEFAULT 0
  CHECK(email_notifications_enabled IN (0, 1));

ALTER TABLE registration_requests
  ADD COLUMN email_notifications_enabled INTEGER NOT NULL DEFAULT 0
  CHECK(email_notifications_enabled IN (0, 1));
