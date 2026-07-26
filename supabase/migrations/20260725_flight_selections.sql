-- Flight offer selections (Duffel sandbox) — store intent only.
-- No payment, no Duffel order creation yet.
-- Run in Supabase SQL Editor (or via CLI) if the table does not exist.

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
