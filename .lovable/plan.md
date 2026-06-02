## Diagnostic

La dernière modif de `src/hooks/useRealArticles.tsx` a introduit deux régressions :

### 1. "Mes flux" — les articles lus reviennent / marquage inopérant

L'ancien filtre (qui fonctionnait) :
```
.or('user_articles.is.null,user_articles.is_read.eq.false')
```
filtrait les **articles parents** via la table embarquée (syntaxe PostgREST).

Le nouveau filtre :
```
.or('user_id.is.null,and(user_id.eq.<uid>,is_read.eq.false)', { referencedTable: 'user_articles' })
```
ne filtre **que les lignes embarquées** (à cause de `referencedTable`). Conséquence : les articles déjà lus restent dans le résultat, leur `user_articles[0]` est juste vide → `isRead = false` côté UI, et au rafraîchissement automatique tout réapparaît. C'est exactement le symptôme décrit.

À noter : le scope `user_id = auth.uid()` ajouté est inutile, la RLS sur `user_articles` le fait déjà.

### 2. Mode Découverte — tous les flux apparaissent

`knownFeedIds` est extrait de `user_feeds` sans filtre, puis injecté via :
```
.not('feed_id', 'in', `(${knownFeedIds.join(',')})`)
```
Avec des UUID non quotés dans la chaîne `in`, PostgREST peut renvoyer une erreur silencieuse ou ignorer le filtre → la requête tombe en "tous les articles". On bascule sur la syntaxe array (`.not('feed_id', 'in', array)` n'existe pas, donc on utilisera `.filter('feed_id', 'not.in', '("uuid","uuid")')` avec UUID quotés), ou plus robuste : on récupère un set local et on exclut en JS après fetch.

## Plan d'action

**Fichier touché : `src/hooks/useRealArticles.tsx` uniquement.** Aucun changement de schéma, aucune autre logique métier.

### A. "Mes flux" — restaurer le comportement antérieur
- Branche `!showReadArticles` : remettre l'embed `user_articles!left(is_read, is_pinned)` et le filtre :
  ```
  .or('user_articles.is.null,user_articles.is_read.eq.false')
  ```
  (sans `referencedTable`, pour que le filtre s'applique aux articles parents).
- Branche `showReadArticles` : remettre l'embed `user_articles(is_read, is_pinned)` sans le `.or('user_id...')` ajouté récemment (la RLS scope déjà à l'utilisateur).

### B. Mode Découverte — exclusion fiable des flux connus
- Construire les UUID quotés : `knownFeedIds.map(id => `"${id}"`).join(',')` puis `.not('feed_id', 'in', `(${quoted})`)`.
- Filet de sécurité : après la requête, refiltrer côté JS `articles.filter(a => !knownSet.has(a.feed_id))` au cas où la query échouerait silencieusement, pour éviter le bug "tous les flux apparaissent".

### C. Vérification
- Recharger la page sur "Mes flux" → marquer un article comme lu → l'article disparaît et ne revient pas après le refresh auto (5 min) ni le bouton Actualiser.
- Basculer en "Découverte" → seuls les flux jamais référencés dans `user_feeds` apparaissent (badge violet 🔍).
- "Tous les flux" continue de fonctionner comme aujourd'hui (non touché).

Aucune modification des fonctions `markAsRead`, `togglePin`, `deleteArticle`, ni des GRANT déjà appliqués.
