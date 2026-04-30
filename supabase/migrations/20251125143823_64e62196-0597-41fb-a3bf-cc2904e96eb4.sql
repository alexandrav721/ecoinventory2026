-- Fix the conversations RLS policy to properly allow inserts
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    -- Allow if the user is going to be added as a participant
    -- Since we can't check participants that don't exist yet, we allow all authenticated users
    auth.uid() IS NOT NULL
  );