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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
