-- 1. Kích hoạt các extension cần thiết
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Xóa job cũ nếu tồn tại để tránh trùng lặp.
DO $$
BEGIN
  PERFORM cron.unschedule('process-scheduled-messages-job');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Job "process-scheduled-messages-job" does not exist, skipping unschedule.';
END;
$$;

-- 3. Lên lịch cho job mới để chạy mỗi phút (đã sửa cú pháp)
SELECT cron.schedule(
  'process-scheduled-messages-job',
  '* * * * *', -- Chạy mỗi phút
  $$
    SELECT public.http(
      (
        'POST',
        'https://fouehqfnbzeqpbyntziz.supabase.co/functions/v1/process-scheduled-messages',
        ARRAY[
          public.http_header('Authorization', 'Bearer zalo-care-cron-secret-super-long-and-random-string')
        ],
        'application/json',
        '{}'
      )::public.http_request
    );
  $$
);