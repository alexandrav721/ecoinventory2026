-- Create suggested_locations table for admin-managed location suggestions
CREATE TABLE public.suggested_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create suggested_brands table for admin-managed brand suggestions
CREATE TABLE public.suggested_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(brand_name, category_id)
);

-- Enable RLS
ALTER TABLE public.suggested_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggested_brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suggested_locations
CREATE POLICY "Anyone can view suggested locations"
  ON public.suggested_locations
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert suggested locations"
  ON public.suggested_locations
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update suggested locations"
  ON public.suggested_locations
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete suggested locations"
  ON public.suggested_locations
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for suggested_brands
CREATE POLICY "Anyone can view suggested brands"
  ON public.suggested_brands
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert suggested brands"
  ON public.suggested_brands
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update suggested brands"
  ON public.suggested_brands
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete suggested brands"
  ON public.suggested_brands
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_suggested_locations_usage ON public.suggested_locations(usage_count DESC);
CREATE INDEX idx_suggested_brands_usage ON public.suggested_brands(usage_count DESC);
CREATE INDEX idx_suggested_brands_category ON public.suggested_brands(category_id);