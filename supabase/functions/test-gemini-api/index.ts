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

    const testPrompt = prompt || 'Trịnh Trần Phương Tuấn là ai?';

    // Use URLSearchParams to send as application/x-www-form-urlencoded
    const body = new URLSearchParams();
    body.append('prompt', testPrompt);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    const responseText = await response.text();

    // If it's a connection test (no prompt sent from client), return simple status
    if (!prompt) {
      if (response.ok) {
        return new Response(JSON.stringify({ success: true, message: 'Connection successful!' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } else {
        return new Response(JSON.stringify({ success: false, message: `Connection failed: ${response.status} ${response.statusText}`, details: responseText }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status,
        })
      }
    }

    // If it's a prompt test, return the response
    if (response.ok) {
      try {
        // Try to parse as JSON first
        const responseData = JSON.parse(responseText);
        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } catch (e) {
        // If not JSON, return as plain text inside a JSON object for consistency
        return new Response(JSON.stringify({ answer: responseText }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    } else {
      return new Response(JSON.stringify({ success: false, message: `API call failed: ${response.status} ${response.statusText}`, details: responseText }), {
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