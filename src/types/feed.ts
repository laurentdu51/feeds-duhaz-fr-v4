
export interface Feed {
  id: string;
  name: string;
  url: string;
  type: 'website' | 'rss-auto' | 'rss-manual' | 'youtube' | 'steam';
  description?: string;
  category: string;
  isFollowed: boolean;
  lastUpdated: string;
  articleCount: number;
  status: 'active' | 'error' | 'pending';
  subscriberCount?: number;
}
