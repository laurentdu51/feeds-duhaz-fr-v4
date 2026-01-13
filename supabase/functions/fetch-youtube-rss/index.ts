import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { isValidExternalUrl, verifyAuth } from '../_shared/security.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authentication: Require authenticated user
    const auth = await verifyAuth(req);
    if (!auth) {
      console.log('Unauthorized access attempt to fetch-youtube-rss');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    const { url } = await req.json()
    
    // Input validation - must be a YouTube URL
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid URL is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Validate it's a YouTube URL specifically
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return new Response(
        JSON.stringify({ error: 'Invalid YouTube URL' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // SSRF Protection: Validate URL format
    const urlValidation = isValidExternalUrl(url);
    if (!urlValidation.valid) {
      console.log(`SSRF blocked in fetch-youtube-rss: ${url} - ${urlValidation.error}`);
      return new Response(
        JSON.stringify({ error: urlValidation.error }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log('Fetching YouTube page:', url)
    
    // Fetch the YouTube page with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    } finally {
      clearTimeout(timeoutId);
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Limit content size
    if (html.length > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Page content too large');
    }
    
    // Look for the RSS feed link in the HTML
    const rssLinkMatch = html.match(/<link[^>]+rel="alternate"[^>]+type="application\/rss\+xml"[^>]+href="([^"]+)"/i)
    
    if (!rssLinkMatch) {
      return new Response(
        JSON.stringify({ error: 'RSS feed not found on this YouTube page' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }
    
    const rssUrl = rssLinkMatch[1]
    
    // Validate the discovered RSS URL
    const rssUrlValidation = isValidExternalUrl(rssUrl);
    if (!rssUrlValidation.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid RSS feed URL discovered' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }
    
    // Also try to extract the channel name from the page title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
    let channelName = null
    
    if (titleMatch) {
      // Remove " - YouTube" from the end if present
      channelName = titleMatch[1].replace(/ - YouTube$/, '')
    }
    
    console.log('Found RSS URL:', rssUrl)
    console.log('Found channel name:', channelName)
    
    return new Response(
      JSON.stringify({ 
        rssUrl,
        channelName
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch YouTube RSS feed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
