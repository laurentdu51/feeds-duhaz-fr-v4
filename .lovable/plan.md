# Correctif : erreur de chargement sur "Mes flux"

## Diagnostic

Dans `src/hooks/useRealArticles.tsx`, branche `showFollowedOnly` (= page "Mes flux"), la requête des articles non-lus utilise :

```ts
.or(`user_articles.is.null,user_articles.is_read.eq.false`)
```

sans l'option `{ referencedTable: 'user_articles' }`. Du coup PostgREST applique le filtre `.or(...)` sur la table principale `articles` (qui n'a ni `user_articles.is` ni `user_articles.is_read`) → la requête renvoie une erreur 400 et le toast "Erreur lors du chargement des articles" s'affiche à chaque rafraîchissement.

La branche "découverte" plus bas dans le même fichier utilise déjà la bonne syntaxe avec `{ referencedTable: 'user_articles' }`, ce qui confirme le diagnostic.

Problème secondaire dans la même requête : le join `user_articles!left(...)` ne filtre pas sur `user_id`, donc les états read/pinned d'autres utilisateurs peuvent fuiter dans le résultat.

## Changements

**`src/hooks/useRealArticles.tsx`** (branche `showFollowedOnly`, requête `regularQuery` non-lus, ~ligne 85-94) :

1. Ajouter `referencedTable: 'user_articles'` au `.or(...)` pour que le filtre s'applique bien à la table embarquée.
2. Filtrer le join `user_articles` sur l'utilisateur courant pour éviter de mélanger des états entre utilisateurs (ajout d'un `.eq('user_articles.user_id', user.id)` compatible avec le left join, ou passage à un filtre côté embed).

Aucun autre fichier impacté ; pas de changement de schéma ni de logique métier au-delà du correctif de requête.

## Vérification

Après le fix :
- Recharger la page "Mes flux" connecté → plus de toast d'erreur.
- Les articles non-lus des flux suivis s'affichent normalement.
- Les épinglés restent visibles (requête `pinnedQuery` inchangée).
