-- Legacy manual migration retained for historical reference only.
-- Do not execute via Drizzle migration journal.
-- Managed migration equivalent: 0005_blue_hulk.sql

ALTER TABLE blog DROP COLUMN IF EXISTS views;
ALTER TABLE blog DROP COLUMN IF EXISTS likes;
