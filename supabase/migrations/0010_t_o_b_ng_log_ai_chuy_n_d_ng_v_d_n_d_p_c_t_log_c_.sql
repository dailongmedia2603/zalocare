-- Create the new table for AI logs
CREATE TABLE public.ai_prompt_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  prompt_sent TEXT,
  raw_response TEXT,
  status TEXT NOT NULL, -- 'success' or 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.ai_prompt_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user-specific access
CREATE POLICY "Users can manage their own AI logs" ON public.ai_prompt_logs
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Remove the redundant column from scheduled_messages
ALTER TABLE public.scheduled_messages DROP COLUMN IF EXISTS prompt_log;