import { supabase } from '@/integrations/supabase/client';

interface RSSFeed {
  url: string;
  title: string;
  type: string;
}

interface FetchRSSResult {
  rssUrl: string;
  siteName: string;
  feeds?: RSSFeed[];
}

export async function fetchWebsiteRSS(url: string): Promise<FetchRSSResult | null> {
  try {
    console.log('Fetching RSS for website:', url);

    const { data, error } = await supabase.functions.invoke('fetch-website-rss', {
      body: { url }
    });

    if (error) {
      console.error('Error calling fetch-website-rss:', error);
      return null;
    }

    if (!data.success) {
      console.error('RSS detection failed:', data.error);
      return null;
    }

    return {
      rssUrl: data.rssUrl,
      siteName: data.siteName,
      feeds: data.feeds,
    };
  } catch (error) {
    console.error('Error fetching website RSS:', error);
    return null;
  }
}

export function isValidWebsiteUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isDirectRSSFeed(url: string): boolean {
  return url.includes('.xml') || url.includes('/feed') || url.includes('/rss') || url.includes('/atom');
}
