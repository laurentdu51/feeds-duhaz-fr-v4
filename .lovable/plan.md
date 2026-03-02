
## Diagnostique

### Sources du problème Disk IO

1. **Cron trop fréquent** : `*/10 * * * *` = toutes les 10 min × 49 flux actifs = **~14 000 appels/jour** avec des upserts massifs sur la table `articles`
2. **Index manquant sur `last_seen_at`** : la purge et les requêtes de filtrage font un full scan sur la table articles (34 MB, 2002 lignes)
3. **Upsert massif** : chaque fetch-rss fait un upsert de tous les articles du flux, même si rien n'a changé — cela génère des écritures inutiles

### Plan d'action

**1. Réduire la fréquence du cron** (impact immédiat, fort)
- Passer de `*/10 * * * *` à `*/30 * * * *` (toutes les 30 minutes)
- Les flux RSS ne se mettent généralement pas à jour plus souvent que ça
- Réduit les I/O de **3x**

**2. Ajouter un index sur `last_seen_at`** (impact sur la purge)
- Migration SQL : `CREATE INDEX idx_articles_last_seen_at ON public.articles USING btree (last_seen_at);`
- Rend la purge beaucoup plus rapide (index scan au lieu de seq scan)

**3. Optimiser l'upsert dans fetch-rss** (impact moyen)
- Mettre à jour `last_seen_at` uniquement si l'article existe déjà
- Ne pas mettre à jour le contenu si le guid existe déjà (éviter les writes inutiles)

### Fichiers modifiés

- **Migration SQL** : ajout de l'index `last_seen_at` + mise à jour du cron à 30 min
- **`supabase/functions/fetch-rss/index.ts`** : optimiser l'upsert pour ne pas réécrire les articles existants inutilement
