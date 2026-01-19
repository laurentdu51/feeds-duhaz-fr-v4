-- Fonction pour récupérer le nombre d'abonnés par flux
-- Utilise SECURITY DEFINER pour permettre l'accès public aux compteurs agrégés
CREATE OR REPLACE FUNCTION public.get_feed_subscriber_counts()
RETURNS TABLE(feed_id uuid, subscriber_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT feed_id, COUNT(*) as subscriber_count
  FROM public.user_feeds
  WHERE is_followed = true
  GROUP BY feed_id;
$$;