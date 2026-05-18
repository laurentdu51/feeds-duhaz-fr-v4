## Objectif

Confirmer que le compteur "Toutes" inclut bien les épinglés et retirer le badge de comptage de la section "Articles épinglés".

## Constat

Dans `src/pages/Index.tsx` ligne 227, `newsCount={articles.length}` est déjà passé à `CategoryFilter`. Or `articles` (issu de `useRealArticles`) contient à la fois les articles épinglés et non-épinglés. Le badge "Toutes" affiche donc déjà le total incluant les épinglés — aucun changement requis ici.

## Changement à faire

Dans `src/components/CategoryFilter.tsx`, ligne 244, supprimer le `<Badge variant="secondary">{pinnedCount}</Badge>` à côté du titre "Articles épinglés".

Optionnel (nettoyage) : retirer la prop `pinnedCount` de l'interface et de l'appel dans `Index.tsx` puisqu'elle ne sert plus.

## Fichiers concernés

- `src/components/CategoryFilter.tsx` — retrait du Badge ligne 244 (+ nettoyage prop)
- `src/pages/Index.tsx` — retrait du passage de `pinnedCount` (si nettoyage)
