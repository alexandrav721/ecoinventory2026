-- Create search_logs table for anonymous search tracking
CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_term TEXT NOT NULL,
  search_category TEXT,
  search_type TEXT NOT NULL, -- 'item', 'category', 'brand', etc.
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient querying of popular searches
CREATE INDEX IF NOT EXISTS idx_search_logs_term ON public.search_logs(search_term);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON public.search_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_category ON public.search_logs(search_category);

-- Create insights table to cache AI-generated insights
CREATE TABLE IF NOT EXISTS public.inventory_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'duplicate', 'similar', 'search_demand', 'optimization'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  related_item_ids UUID[] DEFAULT ARRAY[]::UUID[],
  action_recommended TEXT,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on search_logs (public read for analytics)
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view search logs"
  ON public.search_logs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert search logs"
  ON public.search_logs FOR INSERT
  WITH CHECK (true);

-- Enable RLS on inventory_insights
ALTER TABLE public.inventory_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
  ON public.inventory_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON public.inventory_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON public.inventory_insights FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update insights timestamp
CREATE OR REPLACE FUNCTION update_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_insights_updated_at
  BEFORE UPDATE ON public.inventory_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_insights_updated_at();