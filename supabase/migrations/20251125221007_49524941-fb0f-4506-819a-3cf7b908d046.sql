-- Create a table for admin-managed product category mappings
CREATE TABLE IF NOT EXISTS public.product_category_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[], -- Additional keywords for matching
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_name, category_id)
);

-- Enable RLS
ALTER TABLE public.product_category_mappings ENABLE ROW LEVEL SECURITY;

-- Anyone can view mappings (for autocomplete suggestions)
CREATE POLICY "Anyone can view product mappings"
  ON public.product_category_mappings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert mappings
CREATE POLICY "Admins can insert product mappings"
  ON public.product_category_mappings
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can update mappings
CREATE POLICY "Admins can update product mappings"
  ON public.product_category_mappings
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete mappings
CREATE POLICY "Admins can delete product mappings"
  ON public.product_category_mappings
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_product_category_mappings_product_name 
  ON public.product_category_mappings(LOWER(product_name));

-- Add trigger for updated_at
CREATE TRIGGER update_product_category_mappings_updated_at
  BEFORE UPDATE ON public.product_category_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();