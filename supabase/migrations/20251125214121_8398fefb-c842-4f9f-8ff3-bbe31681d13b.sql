-- Create suggestion_feedback table for tracking category suggestion quality
CREATE TABLE public.suggestion_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  suggested_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  actual_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('incorrect', 'helpful', 'no_suggestion')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suggestion_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert own feedback"
  ON public.suggestion_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON public.suggestion_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.suggestion_feedback
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete feedback"
  ON public.suggestion_feedback
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_suggestion_feedback_user ON public.suggestion_feedback(user_id);
CREATE INDEX idx_suggestion_feedback_item_name ON public.suggestion_feedback(item_name);
CREATE INDEX idx_suggestion_feedback_type ON public.suggestion_feedback(feedback_type);
CREATE INDEX idx_suggestion_feedback_created ON public.suggestion_feedback(created_at DESC);