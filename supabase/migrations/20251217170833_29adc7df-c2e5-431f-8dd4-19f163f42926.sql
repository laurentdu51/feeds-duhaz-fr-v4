-- Mettre à jour la fonction purge_old_articles pour utiliser last_seen_at
-- et protéger tous les articles associés à un utilisateur
CREATE OR REPLACE FUNCTION public.purge_old_articles()
 RETURNS TABLE(deleted_count integer, admin_emails text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted_count INTEGER;
  v_admin_emails TEXT[];
  v_cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculer la date limite (48 heures)
  v_cutoff_date := NOW() - INTERVAL '48 hours';
  
  -- Récupérer les emails des super users
  SELECT ARRAY_AGG(email) INTO v_admin_emails
  FROM public.super_users;
  
  -- Supprimer les articles non vus depuis 48h et sans interaction utilisateur
  WITH articles_to_delete AS (
    SELECT a.id
    FROM public.articles a
    WHERE a.last_seen_at < v_cutoff_date
    AND NOT EXISTS (
      SELECT 1 
      FROM public.user_articles ua
      WHERE ua.article_id = a.id
      -- Tout article avec une entrée user_articles est protégé
    )
    LIMIT 1000  -- Limiter pour éviter les timeouts
  ),
  deleted AS (
    DELETE FROM public.articles
    WHERE id IN (SELECT id FROM articles_to_delete)
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_deleted_count FROM deleted;
  
  -- Log l'opération
  RAISE NOTICE 'Purge automatique: % articles supprimés (non vus depuis 48h)', v_deleted_count;
  
  -- Retourner les résultats
  RETURN QUERY SELECT v_deleted_count, v_admin_emails;
END;
$function$;

-- Mettre à jour la fonction test_purge_articles avec les mêmes critères
CREATE OR REPLACE FUNCTION public.test_purge_articles()
 RETURNS TABLE(articles_to_delete integer, oldest_article_date timestamp with time zone, newest_article_date timestamp with time zone, sample_titles text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  v_cutoff_date := NOW() - INTERVAL '48 hours';
  
  RETURN QUERY
  WITH eligible_articles AS (
    SELECT a.id, a.last_seen_at, a.title
    FROM public.articles a
    WHERE a.last_seen_at < v_cutoff_date
    AND NOT EXISTS (
      SELECT 1 
      FROM public.user_articles ua
      WHERE ua.article_id = a.id
    )
  ),
  sample_articles AS (
    SELECT title
    FROM eligible_articles
    ORDER BY last_seen_at DESC
    LIMIT 5
  )
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM eligible_articles),
    (SELECT MIN(last_seen_at) FROM eligible_articles),
    (SELECT MAX(last_seen_at) FROM eligible_articles),
    (SELECT ARRAY_AGG(title) FROM sample_articles)
  ;
END;
$function$;