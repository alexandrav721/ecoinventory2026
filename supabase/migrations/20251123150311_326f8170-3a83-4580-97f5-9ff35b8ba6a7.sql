-- Add sharing_level column to inventory_items
ALTER TABLE public.inventory_items 
ADD COLUMN sharing_level text DEFAULT 'private' CHECK (sharing_level IN ('private', 'friends', 'public'));

-- Update existing items: if is_available_for_sharing is true, set to 'public', otherwise 'private'
UPDATE public.inventory_items
SET sharing_level = CASE 
  WHEN is_available_for_sharing = true THEN 'public'
  ELSE 'private'
END;

-- Add comment for documentation
COMMENT ON COLUMN public.inventory_items.sharing_level IS 'Sharing level: private (not shared), friends (friends only), public (everyone)';
