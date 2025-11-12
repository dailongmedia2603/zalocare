// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { apiUrl, prompt } = await req.json()

    if (!apiUrl) {
      return new Response(JSON.stringify({ error: 'apiUrl is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const testPrompt = prompt || 'Nguyễn Quang Hải là ai ?';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        prompt: testPrompt,
      }),
    });

    // If it's a connection test (no prompt sent from client), return simple status
    if (!prompt) {
      if (response.ok) {
        return new Response(JSON.stringify({ success: true, message: 'Connection successful!' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } else {
        const errorText = await response.text();
        return new Response(JSON.stringify({ success: false, message: `Connection failed: ${response.status} ${response.statusText}`, details: errorText }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status,
        })
      }
    }

    // If it's a prompt test, return the full response body
    if (response.ok) {
      const responseData = await response.json();
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      const errorText = await response.text();
      return new Response(JSON.stringify({ success: false, message: `API call failed: ${response.status} ${response.statusText}`, details: errorText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      })
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})