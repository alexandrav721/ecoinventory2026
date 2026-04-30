-- Add sharing_price column to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN sharing_price numeric;

COMMENT ON COLUMN inventory_items.sharing_price IS 'Price for sharing/renting the item. NULL or 0 means free';
