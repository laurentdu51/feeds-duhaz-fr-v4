
export interface NewsItem {
  id: string;
  title: string;
  description: string;
  content: string;
  source: string;
  category: 'rss' | 'youtube' | 'steam' | 'actualites';
  publishedAt: string;
  readTime: number;
  isPinned: boolean;
  isRead: boolean;
  url?: string;
  imageUrl?: string;
  feedId?: string;
  isDiscovery?: boolean;
}

export interface NewsCategory {
  id: string;
  name: string;
  type: 'rss' | 'youtube' | 'steam' | 'actualites';
  color: string;
  icon: string;
}
