-- Add public and friends display settings to profiles
ALTER TABLE public.profiles
ADD COLUMN public_display_name TEXT,
ADD COLUMN friends_display_name TEXT,
ADD COLUMN public_avatar_url TEXT,
ADD COLUMN friends_avatar_url TEXT;

-- Create function to get display info based on friendship
CREATE OR REPLACE FUNCTION public.get_user_display_info(
  profile_user_id UUID,
  viewer_id UUID
)
RETURNS TABLE (
  display_name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_friend BOOLEAN;
  profile_record RECORD;
BEGIN
  -- Check if viewer is friends with the profile user
  is_friend := public.are_friends(viewer_id, profile_user_id);
  
  -- Get profile data
  SELECT 
    p.full_name,
    p.public_display_name,
    p.friends_display_name,
    p.avatar_url,
    p.public_avatar_url,
    p.friends_avatar_url
  INTO profile_record
  FROM public.profiles p
  WHERE p.id = profile_user_id;
  
  -- Return appropriate display info
  IF is_friend THEN
    RETURN QUERY SELECT 
      COALESCE(profile_record.friends_display_name, profile_record.full_name),
      COALESCE(profile_record.friends_avatar_url, profile_record.avatar_url);
  ELSE
    RETURN QUERY SELECT 
      COALESCE(profile_record.public_display_name, profile_record.full_name),
      COALESCE(profile_record.public_avatar_url, profile_record.avatar_url);
  END IF;
END;
$$;