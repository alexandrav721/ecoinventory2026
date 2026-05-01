CREATE TABLE public.ai_chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_chat_history_user_created
  ON public.ai_chat_history (user_id, created_at);

ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ai chat history"
ON public.ai_chat_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai chat history"
ON public.ai_chat_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai chat history"
ON public.ai_chat_history
FOR DELETE
USING (auth.uid() = user_id);