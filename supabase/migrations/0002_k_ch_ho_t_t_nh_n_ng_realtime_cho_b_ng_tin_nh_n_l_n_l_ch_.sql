-- Bật REPLICA IDENTITY cho bảng scheduled_messages để Supabase có thể theo dõi các thay đổi.
ALTER TABLE public.scheduled_messages REPLICA IDENTITY FULL;