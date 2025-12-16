
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid?: string;
  content?: string;
  image?: string;
}

interface RSSFeed {
  title: string;
  description: string;
  items: RSSItem[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to extract text content from XML tags
function extractTextContent(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  if (match && match[1]) {
    // Remove CDATA wrapper if present and clean HTML tags
    let content = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1');
    content = content.replace(/<[^>]*>/g, '').trim();
    return content;
  }
  return '';
}

// Helper function to extract attribute from XML tags
function extractAttribute(xml: string, tagName: string, attributeName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*${attributeName}=["']([^"']*)["'][^>]*>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : '';
}

// Helper function to extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Helper function to generate YouTube thumbnail URL
function generateYouTubeThumbnail(videoUrl: string): string | null {
  const videoId = getYouTubeVideoId(videoUrl);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { feedId, feedUrl } = await req.json()

    console.log(`Fetching RSS for feed: ${feedId}, URL: ${feedUrl}`)

    // Fetch RSS content
    const response = await fetch(feedUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.statusText}`)
    }

    const rssText = await response.text()
    console.log(`RSS content length: ${rssText.length}`)
    
    // Parse RSS using regex patterns
    const items: RSSItem[] = [];
    
    // Split by item or entry tags
    const itemRegex = /<(item|entry)[^>]*>([\s\S]*?)<\/\1>/gi;
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(rssText)) !== null) {
      const itemXml = itemMatch[0];
      
      const title = extractTextContent(itemXml, 'title');
      const description = extractTextContent(itemXml, 'description') || 
                         extractTextContent(itemXml, 'summary') ||
                         extractTextContent(itemXml, 'content');
      
      let link = extractTextContent(itemXml, 'link');
      if (!link) {
        // Try to get link from href attribute
        link = extractAttribute(itemXml, 'link', 'href');
      }
      
      const pubDate = extractTextContent(itemXml, 'pubDate') || 
                     extractTextContent(itemXml, 'published') ||
                     extractTextContent(itemXml, 'updated');
      
      const guid = extractTextContent(itemXml, 'guid') || 
                  extractTextContent(itemXml, 'id') || 
                  link;
      
      // Try to extract image from enclosure or content
      let image = extractAttribute(itemXml, 'enclosure', 'url');
      if (!image && description) {
        const imgMatch = description.match(/src=["']([^"']*\.(jpg|jpeg|png|gif|webp))[^"']*/i);
        if (imgMatch) {
          image = imgMatch[1];
        }
      }
      
      // Generate YouTube thumbnail if this is a YouTube link and no image found
      if (!image && link) {
        const youtubeImage = generateYouTubeThumbnail(link);
        if (youtubeImage) {
          image = youtubeImage;
        }
      }

      if (title && guid) {
        items.push({
          title,
          description: description || '',
          link: link || '',
          pubDate: pubDate || new Date().toISOString(),
          guid,
          image: image || '',
          content: description || ''
        });
      }
    }

    console.log(`Parsed ${items.length} items from RSS feed`)

    // Save articles to database
    const now = new Date().toISOString();
    const articlesToInsert = items.map(item => {
      // Calculate read time (rough estimate: 200 words per minute)
      const wordCount = (item.description || '').split(' ').length
      const readTime = Math.max(1, Math.ceil(wordCount / 200))

      // Parse and validate date
      let publishedAt: string;
      try {
        if (item.pubDate) {
          publishedAt = new Date(item.pubDate).toISOString();
        } else {
          publishedAt = new Date().toISOString();
        }
      } catch (error) {
        console.log(`Invalid date format: ${item.pubDate}, using current date`);
        publishedAt = new Date().toISOString();
      }

      return {
        feed_id: feedId,
        title: item.title,
        description: item.description,
        content: item.content || item.description,
        url: item.link || null,
        image_url: item.image || null,
        published_at: publishedAt,
        guid: item.guid,
        read_time: readTime,
        last_seen_at: now
      }
    })

    console.log(`Preparing to insert ${articlesToInsert.length} articles`)

    // Insert articles - on conflict update last_seen_at
    const { error: insertError } = await supabaseClient
      .from('articles')
      .upsert(articlesToInsert, { 
        onConflict: 'feed_id,guid'
      })

    if (insertError) {
      console.error('Error inserting articles:', insertError)
      throw insertError
    }

    // Get current article count for this feed
    const { count: currentArticleCount, error: countError } = await supabaseClient
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('feed_id', feedId)

    if (countError) {
      console.error('Error counting articles:', countError)
    }

    // Update feed's last_fetched_at and article_count
    const { error: updateError } = await supabaseClient
      .from('feeds')
      .update({ 
        last_fetched_at: new Date().toISOString(),
        status: 'active',
        article_count: currentArticleCount || 0
      })
      .eq('id', feedId)

    if (updateError) {
      console.error('Error updating feed:', updateError)
      throw updateError
    }

    console.log(`Successfully processed ${articlesToInsert.length} articles for feed ${feedId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        articlesProcessed: articlesToInsert.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Error in fetch-rss function:', error)
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
