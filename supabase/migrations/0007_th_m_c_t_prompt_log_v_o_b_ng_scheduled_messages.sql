-- Add a new column to store the prompt sent to the AI
ALTER TABLE public.scheduled_messages
ADD COLUMN prompt_log TEXT;

-- Add a comment for clarity
COMMENT ON COLUMN public.scheduled_messages.prompt_log IS 'Stores the exact prompt sent to the AI to generate this message.';