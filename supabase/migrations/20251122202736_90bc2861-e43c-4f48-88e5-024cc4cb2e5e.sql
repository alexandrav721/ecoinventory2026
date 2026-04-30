-- Drop existing foreign keys to auth.users
ALTER TABLE public.friendships 
DROP CONSTRAINT IF EXISTS friendships_user_id_fkey,
DROP CONSTRAINT IF EXISTS friendships_friend_id_fkey;

-- Add foreign keys to profiles table instead
ALTER TABLE public.friendships
ADD CONSTRAINT friendships_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT friendships_friend_id_fkey 
  FOREIGN KEY (friend_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update profiles RLS to allow users to search for other users
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (true);