-- Let's grant explicit permissions and ensure the policy works
GRANT INSERT ON public.conversations TO authenticated;
GRANT SELECT ON public.conversations TO authenticated;

-- Recreate the policy one more time to ensure it's correct
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations"
  ON public.conversations 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);