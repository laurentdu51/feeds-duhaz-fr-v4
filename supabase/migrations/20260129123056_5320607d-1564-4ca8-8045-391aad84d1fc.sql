-- Mise à jour de la fonction purge_old_articles
-- NOUVELLE LOGIQUE : Supprimer les articles non vus depuis 48h
-- SAUF ceux qui sont épinglés par au moins un utilisateur

CREATE OR REPLACE FUNCTION public.purge_old_articles()
RETURNS TABLE(deleted_count integer, admin_emails text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  -- NOUVELLE LOGIQUE : Supprimer les articles non vus depuis 48h
  -- SAUF ceux qui sont épinglés par au moins un utilisateur
  WITH articles_to_delete AS (
    SELECT a.id
    FROM public.articles a
    WHERE a.last_seen_at < v_cutoff_date
    AND NOT EXISTS (
      SELECT 1 
      FROM public.user_articles ua
      WHERE ua.article_id = a.id
      AND ua.is_pinned = true  -- Seuls les articles épinglés sont protégés
    )
    LIMIT 1000  -- Limiter pour éviter les timeouts
  ),
  -- Supprimer d'abord les entrées user_articles associées
  deleted_user_articles AS (
    DELETE FROM public.user_articles
    WHERE article_id IN (SELECT id FROM articles_to_delete)
    RETURNING article_id
  ),
  deleted AS (
    DELETE FROM public.articles
    WHERE id IN (SELECT id FROM articles_to_delete)
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_deleted_count FROM deleted;
  
  -- Log l'opération
  RAISE NOTICE 'Purge automatique: % articles supprimés (non vus depuis 48h, non épinglés)', v_deleted_count;
  
  -- Retourner les résultats
  RETURN QUERY SELECT v_deleted_count, v_admin_emails;
END;
$$;

-- Mise à jour de la fonction de test pour refléter la nouvelle logique
CREATE OR REPLACE FUNCTION public.test_purge_articles()
RETURNS TABLE(articles_to_delete integer, oldest_article_date timestamp with time zone, newest_article_date timestamp with time zone, sample_titles text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
      AND ua.is_pinned = true  -- Seuls les épinglés sont protégés
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
    (SELECT ARRAY_AGG(title) FROM sample_articles);
END;
$$;