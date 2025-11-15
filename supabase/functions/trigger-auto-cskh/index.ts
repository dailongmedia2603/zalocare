// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const CRON_SECRET = Deno.env.get('CRON_SECRET') || "zalo-care-cron-secret-super-long-and-random-string";
const BATCH_SIZE = 10; // Process 10 customers per run to avoid timeout

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("Function 'trigger-auto-cskh' started by cron job.");

  // 1. Security check for cron job
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error("Unauthorized access attempt detected.");
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // 2. Find customers eligible for auto-care
    console.log("Searching for eligible customers to process...");
    const { data: customers, error: customerError } = await supabaseAdmin.rpc(
      'get_eligible_auto_cskh_customers', 
      { limit_count: BATCH_SIZE }
    );

    if (customerError) {
      console.error("Error fetching customers:", customerError);
      throw customerError;
    }

    if (!customers || customers.length === 0) {
      console.log("No eligible customers found in this run.");
      return new Response(JSON.stringify({ message: 'No eligible customers to process.' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${customers.length} eligible customer(s).`);

    // 3. Trigger 'generate-care-message' for each eligible customer asynchronously
    console.log("Triggering 'generate-care-message' function for each customer...");
    const invocationPromises = customers.map(customer => {
      return supabaseAdmin.functions.invoke('generate-care-message', {
        body: { 
          threadId: customer.thread_id,
          user_id: customer.user_id 
        },
      });
    });

    // We don't await the promises here, letting them run in the background
    Promise.allSettled(invocationPromises).then(results => {
        console.log("Invocation results processing started.");
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Error invoking generate-care-message for threadId ${customers[index].thread_id}:`, result.reason);
            } else {
                console.log(`Successfully invoked for threadId ${customers[index].thread_id}.`);
            }
        });
        console.log("Invocation results processing finished.");
    });

    console.log(`Successfully triggered AI care for ${customers.length} customer(s). Function run complete.`);
    return new Response(JSON.stringify({ message: `Triggered AI care for ${customers.length} customers.` }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Critical error in trigger-auto-cskh function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});