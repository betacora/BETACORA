-- BeTacora: one-time traveler profile columns on profiles
-- Run in Supabase SQL Editor (safe if columns already exist)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_essence TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS traveler_answers JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMPTZ;
