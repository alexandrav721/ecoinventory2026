-- Create friendships table
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friendships
CREATE POLICY "Users can view their own friendships"
  ON public.friendships
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
  ON public.friendships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of"
  ON public.friendships
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friend requests"
  ON public.friendships
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to check if users are friends
CREATE OR REPLACE FUNCTION public.are_friends(user_a UUID, user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friendships
    WHERE status = 'accepted'
      AND ((user_id = user_a AND friend_id = user_b)
        OR (user_id = user_b AND friend_id = user_a))
  )
$$;

-- Add RLS policy to allow friends to view shared items
CREATE POLICY "Friends can view shared items"
  ON public.inventory_items
  FOR SELECT
  USING (
    is_available_for_sharing = true 
    AND public.are_friends(auth.uid(), user_id)
  );

-- Create trigger for updated_at
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);