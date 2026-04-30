-- Change image_url to image_urls array to support multiple images
ALTER TABLE inventory_items 
RENAME COLUMN image_url TO image_urls;

ALTER TABLE inventory_items 
ALTER COLUMN image_urls TYPE text[] USING ARRAY[image_urls]::text[];

-- Also update product_catalog to support multiple images
ALTER TABLE product_catalog 
RENAME COLUMN image_url TO image_urls;

ALTER TABLE product_catalog 
ALTER COLUMN image_urls TYPE text[] USING ARRAY[image_urls]::text[];