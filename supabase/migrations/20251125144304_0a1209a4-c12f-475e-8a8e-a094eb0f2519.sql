-- Drop and recreate the insert policy with explicit true check
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- Allow any authenticated user to create a conversation
-- The security is enforced by conversation_participants RLS policies
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);