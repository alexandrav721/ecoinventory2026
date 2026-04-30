-- Add personalization fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS interests TEXT[];

-- Add check constraint for age
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_age_check 
CHECK (age IS NULL OR (age >= 0 AND age <= 120));

COMMENT ON COLUMN public.profiles.gender IS 'User gender for personalized recommendations';
COMMENT ON COLUMN public.profiles.age IS 'User age for personalized recommendations';
COMMENT ON COLUMN public.profiles.interests IS 'User interests for personalized catalog recommendations';