-- Account deletion support: associate public share snapshots with a user when known.
-- Run in Supabase SQL Editor.

ALTER TABLE shared_trips
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS shared_trips_user_id_idx
  ON shared_trips (user_id);

-- Users may delete their own share snapshots (account wipe / GDPR)
DROP POLICY IF EXISTS "Users delete own shared trips" ON shared_trips;
CREATE POLICY "Users delete own shared trips"
  ON shared_trips FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
