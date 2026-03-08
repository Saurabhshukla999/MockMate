-- Add experience_level, availability_slots, city, country to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS availability_slots JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT;
