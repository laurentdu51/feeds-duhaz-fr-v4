# Test manuel guidé — iOS 12.5 (Safari 12)

À dérouler sur un appareil iOS 12.5 réel (ou simulateur Xcode « iOS 12.4 / Safari 12 »)
sur l'URL de preview, **avant** chaque republication.

| # | Étape | Attendu |
|---|-------|---------|
| 1 | Vider les données du site (Réglages > Safari > Avancé > Données) | Aucun jeton de session obsolète |
| 2 | Ouvrir la page d'accueil `/` | Liste d'articles affichée, pas d'écran blanc |
| 3 | Ouvrir la console Web Inspector (Mac connecté en USB) | Aucune `SyntaxError` / `Unexpected token` |
| 4 | Se connecter via `/auth` | Redirection OK, bascule automatique sur « Mes flux » |
| 5 | Ouvrir un article (modal) puis fermer avec la croix | Modal fluide, fermeture OK |
| 6 | Épingler un article, aller sur `/pinned` puis recharger (hard refresh) | Article présent, pas d'erreur de session |
| 7 | Marquer un article comme lu | État persistant après rechargement |
| 8 | Basculer les filtres (Tous les flux / Mes flux / Découverte) | Chargement sans erreur |
| 9 | Ouvrir `/health` | JSON de statut avec API joignable |
| 10 | Passer en mode sombre / clair | Contrastes corrects sur les boutons actifs |

Si une étape échoue : ne pas republier, corriger d'abord puis relancer
`node scripts/check-ios12.mjs`.
