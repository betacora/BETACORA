-- Post-trip feedback columns for Travel DNA capture
-- Run in Supabase SQL Editor (or via CLI) if itineraries already exists.

ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS post_trip_liked TEXT,
  ADD COLUMN IF NOT EXISTS post_trip_avoid TEXT,
  ADD COLUMN IF NOT EXISTS post_trip_would_return TEXT;

-- Optional constraint (safe to skip if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'itineraries_post_trip_would_return_check'
  ) THEN
    ALTER TABLE itineraries
      ADD CONSTRAINT itineraries_post_trip_would_return_check
      CHECK (
        post_trip_would_return IS NULL
        OR post_trip_would_return IN ('yes', 'no', 'maybe')
      );
  END IF;
END $$;
