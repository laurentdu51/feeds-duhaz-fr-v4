# Debug : plus de nouveaux articles récupérés

Le cron pg_cron s'exécute, mais aucun nouvel article n'apparaît. On ne sait pas encore où ça casse. Objectif : isoler l'étape défaillante avant de corriger.

## Étapes de diagnostic (dans l'ordre)

### 1. Vérifier que pg_cron appelle bien l'edge function
Sur la base self-hosted, exécuter :
```sql
SELECT jobid, jobname, schedule, command, active
FROM cron.job;

SELECT jobid, runid, status, return_message, start_time, end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```
Objectifs :
- confirmer que le job est `active = true`
- vérifier l'URL cible (doit être `https://data.duhaz.fr/functions/v1/fetch-rss` — pas l'ancienne URL cloud)
- vérifier le header `x-cron-secret` dans le `command`
- lire `return_message` : `net.http_post` retourne un `request_id`, pas le HTTP status

Puis croiser avec `net._http_response` :
```sql
SELECT id, status_code, content_type, timed_out, error_msg, created
FROM net._http_response
ORDER BY created DESC
LIMIT 20;
```
→ Si `status_code = 401`, c'est un problème de `CRON_SECRET`. Si `404`, mauvaise URL. Si `timed_out`, connectivité base → edge.

### 2. Vérifier les logs edge de `fetch-rss`
Ouvrir les logs de la fonction sur le dashboard self-hosted. On cherche :
- des invocations récentes (fréquence = celle du cron)
- des messages `Unauthorized access attempt to fetch-rss` → cron secret mismatch
- des `SSRF blocked` → URL de flux invalide
- des `Error inserting articles` → problème GRANT sur `articles` (récurrent depuis la migration)

### 3. Vérifier le contenu de `CRON_SECRET`
Deux emplacements possibles (cf. `_shared/security.ts`) :
- variable d'env `CRON_SECRET` de la fonction edge
- table `app_secrets` avec `key = 'cron_secret'`

Le secret utilisé par pg_cron dans le header `x-cron-secret` doit être **identique**. Après la migration, il est probable que l'un des deux soit resté sur l'ancienne valeur.

### 4. Vérifier les GRANTs sur `articles`
La migration self-hosted a déjà cassé `user_articles` pour la même raison. Vérifier :
```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'articles';
```
`service_role` doit avoir `INSERT, UPDATE, SELECT`. Sinon l'edge function réussit le fetch HTTP mais échoue silencieusement (renvoie 500 masqué par le try/catch générique).

### 5. Test manuel d'une fonction
Appel direct pour isoler du cron :
```bash
curl -X POST https://data.duhaz.fr/functions/v1/fetch-rss \
  -H "x-cron-secret: <SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"feedId":"<UUID>","feedUrl":"<URL>"}'
```
Réponse attendue : `{"success":true,"articlesProcessed":N,...}`.

## Ce dont j'ai besoin de toi

Peux-tu lancer les requêtes SQL des étapes 1, 3 et 4 (ou me coller le résultat), et me dire ce que montrent les logs edge de `fetch-rss` sur les 24 dernières heures ? Avec ça je saurai précisément où corriger.

## Note technique

Pas de modif de code dans ce plan — c'est du diagnostic pur. Les corrections (GRANT manquant, secret désynchronisé, URL cron obsolète) seront traitées dans un second plan une fois la cause identifiée.
