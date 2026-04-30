-- Add columns to track eliminated/thrown out items
ALTER TABLE public.inventory_items
ADD COLUMN is_eliminated BOOLEAN DEFAULT false,
ADD COLUMN eliminated_date DATE;