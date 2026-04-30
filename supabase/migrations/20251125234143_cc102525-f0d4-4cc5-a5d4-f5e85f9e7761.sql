-- Remove brand column from product_catalog table
ALTER TABLE public.product_catalog DROP COLUMN IF EXISTS brand;

COMMENT ON TABLE public.product_catalog IS 'Product catalog without brands - users input their own brands when adding items';