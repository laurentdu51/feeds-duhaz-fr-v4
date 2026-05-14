## Problème
L'affichage par défaut des articles pour un utilisateur connecté est censé être "Mes flux" (`showFollowedOnly = true`), mais le `useState(!!user)` est initialisé avant que la session ne soit récupérée, ce qui bloque la valeur sur `false`.

## Solution
Corriger l'initialisation du mode d'affichage dans `src/pages/Index.tsx` pour que :
1. Lors du chargement initial, si l'utilisateur est connecté, `showFollowedOnly` passe automatiquement à `true`
2. Lors de la déconnexion, il repasse à `false` (mode visiteur)
3. L'utilisateur peut toujours basculer manuellement via les boutons de la sidebar

## Implémentation technique
- Dans `Index.tsx` : ajouter un `useEffect` qui observe `user` et ajuste `showFollowedOnly` en conséquence, en évitant les boucles infinies
- S'assurer que le bouton "Mes flux" dans `CategoryFilter` reflète bien l'état actif par défaut pour un utilisateur connecté
- Tester que la navigation entre connexion/déconnexion bascule correctement le mode d'affichage

## Fichiers concernés
- `src/pages/Index.tsx` — logique d'état `showFollowedOnly`
- `src/components/CategoryFilter.tsx` — boutons d'affichage (vérification visuelle uniquement)