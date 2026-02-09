

## Proteger les articles non lus des abonnements actifs

### Nouvelle regle de purge

| Statut | Abonnement actif | Action |
|--------|-------------------|--------|
| Epingle | Peu importe | Protege |
| Non lu + Non epingle | Oui (au moins 1 abonne) | Protege |
| Non lu + Non epingle | Non (aucun abonne) | Supprime |
| Lu + Non epingle | Peu importe | Supprime |

### Impact estime (donnees actuelles)

| Metrique | Valeur |
|----------|--------|
| Articles eligibles (> 48h) | 103 |
| Epingles (proteges) | 9 |
| Non lus avec abonnement (proteges) | 4 |
| Non lus sans abonnement (supprimes) | 0 |
| Lus non epingles (supprimes) | 90 |
| **Total supprime** | **~90** |

### Details techniques

**Migration SQL** - Mise a jour de `purge_old_articles` et `test_purge_articles` :

La condition de protection passe de :
```text
NOT EXISTS (is_pinned = true)
```
A :
```text
NOT EXISTS (is_pinned = true)
AND NOT (article non lu ET feed a au moins un abonne)
```

Concretement, un article est supprime si :
1. `last_seen_at` depasse 48h
2. Il n'est epingle par personne
3. ET il est soit lu par au moins un utilisateur, soit son flux n'a aucun abonne actif

La fonction `test_purge_articles` sera aussi mise a jour pour refleter cette logique.

### Fichiers modifies

- **Migration SQL** : nouvelle fonction `purge_old_articles` et `test_purge_articles`
- **src/data/changelog.ts** : ajout d'une entree pour documenter le changement
- **.lovable/plan.md** : mise a jour de la documentation

