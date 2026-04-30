-- Add user_id column to categories table to track ownership
ALTER TABLE public.categories 
ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX idx_categories_user_id ON public.categories(user_id);

-- Update RLS policies for categories

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

-- New policy: Users can view default categories (no user_id) and their own categories
CREATE POLICY "Users can view default and own categories"
ON public.categories
FOR SELECT
USING (user_id IS NULL OR user_id = auth.uid());

-- New policy: Users can insert their own categories
CREATE POLICY "Users can insert own categories"
ON public.categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- New policy: Users can update their own categories
CREATE POLICY "Users can update own categories"
ON public.categories
FOR UPDATE
USING (auth.uid() = user_id);

-- New policy: Users can delete their own categories
CREATE POLICY "Users can delete own categories"
ON public.categories
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can still manage all categories
CREATE POLICY "Admins can manage all categories"
ON public.categories
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));