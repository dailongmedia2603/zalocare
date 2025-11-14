-- Bật REPLICA IDENTITY cho bảng zalo_events để Supabase có thể theo dõi các thay đổi.
ALTER TABLE public.zalo_events REPLICA IDENTITY FULL;