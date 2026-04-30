-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;

-- Create a helper function to check if a user is a conversation participant
-- This function uses SECURITY DEFINER to bypass RLS and prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id
    AND user_id = user_uuid
  );
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    public.is_conversation_participant(conversation_id, auth.uid())
  );