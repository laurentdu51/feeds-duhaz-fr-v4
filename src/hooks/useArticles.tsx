
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { NewsItem } from '@/types/news';
import { toast } from 'sonner';

export function useArticles() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchArticles = async () => {
    try {
      setLoading(true);
      
      if (user) {
        // For authenticated users, fetch articles from their followed feeds
        const { data: userFeeds, error: userFeedsError } = await supabase
          .from('user_feeds')
          .select(`
            feed_id,
            feeds!inner(*)
          `)
          .eq('user_id', user.id)
          .eq('is_followed', true);

        if (userFeedsError) {
          console.error('Error fetching user feeds:', userFeedsError);
          toast.error('Erreur lors du chargement de vos flux');
          return;
        }

        // For now, we'll use mock data but filter by followed feeds
        // In a real app, you'd have an articles table linked to feeds
        const followedFeedNames = userFeeds?.map(uf => uf.feeds.name) || [];
        
        // Import mock data and filter by followed feeds
        const { newsItems } = await import('@/data/mockNews');
        const filteredArticles = newsItems.filter(article => 
          followedFeedNames.some(feedName => 
            article.source.toLowerCase().includes(feedName.toLowerCase()) ||
            feedName.toLowerCase().includes(article.source.toLowerCase())
          )
        );
        
        setArticles(filteredArticles);
      } else {
        // For visitors, show all recent articles
        const { newsItems } = await import('@/data/mockNews');
        setArticles(newsItems);
      }
    } catch (error) {
      console.error('Error in fetchArticles:', error);
      toast.error('Erreur lors du chargement des articles');
    } finally {
      setLoading(false);
    }
  };

  const togglePin = (id: string) => {
    setArticles(prev => prev.map(item => 
      item.id === id ? { ...item, isPinned: !item.isPinned } : item
    ));
    toast.success("Article épinglé mis à jour");
  };

  const markAsRead = (id: string) => {
    setArticles(prev => prev.map(item => 
      item.id === id ? { ...item, isRead: true } : item
    ));
  };

  const deleteArticle = (id: string) => {
    setArticles(prev => prev.filter(item => item.id !== id));
    toast.success("Article supprimé");
  };

  useEffect(() => {
    fetchArticles();
  }, [user]);

  return {
    articles,
    loading,
    togglePin,
    markAsRead,
    deleteArticle,
    refetch: fetchArticles
  };
}
