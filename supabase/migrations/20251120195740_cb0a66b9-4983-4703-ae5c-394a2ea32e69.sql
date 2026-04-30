-- Fix categories table RLS policies
-- Drop overly permissive policies that allow any user to modify categories
DROP POLICY IF EXISTS "Users can create categories" ON categories;
DROP POLICY IF EXISTS "Users can update categories" ON categories;
DROP POLICY IF EXISTS "Users can delete categories" ON categories;

-- Add admin-only policies for category management
CREATE POLICY "Admins can manage categories"
ON categories FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Keep the existing read policy for all users
-- Policy "Anyone can view categories" already exists and is correct