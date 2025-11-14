-- 1. Kích hoạt các extension cần thiết
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Xóa job cũ nếu tồn tại để tránh trùng lặp.
-- Sử dụng DO...EXCEPTION để không báo lỗi nếu job chưa tồn tại.
DO $$
BEGIN
  PERFORM cron.unschedule('process-scheduled-messages-job');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Job "process-scheduled-messages-job" does not exist, skipping unschedule.';
END;
$$;

-- 3. Lên lịch cho job mới để chạy mỗi phút
SELECT cron.schedule(
  'process-scheduled-messages-job',
  '* * * * *', -- Chạy mỗi phút
  $$
    SELECT http.request(
      'https://fouehqfnbzeqpbyntziz.supabase.co/functions/v1/process-scheduled-messages',
      'POST',
      ARRAY[
        http.header('Authorization', 'Bearer zalo-care-cron-secret-super-long-and-random-string')
      ],
      'application/json',
      '{}'
    );
  $$
);