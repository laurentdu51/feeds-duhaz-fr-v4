## Objectif

Unifier tous les filtres de la sidebar dans une seule zone visuelle cohérente, sans séparateurs ni sous-blocs distincts.

## État actuel

Le composant `CategoryFilter.tsx` affiche actuellement deux zones distinctes séparées par un `border-t` :
1. **Filtres par type de flux** (Toutes, RSS, YouTube, etc.) en colonne pleine largeur
2. **Sous-blocs hétérogènes** (Affichage / Articles lus / Période) en `flex-wrap` avec leurs propres en-têtes
3. **Articles épinglés** en pleine largeur en bas

Chaque sous-bloc a son propre titre + icône, ce qui crée du bruit visuel.

## Proposition

Regrouper tous les filtres dans une **seule section unifiée** avec :

- Un seul en-tête `Filter` + "Filtres" en haut
- Une seule grille verticale de groupes de boutons, sans `border-t` ni `flex-wrap` horizontal
- Chaque groupe (Type de flux, Affichage, Articles lus, Période) devient une simple ligne de label discret + boutons en dessous, espacés uniformément (`space-y-4`)
- Articles épinglés restent en bas dans la même carte, séparés uniquement par un fin `border-t` (ou un petit espace) puisqu'ils sont d'une nature différente (contenu vs filtres)

```text
┌─ Filtres ─────────────────┐
│  Type de flux             │
│  [Toutes] [RSS] [YT]...   │
│                           │
│  Affichage                │
│  [Mes flux] [Découverte]  │
│                           │
│  Articles lus             │
│  [Afficher les lus]       │
│                           │
│  Période                  │
│  [Tous] [Auj] [Hier]      │
├───────────────────────────┤
│  Articles épinglés (3)    │
│  • article 1              │
│  • article 2              │
│  • article 3              │
└───────────────────────────┘
```

## Détails techniques (`src/components/CategoryFilter.tsx`)

- Supprimer le `border-t` et la structure `flex flex-wrap items-start gap-4` qui isole les sous-blocs
- Remplacer par un simple `space-y-4` vertical
- Uniformiser les en-têtes de groupe : petit label en `text-xs uppercase tracking-wide text-muted-foreground` au lieu d'icône + texte plus gros, pour réduire le poids visuel
- Garder l'en-tête principal "Filtres" en haut de la carte
- Catégories (type de flux) deviennent un groupe parmi les autres au lieu d'avoir un statut spécial
- Articles épinglés gardent leur séparateur `border-t` car c'est du contenu, pas un filtre
- Aucune modification de logique : props, états et callbacks inchangés

Aucun changement dans `Index.tsx` ni `Header.tsx`.
