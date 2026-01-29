

## Plan : Modifier la purge pour supprimer les articles lus non épinglés

### Contexte actuel

La fonction `purge_old_articles` protège actuellement **tous** les articles ayant une interaction utilisateur (lu OU épinglé). Cela signifie que 7 354 articles sont protégés et quasiment rien n'est jamais supprimé.

### Nouvelle règle demandée

- **Supprimer** : Articles non vus dans les flux depuis 48h+ ET non épinglés
- **Protéger** : Uniquement les articles épinglés

### Impact estimé

| Métrique | Valeur |
|----------|--------|
| Articles actuels | 7 798 |
| Articles > 48h | 6 463 |
| Articles qui seraient supprimés | ~6 456 |
| Articles protégés (épinglés) | 7 |
| Articles restants après purge | ~1 342 |

### Modification à effectuer

**Migration SQL** - Recréer la fonction `purge_old_articles` :

```sql
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
```

### Points techniques importants

1. **Cascade des suppressions** : La fonction doit d'abord supprimer les entrées `user_articles` avant de supprimer les articles eux-mêmes (contrainte de clé étrangère)

2. **Limite de 1000** : Conservée pour éviter les timeouts - la purge s'exécutera plusieurs fois si nécessaire

3. **Sécurité** : `SECURITY DEFINER` conservé pour permettre l'accès aux tables protégées par RLS

### Mise à jour de la fonction de test

Également mettre à jour `test_purge_articles` pour refléter la nouvelle logique :

```sql
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
```

### Résumé des changements

| Avant | Après |
|-------|-------|
| Articles lus = protégés | Articles lus = supprimés après 48h |
| Articles épinglés = protégés | Articles épinglés = protégés (inchangé) |
| ~0 articles supprimés/jour | ~6 400+ articles supprimés |

