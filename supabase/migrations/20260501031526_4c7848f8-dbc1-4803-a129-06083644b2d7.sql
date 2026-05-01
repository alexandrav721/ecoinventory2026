-- Add explicit borrow/sell toggles to inventory_items
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS is_for_borrow boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_for_sale boolean NOT NULL DEFAULT false;

-- Backfill from existing data:
-- Every shared item is at minimum lendable (matches current behavior).
UPDATE public.inventory_items
SET is_for_borrow = true
WHERE is_available_for_sharing = true;

-- Items with a price > 0 are flagged as for sale too.
UPDATE public.inventory_items
SET is_for_sale = true
WHERE is_available_for_sharing = true
  AND sharing_price IS NOT NULL
  AND sharing_price > 0;

CREATE INDEX IF NOT EXISTS idx_inventory_items_for_borrow
  ON public.inventory_items (is_for_borrow)
  WHERE is_available_for_sharing = true;

CREATE INDEX IF NOT EXISTS idx_inventory_items_for_sale
  ON public.inventory_items (is_for_sale)
  WHERE is_available_for_sharing = true;