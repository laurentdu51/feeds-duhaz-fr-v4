
Objectif
- Fiabiliser l’authentification des Edge Functions sur ta VM Supabase self-hosted et corriger le test `update-feed`.

Constat confirmé dans le code
- `update-feed` accepte bien 3 accès: `x-cron-secret`, `service_role`, ou super-user.
- Le vrai point faible est dans `supabase/functions/_shared/security.ts`: `validateCronSecret()` ne lit que `Deno.env.get('CRON_SECRET')`.
- En parallèle, les jobs SQL du projet lisent le secret depuis `public.app_secrets` avec la clé `cron_secret`.
- Donc sur ta VM, si `CRON_SECRET` n’est pas injecté dans le runtime Edge Functions, ton header `x-cron-secret` sera refusé même si la valeur est correcte côté base.
- Ta commande de test a aussi une payload incorrecte: `update-feed` attend `feedId` et `url`, pas `name`.

Plan d’implémentation
1. Unifier la source du cron secret
   - Faire évoluer `validateCronSecret` pour vérifier d’abord `CRON_SECRET` dans l’environnement.
   - Si absent, fallback sécurisé vers `public.app_secrets` via un client `service_role`.
   - Conserver un comportement “fail closed” si aucun secret n’est disponible.

2. Mettre à jour les fonctions impactées
   - Adapter les appels à `validateCronSecret` dans :
     - `supabase/functions/update-feed/index.ts`
     - `supabase/functions/fetch-rss/index.ts`
     - `supabase/functions/purge-articles/index.ts`
   - Passer le helper en asynchrone et harmoniser les messages de logs.

3. Améliorer le diagnostic self-hosted
   - Ajouter des logs distincts pour :
     - secret absent dans l’environnement
     - secret absent en base
     - secret présent mais invalide
   - Cela permettra d’identifier immédiatement si le problème vient de la VM ou de la requête.

4. Ajouter une couverture de test
   - Cas 1: `CRON_SECRET` présent dans l’environnement
   - Cas 2: fallback `app_secrets`
   - Cas 3: token `anon` + bon `x-cron-secret` = autorisé
   - Cas 4: secret manquant/invalide = 401

5. Corriger la documentation de test
   - Documenter la vraie payload de `update-feed` :
```bash
curl -L -X POST 'http://192.168.1.244:8000/functions/v1/update-feed' \
  -H 'Authorization: Bearer <ANON_OU_SERVICE_ROLE>' \
  -H 'x-cron-secret: <CRON_SECRET>' \
  -H 'Content-Type: application/json' \
  --data '{"feedId":"<FEED_ID>","url":"<FEED_URL>"}'
```
   - Préciser que sans fallback, il faut absolument définir `CRON_SECRET` dans le runtime Edge de la VM.

Détails techniques
- Fichiers principaux à modifier :
  - `supabase/functions/_shared/security.ts`
  - `supabase/functions/update-feed/index.ts`
  - `supabase/functions/fetch-rss/index.ts`
  - `supabase/functions/purge-articles/index.ts`
- Cause racine la plus probable :
  - le runtime Edge self-hosted n’a pas `CRON_SECRET`
  - alors que la base utilise déjà `public.app_secrets`
- Résultat attendu :
  - tes appels curl avec `x-cron-secret` fonctionneront sur la VM même si le secret n’est stocké qu’en base
  - le prochain éventuel blocage sera la validation des champs `feedId` et `url`, pas l’authentification
