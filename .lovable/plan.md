# Plan terminé ✅

## Modification de la purge des articles

La migration a été appliquée avec succès le 2026-01-29.

### Nouvelle logique

- **Supprimer** : Articles non vus dans les flux depuis 48h+ ET non épinglés
- **Protéger** : Uniquement les articles épinglés

### Résultat du test

| Métrique | Valeur |
|----------|--------|
| Articles éligibles à la suppression | 6 458 |
| Plus ancien article | 2025-12-16 |
| Plus récent article éligible | 2026-01-27 |

La prochaine exécution du cron job (3h du matin) supprimera jusqu'à 1000 articles par batch.
