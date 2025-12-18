import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { NewsItem } from '@/types/news';
import { toast } from 'sonner';

const ARTICLES_PER_PAGE = 100;
const FETCH_LIMIT = 200;

interface FeedInfo {
  name: string;
  description: string | null;
  category: string;
  type: string;
}

export function useFeedArticles(feedId: string, page: number = 1) {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [feedInfo, setFeedInfo] = useState<FeedInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { user } = useAuth();

  const fetchFeedArticles = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching articles for feed:', feedId, 'page:', page);

      // Fetch feed info
      const { data: feed, error: feedError } = await supabase
        .from('feeds')
        .select('name, description, category, type')
        .eq('id', feedId)
        .single();

      if (feedError) {
        console.error('❌ Error fetching feed info:', feedError);
        toast.error('Flux introuvable');
        return;
      }

      setFeedInfo(feed);

      // Get total count for pagination
      const { count } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('feed_id', feedId);

      setTotalCount(count || 0);

      // Calculate pagination
      const from = (page - 1) * ARTICLES_PER_PAGE;
      const to = from + ARTICLES_PER_PAGE - 1;

      // Fetch articles with pagination - fetch more than displayed
      const fetchFrom = (page - 1) * FETCH_LIMIT;
      const fetchTo = fetchFrom + FETCH_LIMIT - 1;
      
      let query = supabase
        .from('articles')
        .select(`
          *,
          feeds!inner(name, category, type),
          user_articles(is_read, is_pinned)
        `)
        .eq('feed_id', feedId)
        .order('published_at', { ascending: false })
        .range(fetchFrom, fetchTo);

      const { data: articlesData, error: articlesError } = await query;

      if (articlesError) {
        console.error('❌ Error fetching articles:', articlesError);
        toast.error('Erreur lors du chargement des articles');
        return;
      }

      console.log('📰 Articles found:', articlesData?.length || 0);

      // Transform to NewsItem format
      const transformedArticles: NewsItem[] = articlesData
        ?.map(article => ({
          id: article.id,
          title: article.title,
          description: article.description || '',
          content: article.content || '',
          source: article.feeds.name,
          category: (article.feeds.type?.startsWith('rss') ? 'rss' : article.feeds.type) as NewsItem['category'],
          publishedAt: article.published_at,
          readTime: article.read_time || 5,
          isPinned: user ? (article.user_articles[0]?.is_pinned || false) : false,
          isRead: user ? (article.user_articles[0]?.is_read || false) : false,
          url: article.url || undefined,
          imageUrl: article.image_url || undefined,
          feedId: article.feed_id,
          lastSeenAt: article.last_seen_at || undefined
        })) || [];

      setArticles(transformedArticles.slice(0, ARTICLES_PER_PAGE));
    } catch (error) {
      console.error('💥 Error in fetchFeedArticles:', error);
      toast.error('Erreur lors du chargement des articles');
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (articleId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté pour épingler un article');
      return;
    }

    try {
      const article = articles.find(a => a.id === articleId);
      if (!article) return;

      const { error } = await supabase
        .from('user_articles')
        .upsert({
          user_id: user.id,
          article_id: articleId,
          is_pinned: !article.isPinned,
          is_read: article.isRead
        }, {
          onConflict: 'user_id,article_id'
        });

      if (error) {
        toast.error('Erreur lors de la mise à jour');
        return;
      }

      setArticles(prev => prev.map(item => 
        item.id === articleId ? { ...item, isPinned: !item.isPinned } : item
      ));
      
      toast.success(article.isPinned ? "Article retiré des épinglés" : "Article épinglé");
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const markAsRead = async (articleId: string) => {
    if (!user) return;

    try {
      const article = articles.find(a => a.id === articleId);
      if (!article || article.isRead) return;

      const { error } = await supabase
        .from('user_articles')
        .upsert({
          user_id: user.id,
          article_id: articleId,
          is_read: true,
          is_pinned: article.isPinned,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,article_id'
        });

      if (error) {
        console.error('Error marking as read:', error);
        return;
      }

      setArticles(prev => prev.map(item => 
        item.id === articleId ? { ...item, isRead: true } : item
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteArticle = async (articleId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté pour supprimer un article');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_articles')
        .delete()
        .eq('user_id', user.id)
        .eq('article_id', articleId);

      if (error) {
        toast.error('Erreur lors de la suppression');
        return;
      }

      setArticles(prev => prev.filter(item => item.id !== articleId));
      toast.success("Article supprimé de votre vue");
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  useEffect(() => {
    if (feedId) {
      fetchFeedArticles();
    }
  }, [feedId, page, user]);

  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);

  return {
    articles,
    feedInfo,
    loading,
    totalCount,
    totalPages,
    currentPage: page,
    togglePin,
    markAsRead,
    deleteArticle,
    refetch: fetchFeedArticles
  };
}
