-- Opt-in for public Descubre feed (separate from link sharing).
-- Creating a share link alone must NOT list the trip in the feed.

ALTER TABLE shared_trips
  ADD COLUMN IF NOT EXISTS show_in_feed BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS shared_trips_show_in_feed_created_at_idx
  ON shared_trips (created_at DESC)
  WHERE show_in_feed = true;
