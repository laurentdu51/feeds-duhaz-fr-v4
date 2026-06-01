# Correctif : « Marquer lu » ne fonctionne pas

## Diagnostic

Le clic sur « Marquer lu » appelle `markAsRead` dans `src/hooks/useRealArticles.tsx` (ligne 335), qui fait un `upsert` sur `public.user_articles`. Côté schéma :

- La RLS est bien activée et il existe une politique `FOR ALL TO authenticated USING (auth.uid() = user_id)` (migration `20250611112005`).
- **Mais aucune migration ne fait de `GRANT` sur `public.user_articles`.**

Sur l'instance self-hébergée (`data.duhaz.fr`), PostgREST n'accorde **pas** les privilèges par défaut sur le schéma `public` aux rôles `anon`/`authenticated`. Sans `GRANT`, l'upsert échoue silencieusement (le `markAsRead` actuel ne fait que `console.error` sans toast → l'UI ne change pas, l'utilisateur a l'impression que rien ne se passe). C'est cohérent avec la règle déjà mémorisée pour ce projet (« Data API ne grant plus le schéma public par défaut »).

Les autres opérations (`togglePin`, `deleteArticle`) sont impactées par le même problème, même si elles affichent un toast d'erreur générique.

## Changements

**Nouvelle migration** : ajouter les `GRANT` manquants pour `public.user_articles`.

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_articles TO authenticated;
GRANT ALL ON public.user_articles TO service_role;
```

Pas de `GRANT` à `anon` (table strictement réservée à l'utilisateur connecté, comme indiqué dans la mémoire `rls-article-access`).

## Vérification

- Recharger l'app, cliquer sur « Marquer lu » sur un article → l'article disparaît (ou passe en grisé en mode « Lus inclus »), pas d'erreur réseau 401/permission denied sur `/rest/v1/user_articles`.
- `Épingler` et `Supprimer` continuent de fonctionner sans toast d'erreur.
