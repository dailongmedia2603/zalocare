-- Tạo một chỉ mục (index) để tăng tốc độ truy vấn tin nhắn trong các cuộc trò chuyện
CREATE INDEX IF NOT EXISTS idx_zalo_events_user_thread_ts ON public.zalo_events (user_id, "threadId", ts DESC);