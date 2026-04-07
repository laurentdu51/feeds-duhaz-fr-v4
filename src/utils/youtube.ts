
// Function to extract YouTube channel ID from various URL formats
export const extractYouTubeChannelId = (url: string): string | null => {
  const patterns = [
    // Channel ID format: https://www.youtube.com/channel/UCxxxxxx
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    // Handle format: https://www.youtube.com/c/ChannelName
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    // User format: https://www.youtube.com/user/username
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
    // Custom URL format: https://www.youtube.com/@channelname
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
};

// Function to detect if a URL is a direct RSS feed
export const isDirectRSSFeed = (url: string): boolean => {
  return url.includes('feeds/videos.xml?channel_id=');
};

// Function to convert YouTube channel URL to RSS feed URL
export const convertYouTubeToRSS = (url: string): string => {
  // If it's already an RSS feed URL, return as is
  if (isDirectRSSFeed(url)) {
    return url;
  }

  const channelId = extractYouTubeChannelId(url);
  
  if (channelId) {
    // For channel ID format (starts with UC), we can directly create the RSS URL
    if (url.includes('/channel/') && channelId.startsWith('UC')) {
      return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    }
    
    // For other formats, warn that it might not work
    console.warn(`YouTube RSS URL might not work for custom username: ${channelId}. You may need to find the actual channel ID starting with 'UC'`);
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  }
  
  // If we can't extract the channel ID, return the original URL
  return url;
};

// Function to extract channel name from @username format URL
export const extractChannelNameFromUrl = (url: string): string | null => {
  // Try to extract from @username format
  const atMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
  if (atMatch && atMatch[1]) {
    return atMatch[1];
  }
  
  // Try to extract from /c/ format
  const cMatch = url.match(/youtube\.com\/c\/([a-zA-Z0-9_-]+)/);
  if (cMatch && cMatch[1]) {
    return cMatch[1];
  }
  
  // Try to extract from /user/ format
  const userMatch = url.match(/youtube\.com\/user\/([a-zA-Z0-9_-]+)/);
  if (userMatch && userMatch[1]) {
    return userMatch[1];
  }
  
  return null;
};

// Function to check if URL needs channel ID lookup
export const needsChannelIdLookup = (url: string): boolean => {
  return url.includes('/@') || url.includes('/c/') || url.includes('/user/');
};

// Function to get instructions for finding channel ID
export const getChannelIdInstructions = (): string => {
  return `Pour trouver le flux RSS d'une chaîne YouTube :

Méthode recommandée :
1. Allez sur la page de la chaîne YouTube
2. Clic droit → "Afficher le code source" 
3. Cherchez : <link rel="alternate" type="application/rss+xml"
4. Copiez l'URL complète du flux RSS (https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxx)

Méthode alternative :
1. Cherchez "channelId":"UC..." dans le code source
2. Utilisez l'URL : https://www.youtube.com/channel/UCxxxxx`;
};

// Function to automatically fetch YouTube channel RSS and name
export const fetchYouTubeRSSUrl = async (url: string): Promise<{rssUrl: string, channelName: string} | null> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error('No active session for fetch-youtube-rss');
      return null;
    }

    const response = await fetch(`https://data.duhaz.fr/functions/v1/fetch-youtube-rss`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to fetch YouTube RSS:', errorData.error);
      return null;
    }

    const data = await response.json();
    console.log('Successfully fetched YouTube RSS data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching YouTube RSS:', error);
    return null;
  }
};

// Function to fetch YouTube channel name from page metadata with fallback
export const fetchYouTubeChannelName = async (url: string): Promise<string | null> => {
  // First, try to extract name from URL if it's an @username format
  const urlName = extractChannelNameFromUrl(url);
  if (urlName) {
    console.log('Extracted channel name from URL:', urlName);
    return urlName;
  }

  // If we can't extract from URL, return null instead of trying CORS proxies
  // which are often blocked or unreliable
  console.log('Could not extract channel name from URL, manual entry required');
  return null;
};
