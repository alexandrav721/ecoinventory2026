-- Drop the policy first
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;

-- Drop and recreate the function
DROP FUNCTION IF EXISTS public.is_conversation_participant(UUID, UUID);

CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_participants
    WHERE conversation_id = conv_id
    AND user_id = user_uuid
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(UUID, UUID) TO anon;

-- Recreate the policy using the function
CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (public.is_conversation_participant(conversation_id, auth.uid()));