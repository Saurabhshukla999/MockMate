-- MockMate: user_profiles schema (profiles table with full spec)
-- Adds latitude, longitude, full_name; tightens RLS to own profile only

-- Add missing columns to profiles (acts as user_profiles)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Backfill full_name from display_name for existing rows
UPDATE public.profiles SET full_name = COALESCE(display_name, '') WHERE full_name IS NULL;

-- Drop existing permissive SELECT policy (users could view all profiles)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- RLS: Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- UPDATE and INSERT already restricted to own profile; keep them
-- (Existing: "Users can update own profile", "Users can insert own profile")
