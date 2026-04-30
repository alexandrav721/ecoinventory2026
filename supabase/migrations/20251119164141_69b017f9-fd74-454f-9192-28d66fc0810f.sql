-- Add usage_frequency column to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN usage_frequency text;

-- Add a check constraint to ensure valid values
ALTER TABLE public.inventory_items
ADD CONSTRAINT usage_frequency_check 
CHECK (usage_frequency IS NULL OR usage_frequency IN (
  'never',
  'daily', 
  'frequent',
  'occasional',
  'rare',
  'seasonal'
));

-- Add comment to explain the column
COMMENT ON COLUMN public.inventory_items.usage_frequency IS 'Tracks how frequently the item is used: never, daily, frequent (weekly), occasional (monthly), rare (less than monthly), seasonal';