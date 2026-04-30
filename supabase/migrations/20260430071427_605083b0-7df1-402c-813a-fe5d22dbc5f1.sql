CREATE TABLE IF NOT EXISTS public.assistant_user_prefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

ALTER TABLE public.assistant_user_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assistant prefs"
ON public.assistant_user_prefs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assistant prefs"
ON public.assistant_user_prefs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assistant prefs"
ON public.assistant_user_prefs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assistant prefs"
ON public.assistant_user_prefs FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_assistant_user_prefs_updated_at
BEFORE UPDATE ON public.assistant_user_prefs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();