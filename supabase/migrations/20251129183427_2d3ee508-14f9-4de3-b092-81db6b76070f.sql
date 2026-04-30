-- Create articles table
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  read_time INTEGER DEFAULT 5,
  author_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Anyone can view published articles
CREATE POLICY "Anyone can view published articles"
ON public.articles
FOR SELECT
USING (status = 'published');

-- Admins can view all articles
CREATE POLICY "Admins can view all articles"
ON public.articles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can insert articles
CREATE POLICY "Admins can insert articles"
ON public.articles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update articles
CREATE POLICY "Admins can update articles"
ON public.articles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete articles
CREATE POLICY "Admins can delete articles"
ON public.articles
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on slug for faster lookups
CREATE INDEX idx_articles_slug ON public.articles(slug);

-- Create index on status for filtering
CREATE INDEX idx_articles_status ON public.articles(status);