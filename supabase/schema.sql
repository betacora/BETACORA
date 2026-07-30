-- BeTacora — run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  nationality TEXT,
  language TEXT DEFAULT 'es',
  terms_accepted_at TIMESTAMPTZ,
  privacy_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  generations_count INTEGER DEFAULT 0,
  last_generation_at TIMESTAMPTZ,
  -- One-time traveler DNA (personality answers + archetype); trip answers live on itineraries
  profile_type TEXT,
  profile_essence TEXT,
  traveler_answers JSONB,
  profile_updated_at TIMESTAMPTZ
);

-- If profiles already exists without traveler DNA columns, run:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_type TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_essence TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS traveler_answers JSONB;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  destination TEXT,
  profile_type TEXT,
  profile_essence TEXT,
  questionnaire_answers JSONB,
  itinerary_html TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  -- Post-trip Travel DNA (captured after the trip; unused for personalization yet)
  post_trip_liked TEXT,
  post_trip_avoid TEXT,
  post_trip_would_return TEXT CHECK (
    post_trip_would_return IS NULL
    OR post_trip_would_return IN ('yes', 'no', 'maybe')
  )
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users read own itineraries"
  ON itineraries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own itineraries"
  ON itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own itineraries"
  ON itineraries FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own itineraries" ON itineraries;
CREATE POLICY "Users delete own itineraries"
  ON itineraries FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own profile" ON profiles;
CREATE POLICY "Users delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Public share snapshots for "Compartir viaje" links (read-only views)
CREATE TABLE IF NOT EXISTS shared_trips (
  slug TEXT PRIMARY KEY,
  destination TEXT,
  duration_label TEXT,
  profile_type TEXT,
  highlights JSONB DEFAULT '[]'::jsonb,
  places JSONB DEFAULT '[]'::jsonb,
  itinerary_html TEXT,
  lang TEXT DEFAULT 'es',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Optional owner for account deletion / GDPR (nullable for legacy guest shares)
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  -- Explicit opt-in for Descubre public feed (NOT implied by creating a share link)
  show_in_feed BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS shared_trips_user_id_idx
  ON shared_trips (user_id);

CREATE INDEX IF NOT EXISTS shared_trips_show_in_feed_created_at_idx
  ON shared_trips (created_at DESC)
  WHERE show_in_feed = true;

ALTER TABLE shared_trips ENABLE ROW LEVEL SECURITY;

-- Anyone can create a share snapshot (slug is unguessable)
DROP POLICY IF EXISTS "Anyone can insert shared trips" ON shared_trips;
CREATE POLICY "Anyone can insert shared trips"
  ON shared_trips FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read shared trips" ON shared_trips;
CREATE POLICY "Anyone can read shared trips"
  ON shared_trips FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users delete own shared trips" ON shared_trips;
CREATE POLICY "Users delete own shared trips"
  ON shared_trips FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Duffel flight offer selections (intent only — no payment / no Duffel order yet)
CREATE TABLE IF NOT EXISTS flight_selections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  duffel_offer_id TEXT NOT NULL,
  airline TEXT,
  price TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS flight_selections_user_id_idx
  ON flight_selections (user_id);

CREATE INDEX IF NOT EXISTS flight_selections_itinerary_id_idx
  ON flight_selections (itinerary_id);

CREATE INDEX IF NOT EXISTS flight_selections_duffel_offer_id_idx
  ON flight_selections (duffel_offer_id);

ALTER TABLE flight_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own flight selections" ON flight_selections;
CREATE POLICY "Users read own flight selections"
  ON flight_selections FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own flight selections" ON flight_selections;
CREATE POLICY "Users insert own flight selections"
  ON flight_selections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own flight selections" ON flight_selections;
CREATE POLICY "Users delete own flight selections"
  ON flight_selections FOR DELETE
  USING (auth.uid() = user_id);
