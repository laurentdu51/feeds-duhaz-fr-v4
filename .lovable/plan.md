## Problème

Dans `src/hooks/useRealArticles.tsx`, les branches **Mes flux** (ligne 94) et **Découverte** (ligne 176) utilisent :

```ts
.or('user_articles.is.null,user_articles.is_read.eq.false')
```

sans l'option `{ referencedTable: 'user_articles' }`. PostgREST interprète alors `user_articles` comme une colonne de la table `articles` (qui n'existe pas) → l'API renvoie une erreur, d'où le toast « Erreur lors du chargement des articles ».

La branche **Tous les flux** n'utilise pas ce `.or()` (elle filtre les lus en JS après fetch), donc elle fonctionne.

## Correction

Aligner les deux branches en panne sur la stratégie qui marche : **ne pas filtrer les lus côté SQL, le faire en JS après transformation**.

### Mes flux (lignes 85-106)
- Retirer le `.or('user_articles.is.null,...')`
- Garder l'embed `user_articles!left(is_read, is_pinned)` (sans filtre)
- Après transformation, filtrer : `if (!showReadArticles) garder uniquement isRead === false` (les épinglés non lus ajoutés en amont restent visibles via la déduplication)

### Découverte (lignes 175-177)
- Retirer le bloc `if (!showReadArticles && user) { discoveryQuery = discoveryQuery.or(...) }`
- Après transformation, filtrer en JS : `if (!showReadArticles) garder uniquement isRead === false`

### Aucun changement
- `togglePin`, `markAsRead`, `deleteArticle`, branche « Tous les flux », GRANTs, RLS.

## Fichier touché

- `src/hooks/useRealArticles.tsx`
