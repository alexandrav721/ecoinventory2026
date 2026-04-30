-- Add new product detail fields to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN brand TEXT,
ADD COLUMN color TEXT,
ADD COLUMN dimensions TEXT,
ADD COLUMN size TEXT;

COMMENT ON COLUMN inventory_items.brand IS 'Brand name of the product';
COMMENT ON COLUMN inventory_items.color IS 'Color of the product';
COMMENT ON COLUMN inventory_items.dimensions IS 'Dimensions for furniture items (e.g., 72"W x 36"D x 30"H)';
COMMENT ON COLUMN inventory_items.size IS 'Size for clothing items (e.g., S, M, L, XL)';