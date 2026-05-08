## Contexte et limitation

Tu as choisi : **endpoint JSON séparé**, hébergé **dans le projet Lovable uniquement**. Or le sandbox Lovable n'expose qu'**un seul port** (Vite, 8080) — impossible d'y lancer un second serveur Node/Deno sur un autre port accessible publiquement.

Deux contournements possibles dans le cadre Lovable seul :

### Option A (recommandée) — Route dédiée `/health` servie en JSON par Vite

Une route React `/health` qui :
- effectue un `fetch` vers `https://data.duhaz.fr/rest/v1/` avec le header `apikey`
- mesure la latence
- retourne un rendu JSON brut (via `<pre>` + `Content-Type` simulé) ou un petit dashboard visuel
- accessible sur le **même port** que l'app : `https://feeds.duhaz.fr/health`

Avantage : 100% dans Lovable, déployable immédiatement, monitorable par UptimeRobot (qui sait parser du HTML/regex).

### Option B — "Autre port" simulé via sous-chemin

Vite ne peut pas écouter sur 2 ports, mais on peut réserver un préfixe `/_health/*` distinct du reste de l'app (sans header, sans layout) pour bien isoler le endpoint monitoring du reste de l'UI.

---

## Plan proposé (Option A)

### 1. Nouvelle page `src/pages/Health.tsx`
- Effectue au montage un `fetch('https://data.duhaz.fr/rest/v1/', { headers: { apikey: ANON_KEY } })`
- Mesure le temps de réponse (`performance.now()`)
- État local : `{ status: 'ok'|'degraded'|'down', latencyMs, httpCode, checkedAt }`
- Affichage : un bloc `<pre>` contenant le JSON formaté, fond neutre, sans Header/Footer
- Refresh auto toutes les 30s
- Code HTTP visuel : badge vert (200/401 = service répond) / rouge (timeout, 5xx)

### 2. Route ajoutée dans `src/App.tsx`
```
<Route path="/health" element={<Health />} />
```
Placée avant le catch-all `*`.

### 3. Aucune modification backend
Pas de nouvelle edge function, pas de changement Supabase.

### 4. Détails techniques
- Réutilise la constante `SUPABASE_PUBLISHABLE_KEY` exportée depuis `src/integrations/supabase/client.ts` (à exporter si pas déjà fait)
- Timeout de 5s via `AbortController`
- Format JSON de sortie :
  ```json
  {
    "status": "ok",
    "checks": {
      "supabase_rest": { "ok": true, "httpCode": 200, "latencyMs": 87 }
    },
    "checkedAt": "2026-05-08T..."
  }
  ```
- Pas d'auth requise pour accéder à la page

---

## Si tu veux vraiment un vrai second port

Il faudra héberger un mini service ailleurs (ta VM avec Caddy, ou une edge function `health` sur data.duhaz.fr). Dis-le moi et je revois le plan.