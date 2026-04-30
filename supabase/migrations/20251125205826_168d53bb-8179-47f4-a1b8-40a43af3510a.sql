-- Create table to store inventory benchmarks
CREATE TABLE public.inventory_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  typical_quantity INTEGER NOT NULL CHECK (typical_quantity > 0),
  max_quantity INTEGER NOT NULL CHECK (max_quantity >= typical_quantity),
  reasoning TEXT NOT NULL,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.inventory_benchmarks ENABLE ROW LEVEL SECURITY;

-- Anyone can view benchmarks
CREATE POLICY "Anyone can view benchmarks"
ON public.inventory_benchmarks
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert benchmarks
CREATE POLICY "Admins can insert benchmarks"
ON public.inventory_benchmarks
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can update benchmarks
CREATE POLICY "Admins can update benchmarks"
ON public.inventory_benchmarks
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete benchmarks
CREATE POLICY "Admins can delete benchmarks"
ON public.inventory_benchmarks
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_inventory_benchmarks_updated_at
BEFORE UPDATE ON public.inventory_benchmarks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default benchmarks from the hardcoded list
INSERT INTO public.inventory_benchmarks (category_key, display_name, typical_quantity, max_quantity, reasoning, keywords) VALUES
('pajamas', 'Pajamas', 3, 5, 'Most people need 2-3 pairs for weekly laundry cycles', ARRAY['pajama', 'pj', 'sleepwear', 'nightgown']),
('jeans', 'Jeans', 5, 8, 'A capsule wardrobe typically includes 4-6 pairs', ARRAY['jean', 'denim']),
('pants', 'Pants', 5, 8, 'A capsule wardrobe typically includes 4-6 pairs', ARRAY['pant', 'trouser', 'slack']),
('tshirt', 'T-Shirts', 8, 12, 'A versatile wardrobe includes 6-10 basic tees', ARRAY['t-shirt', 'tshirt', 'tee']),
('shoes', 'Shoes', 8, 12, 'Minimalist wardrobe includes 6-10 pairs (casual, formal, athletic, seasonal)', ARRAY['shoe']),
('coffee_maker', 'Coffee Maker', 1, 2, 'One machine is sufficient for most households', ARRAY['coffee maker', 'espresso', 'french press', 'coffee machine']),
('towel', 'Bath Towels', 6, 10, 'Two per person plus guest towels', ARRAY['bath towel', 'towel']),
('pillow', 'Pillows', 4, 6, 'Two per person plus decorative pillows', ARRAY['pillow']),
('mug', 'Mugs', 6, 10, 'One per person plus favorites and guests', ARRAY['mug', 'coffee cup']),
('plate', 'Plates', 8, 12, 'Service for 4-6 people plus extras', ARRAY['plate', 'dish']);