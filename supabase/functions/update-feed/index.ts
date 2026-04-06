import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isValidExternalUrl, verifySuperUser, validateCronSecret, isInternalCall } from '../_shared/security.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authentication: Allow cron jobs, internal calls, or super users
    const isCronJob = await validateCronSecret(req);
    const isInternal = isInternalCall(req);
    const isSuperUser = await verifySuperUser(req);
    
    if (!isCronJob && !isInternal && !isSuperUser) {
      console.log('Unauthorized access attempt to update-feed');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Super user access, cron secret, or service role required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { feedId, url } = await req.json()

    // Input validation
    if (!feedId || typeof feedId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid Feed ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SSRF Protection: Validate URL
    const urlValidation = isValidExternalUrl(url);
    if (!urlValidation.valid) {
      console.log(`SSRF blocked in update-feed: ${url} - ${urlValidation.error}`);
      return new Response(
        JSON.stringify({ error: urlValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the feed exists
    const { data: existingFeed, error: feedCheckError } = await supabase
      .from('feeds')
      .select('id')
      .eq('id', feedId)
      .single()

    if (feedCheckError || !existingFeed) {
      return new Response(
        JSON.stringify({ error: 'Feed not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Fetching RSS feed from: ${url}`)

    // Fetch RSS feed with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RSS Feed Updater/1.0)'
        }
      })
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const rssText = await response.text()
    
    // Limit content size
    if (rssText.length > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('RSS feed content too large');
    }
    
    console.log('RSS content fetched successfully')

    // Parse RSS content to extract metadata
    const titleMatch = rssText.match(/<title[^>]*>(.*?)<\/title>/i)
    const descriptionMatch = rssText.match(/<description[^>]*>(.*?)<\/description>/i) ||
                            rssText.match(/<subtitle[^>]*>(.*?)<\/subtitle>/i)
    
    // Count items in the feed
    const itemMatches = rssText.match(/<item[^>]*>/gi) || rssText.match(/<entry[^>]*>/gi) || []
    const articleCount = itemMatches.length

    // Clean up extracted text (remove HTML tags and decode entities)
    const cleanText = (text: string) => {
      if (!text) return ''
      return text
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
    }

    const extractedTitle = titleMatch ? cleanText(titleMatch[1]) : null
    const extractedDescription = descriptionMatch ? cleanText(descriptionMatch[1]) : null

    console.log(`Extracted data: title="${extractedTitle}", description="${extractedDescription}", articles=${articleCount}`)

    // Update feed in database
    const updateData: any = {
      last_updated: new Date().toISOString(),
      article_count: articleCount,
      status: 'active'
    }

    // Only update title and description if we found them and they're different
    if (extractedTitle) {
      updateData.name = extractedTitle
    }
    if (extractedDescription) {
      updateData.description = extractedDescription
    }

    const { data, error } = await supabase
      .from('feeds')
      .update(updateData)
      .eq('id', feedId)
      .select()

    if (error) {
      console.error('Database update error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update feed in database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Feed updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data[0],
        extracted: {
          title: extractedTitle,
          description: extractedDescription,
          articleCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error updating feed:', error)
    return new Response(
      JSON.stringify({ error: 'An error occurred while updating the feed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
