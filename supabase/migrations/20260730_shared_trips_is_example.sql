-- Official BeTacora sample trips for Descubre.
-- Examples are NOT attributed to a real user (user_id stays NULL).
-- Depends on show_in_feed (see 20260730_shared_trips_show_in_feed.sql).
-- is_example: honesty flag for "Ejemplo / Creado por BeTacora" badges and for
-- easy removal once organic feed content is enough (DELETE WHERE is_example).

ALTER TABLE shared_trips
  ADD COLUMN IF NOT EXISTS is_example BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS shared_trips_is_example_idx
  ON shared_trips (is_example)
  WHERE is_example = true;

COMMENT ON COLUMN shared_trips.is_example IS
  'Official BeTacora sample content (not a real traveler). Show an Ejemplo badge; safe to delete when organic feed is healthy.';
