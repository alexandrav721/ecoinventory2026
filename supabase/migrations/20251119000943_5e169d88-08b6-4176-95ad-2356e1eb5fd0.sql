-- Add donation and sale tracking fields to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN is_donated BOOLEAN DEFAULT FALSE,
ADD COLUMN is_sold BOOLEAN DEFAULT FALSE,
ADD COLUMN donated_price NUMERIC,
ADD COLUMN sold_price NUMERIC,
ADD COLUMN donated_date DATE,
ADD COLUMN sold_date DATE;

COMMENT ON COLUMN inventory_items.is_donated IS 'Whether the item has been donated';
COMMENT ON COLUMN inventory_items.is_sold IS 'Whether the item has been sold';
COMMENT ON COLUMN inventory_items.donated_price IS 'Value of the item when donated (for tax purposes)';
COMMENT ON COLUMN inventory_items.sold_price IS 'Amount received from selling the item';
COMMENT ON COLUMN inventory_items.donated_date IS 'Date when the item was donated';
COMMENT ON COLUMN inventory_items.sold_date IS 'Date when the item was sold';