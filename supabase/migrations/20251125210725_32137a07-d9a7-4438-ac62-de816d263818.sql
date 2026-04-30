-- Add tags support to inventory_items
ALTER TABLE public.inventory_items
ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index for tag searches
CREATE INDEX idx_inventory_items_tags ON public.inventory_items USING GIN(tags);

-- Make category_id optional (backwards compatibility)
-- It's already nullable, so just add a comment
COMMENT ON COLUMN public.inventory_items.category_id IS 'Legacy field - tags are now preferred for flexible categorization';

-- Create a table to track common tags for autocomplete
CREATE TABLE public.common_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_text TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on common_tags
ALTER TABLE public.common_tags ENABLE ROW LEVEL SECURITY;

-- Anyone can view common tags
CREATE POLICY "Anyone can view common tags"
ON public.common_tags
FOR SELECT
TO authenticated
USING (true);

-- Create index for tag text searches
CREATE INDEX idx_common_tags_text ON public.common_tags(tag_text);

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION public.update_tag_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update tag usage
  INSERT INTO public.common_tags (tag_text, usage_count, last_used)
  SELECT unnest(NEW.tags), 1, now()
  ON CONFLICT (tag_text) 
  DO UPDATE SET 
    usage_count = common_tags.usage_count + 1,
    last_used = now();
  
  RETURN NEW;
END;
$$;

-- Trigger to track tag usage when items are added/updated
CREATE TRIGGER track_tag_usage
AFTER INSERT OR UPDATE OF tags ON public.inventory_items
FOR EACH ROW
WHEN (NEW.tags IS NOT NULL AND array_length(NEW.tags, 1) > 0)
EXECUTE FUNCTION public.update_tag_usage();