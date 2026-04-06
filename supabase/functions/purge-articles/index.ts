/**
 * Purge Articles Edge Function
 * Version: 2.1
 * Last updated: 2026-01-13
 * Purpose: Automatically purge old articles and send email reports to admins
 * Security: Requires super user authentication or cron secret
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifySuperUser, validateCronSecret, isInternalCall } from '../_shared/security.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

serve(async (req) => {
  console.log('🚀 Purge-articles function invoked at', new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📝 CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication: Allow cron jobs, internal calls, or super users
    const isCronJob = await validateCronSecret(req);
    const isInternal = isInternalCall(req);
    const isSuperUser = await verifySuperUser(req);
    
    if (!isCronJob && !isInternal && !isSuperUser) {
      console.log('Unauthorized access attempt to purge-articles');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized - Super user access or cron secret required'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🗑️ Starting automatic article purge...');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the purge function
    const { data, error } = await supabase.rpc('purge_old_articles');

    if (error) {
      console.error('Error calling purge_old_articles:', error);
      throw error;
    }

    console.log('Purge completed successfully:', data);

    const result = data[0];
    const deletedCount = result.deleted_count;
    const adminEmails = result.admin_emails;

    console.log(`Deleted ${deletedCount} articles`);
    console.log(`Admin emails count:`, adminEmails?.length || 0);

    // Send email report to admins
    if (adminEmails && adminEmails.length > 0) {
      console.log('Sending purge report to admins...');
      
      const emailResponse = await supabase.functions.invoke('send-purge-report', {
        body: {
          deletedCount,
          adminEmails,
          timestamp: new Date().toISOString()
        }
      });

      if (emailResponse.error) {
        console.error('Error sending purge report:', emailResponse.error);
      } else {
        console.log('Purge report sent successfully');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount,
        reportSent: adminEmails && adminEmails.length > 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in purge-articles function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An error occurred during the purge operation'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
