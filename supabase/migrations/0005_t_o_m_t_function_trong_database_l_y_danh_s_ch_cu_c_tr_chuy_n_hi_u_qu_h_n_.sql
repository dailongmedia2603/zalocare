-- Xóa function cũ nếu tồn tại để đảm bảo chúng ta đang tạo phiên bản mới nhất
DROP FUNCTION IF EXISTS public.get_user_conversations_inbox(p_user_id uuid);

-- Tạo function mới
CREATE OR REPLACE FUNCTION public.get_user_conversations_inbox(p_user_id uuid)
RETURNS TABLE (
    id text,
    last_message_preview text,
    last_message_at timestamptz,
    unread_count int,
    customer jsonb,
    tags jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH latest_events AS (
        -- Lấy ra sự kiện (tin nhắn) mới nhất cho mỗi cuộc trò chuyện
        SELECT DISTINCT ON (ze."threadId")
            ze."threadId",
            ze.content,
            ze.ts,
            ze."dName" -- Lấy cả dName để dùng làm tên dự phòng
        FROM public.zalo_events AS ze
        WHERE ze.user_id = p_user_id
        ORDER BY ze."threadId", ze.ts DESC
    )
    SELECT
        le."threadId" AS id,
        le.content AS last_message_preview,
        le.ts AS last_message_at,
        0 AS unread_count, -- Logic đếm tin chưa đọc sẽ được thêm sau
        -- Tạo đối tượng JSON cho khách hàng, xử lý cả trường hợp khách hàng chưa có trong bảng customers
        CASE
            WHEN c.id IS NOT NULL THEN
                jsonb_build_object(
                    'id', c.id,
                    'zalo_id', c.zalo_id,
                    'display_name', COALESCE(c.display_name, le."dName", 'Khách hàng mới'),
                    'avatar_url', c.avatar_url
                )
            ELSE
                -- Nếu chưa có thông tin khách hàng, tạo một đối tượng tạm từ dữ liệu tin nhắn
                jsonb_build_object(
                    'id', NULL,
                    'zalo_id', le."threadId",
                    'display_name', COALESCE(le."dName", 'Khách hàng mới'),
                    'avatar_url', NULL
                )
        END AS customer,
        -- Lấy danh sách tag nếu khách hàng tồn tại
        COALESCE(
            (
                SELECT jsonb_agg(t.*)
                FROM public.customer_tags ct
                JOIN public.tags t ON ct.tag_id = t.id
                WHERE ct.customer_id = c.id
            ),
            '[]'::jsonb
        ) AS tags
    FROM latest_events AS le
    LEFT JOIN public.customers AS c ON le."threadId" = c.zalo_id AND c.user_id = p_user_id
    ORDER BY le.ts DESC;
END;
$$;