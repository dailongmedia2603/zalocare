// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Get threadId from request and validate
    const { threadId } = await req.json()
    if (!threadId) {
      return new Response(JSON.stringify({ error: 'threadId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Create admin client to bypass RLS for server-side logic
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. Fetch user's configurations (API URL, Prompt, Customer ID)
    const [settingsRes, promptRes, customerRes] = await Promise.all([
      supabaseAdmin.from('settings').select('gemini_api_url').eq('user_id', user.id).single(),
      supabaseAdmin.from('prompt_configs').select('prompt_text').eq('user_id', user.id).single(),
      supabaseAdmin.from('customers').select('id').eq('zalo_id', threadId).eq('user_id', user.id).single()
    ]);

    if (settingsRes.error || !settingsRes.data?.gemini_api_url) {
      return new Response(JSON.stringify({ error: 'API Gemini chưa được cấu hình trong Cài đặt.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (promptRes.error || !promptRes.data?.prompt_text) {
      return new Response(JSON.stringify({ error: 'Mẫu prompt chưa được cấu hình.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (customerRes.error || !customerRes.data) {
        return new Response(JSON.stringify({ error: 'Không tìm thấy thông tin khách hàng cho cuộc trò chuyện này.' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    const { gemini_api_url } = settingsRes.data;
    const { prompt_text } = promptRes.data;
    const customerId = customerRes.data.id;

    // 5. Fetch message history
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('zalo_events')
      .select('content, isSelf')
      .eq('threadId', threadId)
      .order('ts', { ascending: true });

    if (messagesError) throw messagesError;

    // 6. Format history and prepare the final prompt
    const formattedHistory = messages
      .map(msg => (msg.isSelf ? `Shop: ${msg.content}` : `Khách: ${msg.content}`))
      .join('\n');
    const finalPrompt = prompt_text.replace('{{MESSAGE_HISTORY}}', formattedHistory);

    // 7. Call Gemini API
    const geminiToken = Deno.env.get('GEMINI_API_TOKEN');
    if (!geminiToken) throw new Error("GEMINI_API_TOKEN is not set in Edge Function secrets.");

    const formData = new FormData();
    formData.append('prompt', finalPrompt);
    formData.append('token', geminiToken);

    const geminiResponse = await fetch(gemini_api_url, {
      method: 'POST',
      body: formData,
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API call failed: ${errorText}`);
    }

    const result = await geminiResponse.json();

    // 8. Validate Gemini response flexibly and create scheduled message
    const messageContent = result.content || result.answer; // Accept 'content' or 'answer'
    const scheduledTime = result.scheduled_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Default to 24 hours later

    if (!messageContent) {
      throw new Error('Invalid response from Gemini API. Expected "content" or "answer".');
    }

    const { error: insertError } = await supabaseAdmin
      .from('scheduled_messages')
      .insert({
        customer_id: customerId,
        thread_id: threadId,
        user_id: user.id,
        content: messageContent,
        scheduled_at: scheduledTime,
        prompt_log: finalPrompt, // Save the prompt log for debugging
      });

    if (insertError) throw insertError;

    // 9. Return success
    return new Response(JSON.stringify({ success: true, message: 'AI has successfully scheduled the message.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-care-message function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});