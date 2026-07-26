-- Own-row DELETE policies + note on shared_trips insert surface
-- Run in Supabase SQL Editor after reviewing.

-- Profiles: user may delete their own profile row (account wipe helper)
DROP POLICY IF EXISTS "Users delete own profile" ON profiles;
CREATE POLICY "Users delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Itineraries: user may delete only their own trips
DROP POLICY IF EXISTS "Users delete own itineraries" ON itineraries;
CREATE POLICY "Users delete own itineraries"
  ON itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- shared_trips stays publicly insertable (guest share links), but inserts are
-- rate-limited + sanitized in /api/share-trip. Optional harden later:
-- require auth.uid() IS NOT NULL once share always sends a session.

-- Confirm RLS is ON (idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_selections ENABLE ROW LEVEL SECURITY;
