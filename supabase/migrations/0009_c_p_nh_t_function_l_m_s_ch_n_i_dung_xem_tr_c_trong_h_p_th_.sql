CREATE OR REPLACE FUNCTION public.get_user_conversations_inbox(p_user_id uuid)
 RETURNS TABLE(id text, last_message_preview text, last_message_at timestamp with time zone, unread_count integer, customer jsonb, tags jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH latest_events AS (
        -- Get the latest event (message) for each conversation
        SELECT DISTINCT ON (ze."threadId")
            ze."threadId",
            ze.content,
            ze.image_url, -- Also select the image_url
            ze.ts,
            ze."dName"
        FROM public.zalo_events AS ze
        WHERE ze.user_id = p_user_id
        ORDER BY ze."threadId", ze.ts DESC
    )
    SELECT
        le."threadId" AS id,
        -- New logic for last_message_preview
        CASE
            -- If there's an image, the preview is always 'Hình ảnh'.
            WHEN le.image_url IS NOT NULL THEN 'Hình ảnh'
            -- If content looks like JSON (and there's no image), show a generic placeholder.
            WHEN le.content LIKE '{%}' AND le.content LIKE '%:%' THEN '[Tin nhắn tương tác]'
            -- Otherwise, show the text content.
            ELSE le.content
        END AS last_message_preview,
        le.ts AS last_message_at,
        0 AS unread_count, -- Unread count logic to be added later
        -- Create JSON object for the customer
        CASE
            WHEN c.id IS NOT NULL THEN
                jsonb_build_object(
                    'id', c.id,
                    'zalo_id', c.zalo_id,
                    'display_name', COALESCE(c.display_name, le."dName", 'Khách hàng mới'),
                    'avatar_url', c.avatar_url
                )
            ELSE
                -- If customer info doesn't exist, create a temporary object from message data
                jsonb_build_object(
                    'id', NULL,
                    'zalo_id', le."threadId",
                    'display_name', COALESCE(le."dName", 'Khách hàng mới'),
                    'avatar_url', NULL
                )
        END AS customer,
        -- Get tags if the customer exists
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
$function$