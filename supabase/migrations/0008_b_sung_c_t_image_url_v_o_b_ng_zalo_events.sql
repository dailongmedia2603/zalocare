-- Add the new column to store image URLs from Zalo
ALTER TABLE public.zalo_events
ADD COLUMN image_url TEXT NULL;

-- Add a comment for clarity
COMMENT ON COLUMN public.zalo_events.image_url IS 'URL of the image attachment, if the message is an image.';