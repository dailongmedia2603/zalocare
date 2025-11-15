// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let customerId;
  let threadId;
  let userId;
  let prompt_text;
  let responseText; // To store raw response for logging

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // 1. Authenticate the user correctly
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error in generate-care-message:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    userId = user.id;

    // 2. Get threadId from request and validate
    const body = await req.json();
    threadId = body.threadId;
    if (!threadId) {
      throw new Error('threadId is required');
    }

    // 4. Fetch user's configurations
    const [settingsRes, promptRes, customerRes] = await Promise.all([
      supabaseAdmin.from('settings').select('gemini_api_url').eq('user_id', user.id).single(),
      supabaseAdmin.from('prompt_configs').select('prompt_text').eq('user_id', user.id).single(),
      supabaseAdmin.from('customers').select('id, display_name').eq('zalo_id', threadId).eq('user_id', user.id).single()
    ]);

    if (settingsRes.error || !settingsRes.data?.gemini_api_url) throw new Error('API Gemini chưa được cấu hình trong Cài đặt.');
    if (promptRes.error || !promptRes.data?.prompt_text) throw new Error('Mẫu prompt chưa được cấu hình.');
    if (customerRes.error || !customerRes.data) throw new Error('Không tìm thấy thông tin khách hàng cho cuộc trò chuyện này.');
    
    const { gemini_api_url } = settingsRes.data;
    prompt_text = promptRes.data.prompt_text;
    customerId = customerRes.data.id;
    const customerName = customerRes.data.display_name || 'khách';

    // 5. Fetch message history
    const { data: messages, error: messagesError } = await supabaseAdmin.from('zalo_events').select('content, isSelf').eq('threadId', threadId).order('ts', { ascending: true });
    if (messagesError) throw messagesError;

    // 6. Prepare the final prompt
    const formattedHistory = messages.map(msg => (msg.isSelf ? `Shop: ${msg.content}` : `Khách: ${msg.content}`)).join('\n');
    prompt_text = prompt_text.replace('{{MESSAGE_HISTORY}}', formattedHistory);
    prompt_text = prompt_text.replace('{{CUSTOMER_NAME}}', customerName);
    prompt_text = prompt_text.replace('{{CURRENT_DATETIME}}', new Date().toISOString());

    // 7. Call Gemini API
    const geminiToken = Deno.env.get('GEMINI_API_TOKEN');
    if (!geminiToken) throw new Error("GEMINI_API_TOKEN is not set.");

    const formData = new FormData();
    formData.append('prompt', prompt_text);
    formData.append('token', geminiToken);

    const geminiResponse = await fetch(gemini_api_url, { method: 'POST', body: formData });
    responseText = await geminiResponse.text();

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API call failed with status ${geminiResponse.status}`);
    }

    // 8. Robustly parse the Gemini response
    let result;
    try {
      const initialResponse = JSON.parse(responseText);
      // Prioritize the 'answer' field if it exists, otherwise use the whole response
      const answerString = initialResponse.answer || responseText;
      // Find JSON within markdown block first
      const jsonMatch = answerString.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        // If no markdown, try to parse the string directly (it might be a stringified JSON)
        result = JSON.parse(answerString);
      }
    } catch (e) {
      throw new Error(`Could not parse JSON from Gemini response.`);
    }

    // 9. STRICTLY validate the parsed JSON
    const { content, scheduled_at } = result;
    if (!content || !scheduled_at) {
      throw new Error('Invalid response from Gemini API. Expected a JSON object with "content" and "scheduled_at" keys.');
    }

    // 10. Create scheduled message on success
    const { error: insertError } = await supabaseAdmin.from('scheduled_messages').insert({
      customer_id: customerId, thread_id: threadId, user_id: userId,
      content: content, scheduled_at: scheduled_at, status: 'pending',
    });
    if (insertError) throw insertError;

    // 11. Log success
    await supabaseAdmin.from('ai_prompt_logs').insert({
      user_id: userId, customer_id: customerId, prompt_sent: prompt_text,
      raw_response: responseText, status: 'success',
    });

    // 12. Return success
    return new Response(JSON.stringify({ success: true, message: 'AI has successfully scheduled the message.' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-care-message function:', error);
    
    // Always attempt to log the failure
    if (userId && customerId) {
      await supabaseAdmin.from('ai_prompt_logs').insert({
        user_id: userId, customer_id: customerId,
        prompt_sent: prompt_text || 'Prompt could not be captured before the error.',
        raw_response: responseText || 'AI response could not be captured.',
        status: 'failed',
        error_message: error.message,
      });
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});