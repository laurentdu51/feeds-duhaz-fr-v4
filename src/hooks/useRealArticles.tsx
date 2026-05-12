import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { NewsItem } from '@/types/news';
import { toast } from 'sonner';

const isDev = import.meta.env.DEV;

export function useRealArticles(dateFilter?: 'today' | 'yesterday' | null, showFollowedOnly?: boolean, showReadArticles?: boolean, showDiscoveryMode?: boolean) {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      if (isDev) console.log('🔄 Fetching articles...', { user: !!user, dateFilter, showFollowedOnly });
      
      // Calculate date ranges for filtering
      let dateStart = null;
      let dateEnd = null;
      
      if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dateStart = today.toISOString();
        today.setHours(23, 59, 59, 999);
        dateEnd = today.toISOString();
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        dateStart = yesterday.toISOString();
        yesterday.setHours(23, 59, 59, 999);
        dateEnd = yesterday.toISOString();
      }
      
      if (user && showFollowedOnly) {
        // For authenticated users wanting only followed feeds
        const { data: userFeeds, error: userFeedsError } = await supabase
          .from('user_feeds')
          .select('feed_id')
          .eq('user_id', user.id)
          .eq('is_followed', true);

        if (userFeedsError) {
          if (isDev) console.error('❌ Error fetching user feeds:', userFeedsError);
          toast.error('Erreur lors du chargement de vos flux');
          return;
        }

        const followedFeedIds = userFeeds?.map(uf => uf.feed_id) || [];
        
        if (followedFeedIds.length === 0) {
          setArticles([]);
          return;
        }

        // Fetch pinned articles first (without date filter)
        const pinnedQuery = supabase
          .from('articles')
          .select(`
            *,
            feeds!inner(name, category, type, status),
            user_articles!inner(is_read, is_pinned)
          `)
          .in('feed_id', followedFeedIds)
          .eq('user_articles.user_id', user.id)
          .eq('user_articles.is_pinned', true)
          .eq('user_articles.is_read', false)
          .eq('feeds.status', 'active');

        const { data: pinnedArticles, error: pinnedError } = await pinnedQuery
          .order('published_at', { ascending: false })
          .limit(100);

        if (pinnedError && isDev) {
          console.error('❌ Error fetching pinned articles:', pinnedError);
        }

        // Fetch regular articles (with date filter if specified)
        let regularQuery;
        
        if (!showReadArticles) {
          regularQuery = supabase
            .from('articles')
            .select(`
              *,
              feeds!inner(name, category, type, status),
              user_articles!left(is_read, is_pinned)
            `)
            .in('feed_id', followedFeedIds)
            .or(`user_articles.is.null,user_articles.is_read.eq.false`)
            .eq('feeds.status', 'active');
        } else {
          regularQuery = supabase
            .from('articles')
            .select(`
              *,
              feeds!inner(name, category, type, status),
              user_articles(is_read, is_pinned)
            `)
            .in('feed_id', followedFeedIds)
            .eq('feeds.status', 'active');
        }
        
        if (dateStart && dateEnd) {
          regularQuery = regularQuery.gte('published_at', dateStart).lte('published_at', dateEnd);
        }
        
        const { data: regularArticles, error: regularError } = await regularQuery
          .order('published_at', { ascending: false })
          .limit(200);

        if (regularError) {
          if (isDev) console.error('❌ Error fetching regular articles:', regularError);
          toast.error('Erreur lors du chargement des articles');
          return;
        }

        // Combine articles and remove duplicates
        const allArticles = [...(pinnedArticles || []), ...(regularArticles || [])];
        const uniqueArticles = allArticles.filter((article, index, self) => 
          index === self.findIndex(a => a.id === article.id)
        );

        // Transform to NewsItem format
        const transformedArticles: NewsItem[] = uniqueArticles
          ?.map(article => ({
            id: article.id,
            title: article.title,
            description: article.description || '',
            content: article.content || '',
            source: article.feeds.name,
            category: (article.feeds.type?.startsWith('rss') ? 'rss' : article.feeds.type) as NewsItem['category'],
            publishedAt: article.published_at,
            readTime: article.read_time || 5,
            isPinned: article.user_articles?.[0]?.is_pinned || false,
            isRead: article.user_articles?.[0]?.is_read || false,
            url: article.url || undefined,
            imageUrl: article.image_url || undefined,
            feedId: article.feed_id,
            lastSeenAt: article.last_seen_at || undefined
          })) || [];

        setArticles(transformedArticles.slice(0, 100));
      } else if (showDiscoveryMode && user) {
        // ======= MODE DÉCOUVERTE =======
        
        // 1. Récupérer tous les feed_id que l'utilisateur a déjà interagi avec
        const { data: knownFeeds } = await supabase
          .from('user_feeds')
          .select('feed_id')
          .eq('user_id', user.id);
        
        const knownFeedIds = knownFeeds?.map(f => f.feed_id) || [];
        
        // 2. Récupérer uniquement les articles des flux inconnus + actifs
        let discoveryQuery = supabase
          .from('articles')
          .select(`
            *,
            feeds!inner(name, category, type, status),
            user_articles(is_read, is_pinned)
          `)
          .eq('feeds.status', 'active');
        
        if (knownFeedIds.length > 0) {
          discoveryQuery = discoveryQuery.not('feed_id', 'in', `(${knownFeedIds.join(',')})`);
        }
        
        if (!showReadArticles && user) {
          discoveryQuery = discoveryQuery.or('user_articles.is.null,user_articles.is_read.eq.false', { referencedTable: 'user_articles' });
        }
        
        discoveryQuery = discoveryQuery
          .order('published_at', { ascending: false })
          .limit(100);
        
        const { data: discoveryArticles, error: discoveryError } = await discoveryQuery;
        
        if (discoveryError) {
          if (isDev) console.error('❌ Error fetching discovery articles:', discoveryError);
          toast.error('Erreur lors du chargement des articles en découverte');
          return;
        }
        
        const formattedArticles = (discoveryArticles || []).map(article => ({
          id: article.id,
          title: article.title,
          description: article.description || '',
          content: article.content || '',
          publishedAt: article.published_at,
          source: article.feeds.name,
          category: (article.feeds.type?.startsWith('rss') ? 'rss' : article.feeds.type) as 'rss' | 'youtube' | 'steam' | 'actualites',
          url: article.url || '',
          imageUrl: article.image_url,
          isPinned: false,
          isRead: article.user_articles?.[0]?.is_read || false,
          feedId: article.feed_id,
          readTime: article.read_time || 5,
          isDiscovery: true,
          lastSeenAt: article.last_seen_at || undefined
        }));
        
        setArticles(formattedArticles);
      } else {
        // For users wanting all articles or visitors
        let pinnedArticles: any[] = [];
        let regularArticles: any[] = [];

        if (user) {
          const pinnedQuery = supabase
            .from('articles')
            .select(`
              *,
              feeds!inner(name, category, type, status),
              user_articles!inner(is_read, is_pinned)
            `)
            .eq('user_articles.user_id', user.id)
            .eq('user_articles.is_pinned', true)
            .eq('feeds.status', 'active');

          const { data: pinnedData, error: pinnedError } = await pinnedQuery
            .order('published_at', { ascending: false })
            .limit(100);

          if (!pinnedError) {
            pinnedArticles = pinnedData || [];
          }
        }

        let regularQuery = supabase
          .from('articles')
          .select(`
            *,
            feeds!inner(name, category, type, status),
            user_articles(is_read, is_pinned)
          `)
          .eq('feeds.status', 'active');
        
        const { data: regularData, error: regularError } = await regularQuery
          .order('published_at', { ascending: false })
          .limit(200);

        if (regularError) {
          if (isDev) console.error('❌ Error fetching regular articles:', regularError);
          toast.error('Erreur lors du chargement des articles');
          return;
        }

        regularArticles = regularData || [];

        // Combine articles and remove duplicates
        const allArticles = [...pinnedArticles, ...regularArticles];
        const uniqueArticles = allArticles.filter((article, index, self) => 
          index === self.findIndex(a => a.id === article.id)
        );

        // Transform to NewsItem format and conditionally filter read articles
        const transformedArticles: NewsItem[] = uniqueArticles
          ?.filter(article => {
            const hasFeeds = !!article.feeds;
            const userArticle = article.user_articles?.[0];
            const isRead = userArticle?.is_read || false;
            const shouldShow = showReadArticles || !isRead;
            return hasFeeds && shouldShow;
          })
          ?.map(article => ({
            id: article.id,
            title: article.title,
            description: article.description || '',
            content: article.content || '',
            source: article.feeds.name,
            category: (article.feeds.type?.startsWith('rss') ? 'rss' : article.feeds.type) as NewsItem['category'],
            publishedAt: article.published_at,
            readTime: article.read_time || 5,
            isPinned: user ? (article.user_articles?.[0]?.is_pinned || false) : false,
            isRead: user ? (article.user_articles?.[0]?.is_read || false) : false,
            url: article.url || undefined,
            imageUrl: article.image_url || undefined,
            feedId: article.feed_id,
            lastSeenAt: article.last_seen_at || undefined
           })) || [];

        setArticles(transformedArticles.slice(0, 100));
      }
    } catch (error) {
      if (isDev) console.error('💥 Error in fetchArticles:', error);
      toast.error('Erreur lors du chargement des articles');
    } finally {
      setLoading(false);
    }
  }, [user, dateFilter, showFollowedOnly, showReadArticles, showDiscoveryMode]);

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
      if (isDev) console.error('Error toggling pin:', error);
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
        if (isDev) console.error('Error marking as read:', error);
        return;
      }

      if (!showReadArticles) {
        setArticles(prev => prev.filter(item => item.id !== articleId));
      } else {
        setArticles(prev => prev.map(item => item.id === articleId ? { ...item, isRead: true } : item));
      }
    } catch (error) {
      if (isDev) console.error('Error marking as read:', error);
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
      if (isDev) console.error('Error deleting article:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const fetchRSSContent = async (feedId: string, feedUrl: string) => {
    try {
      toast.info('Récupération du contenu RSS...');
      
      const { data, error } = await supabase.functions.invoke('fetch-rss', {
        body: { feedId, feedUrl }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(`${data.articlesProcessed} articles récupérés`);
        await fetchArticles();
      } else {
        throw new Error(data.error || 'Erreur lors de la récupération RSS');
      }
    } catch (error) {
      if (isDev) console.error('Error fetching RSS:', error);
      toast.error('Erreur lors de la récupération du contenu RSS');
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [user, dateFilter, showFollowedOnly, showReadArticles]);

  return {
    articles,
    loading,
    togglePin,
    markAsRead,
    deleteArticle,
    refetch: fetchArticles,
    fetchRSSContent
  };
}
