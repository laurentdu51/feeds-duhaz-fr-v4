

## Diagnostic

Le site reste bloqué sur "Chargement des articles..." car les requêtes vers `https://data.duhaz.fr` (REST API, Auth) reçoivent l'erreur "No API key found in request" de Kong.

Le client Supabase JS envoie automatiquement un header `apikey: <clé>` dans chaque requête. Kong attend ce header. Si Caddy ne le transmet pas correctement, Kong rejette la requête.

## Cause probable

Caddy transmet normalement tous les headers par défaut. Les causes possibles :
1. **Le Caddyfile n'est pas un simple `reverse_proxy`** — il y a peut-être un `header_up` qui filtre ou un `handle` mal configuré
2. **Caddy fait du TLS termination** mais Kong attend aussi du HTTPS en interne, causant un conflit
3. **Le path ne couvre pas toute l'API** — seuls `/functions/` est proxié, pas `/rest/`, `/auth/`, etc.

## Plan

### Etape 1 — Vérifier et corriger le Caddyfile

Ta configuration Caddy devrait ressembler à ceci pour proxier **tout** le trafic vers Kong :

```text
data.duhaz.fr {
    reverse_proxy localhost:8000
}
```

C'est tout. Pas de filtrage de headers, pas de restriction de path. Caddy gère le TLS côté externe et parle en HTTP vers Kong sur le port 8000.

Si tu as quelque chose de plus complexe (des `handle /functions/*` séparés, des `header_up -apikey`, etc.), c'est probablement la source du problème.

### Etape 2 — Tester la connectivité manuellement

Depuis ta VM, teste que Kong reçoit bien le header `apikey` :

```bash
curl -v https://data.duhaz.fr/rest/v1/ \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdHl1a3VnZWR0b2ppemdhdHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNjIxNTEsImV4cCI6MjA2NDkzODE1MX0.KflrS6WiGksws1nO8NDm5i_Dav4u2JDSuEYtEnmKCRE"
```

Si ça échoue via `data.duhaz.fr` mais fonctionne en direct sur `localhost:8000`, le problème est confirmé côté Caddy.

### Etape 3 — Alternative si le proxy reste problématique

Si corriger le proxy prend du temps, on peut adopter une approche hybride dans le code :
- Garder `SUPABASE_URL` pointant vers le cloud (`https://wftyukugedtojizgatwj.supabase.co`) pour les requêtes REST/Auth
- Utiliser `https://data.duhaz.fr` uniquement pour les appels Edge Functions (via `fetch` direct)

Cela éviterait le problème de proxy pour l'API REST tout en utilisant ta VM pour les fonctions.

### Ce qu'il faut faire maintenant

1. **Partage ton Caddyfile** (ou la partie concernant `data.duhaz.fr`) pour que je puisse identifier le problème exact
2. Ou **teste la commande curl** ci-dessus pour confirmer si le header `apikey` passe correctement

