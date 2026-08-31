# Corriger le démarrage sur iOS 12.5

## Diagnostic
Le bundle de compatibilité Safari 12 est déjà configuré. L’erreur actuelle vient de l’authentification : iOS conserve un ancien jeton de session devenu invalide après la migration du backend (`refresh_token_not_found`). La restauration de session échoue au démarrage et n’est pas récupérée par le hook actuel.

## Modifications
- Versionner la clé de stockage locale de la session afin d’ignorer définitivement les anciens jetons incompatibles.
- Rendre l’initialisation de l’authentification tolérante aux sessions invalides : revenir proprement à l’état déconnecté au lieu de laisser une promesse rejetée.
- Conserver le bundle legacy Safari 12 existant et vérifier que la compilation génère toujours les scripts `nomodule`.

## Effet utilisateur
Les appareils possédant l’ancienne session seront déconnectés une seule fois et pourront se reconnecter normalement. Les sessions créées ensuite resteront persistantes.
