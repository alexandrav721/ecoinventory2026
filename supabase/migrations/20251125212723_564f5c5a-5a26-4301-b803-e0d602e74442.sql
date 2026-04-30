-- Create table to track user's category learning patterns
CREATE TABLE public.category_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_category_learning_user_name ON public.category_learning(user_id, item_name);
CREATE INDEX idx_category_learning_category ON public.category_learning(category_id);

-- Enable RLS
ALTER TABLE public.category_learning ENABLE ROW LEVEL SECURITY;

-- Users can view their own learning data
CREATE POLICY "Users can view own category learning"
  ON public.category_learning
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own learning data
CREATE POLICY "Users can insert own category learning"
  ON public.category_learning
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get learned category suggestions based on similar item names
CREATE OR REPLACE FUNCTION public.get_learned_category(
  p_user_id UUID,
  p_item_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id UUID;
BEGIN
  -- Find the most frequently used category for similar item names
  -- Use trigram similarity for fuzzy matching
  SELECT category_id INTO v_category_id
  FROM (
    SELECT 
      category_id,
      COUNT(*) as usage_count,
      MAX(created_at) as last_used
    FROM public.category_learning
    WHERE user_id = p_user_id
      AND (
        LOWER(item_name) LIKE '%' || LOWER(p_item_name) || '%'
        OR LOWER(p_item_name) LIKE '%' || LOWER(item_name) || '%'
        OR similarity(LOWER(item_name), LOWER(p_item_name)) > 0.3
      )
    GROUP BY category_id
    ORDER BY usage_count DESC, last_used DESC
    LIMIT 1
  ) sq;
  
  RETURN v_category_id;
END;
$$;