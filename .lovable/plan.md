

## Problème

La fonction `update-feed` n'accepte que l'authentification via un JWT utilisateur vérifié comme super-utilisateur. Elle ne supporte pas le `x-cron-secret` ni la détection d'appel interne (service_role key), contrairement à `fetch-rss` et `purge-articles`.

Sur ton instance self-hosted, tu n'as pas de session utilisateur active, donc `verifySuperUser()` échoue systématiquement.

## Solution

Aligner `update-feed` sur le même modèle d'authentification que `purge-articles` et `fetch-rss` : accepter le cron secret, les appels internes (service_role), **ou** un super-utilisateur authentifié.

## Modification

**Fichier : `supabase/functions/update-feed/index.ts`**

1. Ajouter les imports `validateCronSecret` et `isInternalCall` depuis `_shared/security.ts`
2. Ajouter `x-cron-secret` dans les headers CORS autorisés
3. Remplacer le bloc d'authentification pour accepter 3 méthodes :
   - `validateCronSecret(req)` — pour les appels cron/curl avec header `x-cron-secret`
   - `isInternalCall(req)` — pour les appels avec le `service_role` key
   - `verifySuperUser(req)` — pour les utilisateurs connectés (existant)

La commande curl fonctionnera ensuite avec soit le `x-cron-secret`, soit le `service_role` key en Bearer token.

