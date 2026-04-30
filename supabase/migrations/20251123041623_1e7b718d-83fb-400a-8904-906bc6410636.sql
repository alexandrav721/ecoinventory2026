-- Add location visibility settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location_visible_to_friends boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS location_visible_to_public boolean DEFAULT false;

-- Add helpful comment
COMMENT ON COLUMN public.profiles.location_visible_to_friends IS 'Controls whether friends can see user location';
COMMENT ON COLUMN public.profiles.location_visible_to_public IS 'Controls whether public/community can see user location';