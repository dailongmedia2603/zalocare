-- Create the table to store user-specific prompt configurations
CREATE TABLE public.prompt_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT prompt_configs_user_id_key UNIQUE (user_id) -- Ensure each user has only one prompt config
);

-- Add comments for clarity
COMMENT ON TABLE public.prompt_configs IS 'Stores user-defined prompts for the AI customer care feature.';
COMMENT ON COLUMN public.prompt_configs.prompt_text IS 'The template prompt text, may contain variables like {{MESSAGE_HISTORY}}.';

-- Enable Row Level Security (RLS) - CRITICAL for security
ALTER TABLE public.prompt_configs ENABLE ROW LEVEL SECURITY;

-- Create policies to ensure users can only access their own data
CREATE POLICY "Users can view their own prompt config"
ON public.prompt_configs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt config"
ON public.prompt_configs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompt config"
ON public.prompt_configs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt config"
ON public.prompt_configs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);