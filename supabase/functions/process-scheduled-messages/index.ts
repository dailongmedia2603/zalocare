// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const CRON_SECRET = Deno.env.get('CRON_SECRET') || "zalo-care-cron-secret-super-long-and-random-string";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Security check: Ensure the request is from our trusted cron job
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // 1. Atomically fetch and "lock" due messages by updating their status to 'processing'.
    // This prevents other concurrent function invocations from picking up the same messages.
    const { data: messages, error: fetchError } = await supabaseAdmin
      .from('scheduled_messages')
      .update({ status: 'processing' })
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .select(); // .select() after .update() acts like RETURNING *, making the operation atomic.

    if (fetchError) {
      console.error('Error fetching and locking scheduled messages:', fetchError);
      throw fetchError;
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ message: 'No messages to send.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Group messages by user_id to fetch settings efficiently
    const messagesByUser = messages.reduce((acc, msg) => {
      if (!acc[msg.user_id]) {
        acc[msg.user_id] = [];
      }
      acc[msg.user_id].push(msg);
      return acc;
    }, {});

    const userIds = Object.keys(messagesByUser);

    // Fetch settings for all relevant users
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('settings')
      .select('user_id, n8n_webhook_url')
      .in('user_id', userIds);

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
      throw settingsError;
    }

    const settingsMap = new Map(settings.map(s => [s.user_id, s.n8n_webhook_url]));

    // 2. Process each message that was locked
    const processingPromises = messages.map(async (message) => {
      // Trim the URL to remove any accidental whitespace
      const webhookUrl = settingsMap.get(message.user_id)?.trim();

      if (!webhookUrl) {
        console.warn(`No webhook URL for user ${message.user_id}. Marking message ${message.id} as failed.`);
        await supabaseAdmin
          .from('scheduled_messages')
          .update({ status: 'failed' })
          .eq('id', message.id);
        return;
      }

      const payload = {
        threadId: message.thread_id,
        type: 'user',
        message: message.content || '',
        ...(message.image_url && {
          attachments: {
            type: 'image_url',
            image_url: message.image_url,
          },
        }),
      };

      try {
        const n8nResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const newStatus = n8nResponse.ok ? 'sent' : 'failed';
        
        if (!n8nResponse.ok) {
            const errorBody = await n8nResponse.text();
            console.error(`Failed to send message ${message.id} to N8N. Status: ${n8nResponse.status}. URL: ${webhookUrl}. Response: ${errorBody}`);
        }

        await supabaseAdmin
          .from('scheduled_messages')
          .update({ status: newStatus })
          .eq('id', message.id);

      } catch (e) {
        console.error(`Error sending message ${message.id} to N8N:`, e);
        await supabaseAdmin
          .from('scheduled_messages')
          .update({ status: 'failed' })
          .eq('id', message.id);
      }
    });

    await Promise.all(processingPromises);

    return new Response(JSON.stringify({ message: `Processed ${messages.length} messages.` }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});