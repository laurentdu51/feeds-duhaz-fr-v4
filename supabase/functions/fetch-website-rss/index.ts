import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { isValidExternalUrl, verifyAuth } from '../_shared/security.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RSSFeed {
  url: string;
  title: string;
  type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication: Require authenticated user
    const auth = await verifyAuth(req);
    if (!auth) {
      console.log('Unauthorized access attempt to fetch-website-rss');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SSRF Protection: Validate URL
    const urlValidation = isValidExternalUrl(url);
    if (!urlValidation.valid) {
      console.log(`SSRF blocked in fetch-website-rss: ${url} - ${urlValidation.error}`);
      return new Response(
        JSON.stringify({ success: false, error: urlValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching website RSS for URL:', url);

    // Fetch the webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RSS Feed Detector/1.0)',
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const html = await response.text();
    
    // Limit content size
    if (html.length > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Website content too large');
    }
    
    const feeds: RSSFeed[] = [];

    // Extract site name from <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const siteName = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;

    // Look for RSS/Atom links in <link> tags
    const linkRegex = /<link[^>]+rel=["']alternate["'][^>]+>/gi;
    const links = html.match(linkRegex) || [];

    for (const link of links) {
      const typeMatch = link.match(/type=["']([^"']+)["']/i);
      const hrefMatch = link.match(/href=["']([^"']+)["']/i);
      const linkTitleMatch = link.match(/title=["']([^"']+)["']/i);

      if (typeMatch && hrefMatch) {
        const type = typeMatch[1];
        const href = hrefMatch[1];
        const title = linkTitleMatch ? linkTitleMatch[1] : 'RSS Feed';

        if (
          type.includes('application/rss+xml') ||
          type.includes('application/atom+xml') ||
          type.includes('application/xml')
        ) {
          // Convert relative URLs to absolute
          const feedUrl = href.startsWith('http') ? href : new URL(href, url).toString();
          
          // Validate the discovered feed URL too
          const feedUrlValidation = isValidExternalUrl(feedUrl);
          if (feedUrlValidation.valid) {
            feeds.push({
              url: feedUrl,
              title,
              type,
            });
          }
        }
      }
    }

    // Fallback: Check common RSS paths if no feeds found
    if (feeds.length === 0) {
      const commonPaths = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml', '/index.xml'];
      const baseUrl = new URL(url);
      
      for (const path of commonPaths) {
        const testUrl = `${baseUrl.origin}${path}`;
        
        // Validate fallback URL
        const testUrlValidation = isValidExternalUrl(testUrl);
        if (!testUrlValidation.valid) continue;
        
        try {
          const testController = new AbortController();
          const testTimeoutId = setTimeout(() => testController.abort(), 5000); // 5s timeout for fallback checks
          
          const testResponse = await fetch(testUrl, { 
            method: 'HEAD',
            signal: testController.signal
          });
          clearTimeout(testTimeoutId);
          
          if (testResponse.ok) {
            feeds.push({
              url: testUrl,
              title: 'RSS Feed',
              type: 'application/rss+xml',
            });
          }
        } catch (error) {
          // Ignore errors for fallback checks
          console.log(`Failed to check ${testUrl}:`, (error as Error).message);
        }
      }
    }

    console.log('Found feeds:', feeds.length);

    if (feeds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No RSS feeds found on this website',
          siteName 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the first feed by default, or all feeds if multiple
    return new Response(
      JSON.stringify({
        success: true,
        rssUrl: feeds[0].url,
        siteName,
        feeds: feeds.length > 1 ? feeds : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching website RSS:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to detect RSS feed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
