
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Feed } from '@/types/feed';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useFeeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      
      // Fetch all feeds
      const { data: feedsData, error: feedsError } = await supabase
        .from('feeds')
        .select('*')
        .order('name');

      if (feedsError) {
        toast.error('Erreur lors du chargement des flux');
        console.error('Error fetching feeds:', feedsError);
        return;
      }

      // Fetch subscriber counts (accessible to everyone via SECURITY DEFINER function)
      const { data: subscriberCounts, error: subscriberError } = await supabase
        .rpc('get_feed_subscriber_counts');

      if (subscriberError) {
        console.error('Error fetching subscriber counts:', subscriberError);
      }

      // If user is authenticated, fetch their subscriptions
      let userFeedsData = null;
      if (user) {
        const { data, error } = await supabase
          .from('user_feeds')
          .select('feed_id, is_followed')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user feeds:', error);
        } else {
          userFeedsData = data;
        }
      }

      // Combine feeds with user subscription status and subscriber counts
      const combinedFeeds = feedsData.map(feed => ({
        id: feed.id,
        name: feed.name,
        url: feed.url,
        type: feed.type as Feed['type'],
        description: feed.description,
        category: feed.category,
        isFollowed: userFeedsData?.find(uf => uf.feed_id === feed.id)?.is_followed || false,
        lastUpdated: feed.last_updated || feed.created_at,
        articleCount: feed.article_count || 0,
        status: feed.status as Feed['status'],
        subscriberCount: Number(subscriberCounts?.find(sc => sc.feed_id === feed.id)?.subscriber_count) || 0
      }));

      setFeeds(combinedFeeds);
    } catch (error) {
      console.error('Error in fetchFeeds:', error);
      toast.error('Erreur lors du chargement des flux');
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (feedId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté pour suivre un flux');
      return;
    }

    try {
      const feed = feeds.find(f => f.id === feedId);
      if (!feed) return;

      // Check if subscription exists
      const { data: existingSubscription } = await supabase
        .from('user_feeds')
        .select('*')
        .eq('user_id', user.id)
        .eq('feed_id', feedId)
        .single();

      if (existingSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('user_feeds')
          .update({ is_followed: !feed.isFollowed })
          .eq('user_id', user.id)
          .eq('feed_id', feedId);

        if (error) {
          toast.error('Erreur lors de la mise à jour');
          return;
        }
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('user_feeds')
          .insert({
            user_id: user.id,
            feed_id: feedId,
            is_followed: true
          });

        if (error) {
          toast.error('Erreur lors de l\'ajout');
          return;
        }
      }

      // Update local state
      setFeeds(prev => prev.map(f => 
        f.id === feedId 
          ? { ...f, isFollowed: !f.isFollowed }
          : f
      ));

      toast.success(
        feed.isFollowed 
          ? `Vous ne suivez plus "${feed.name}"` 
          : `Vous suivez maintenant "${feed.name}"`
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, [user]);

  return {
    feeds,
    loading,
    toggleFollow,
    refetch: fetchFeeds
  };
}
