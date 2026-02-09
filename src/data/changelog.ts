export interface ChangelogEntry {
  version: string;
  date: string; // Format ISO: "2025-01-20"
  category: 'feature' | 'improvement' | 'bugfix' | 'security';
  title: string;
  description: string;
  details?: string[];
}

export const changelogData: ChangelogEntry[] = [
  {
    version: "1.13.0",
    date: "2026-02-09",
    category: "improvement",
    title: "Protection des articles non lus avec abonnement actif",
    description: "Les articles non lus appartenant à un flux suivi sont désormais protégés de la purge automatique.",
    details: [
      "Les articles épinglés restent toujours protégés",
      "Les articles non lus dont le flux a au moins un abonné sont protégés",
      "Les articles non lus sans aucun abonné sont supprimés",
      "Les articles lus non épinglés sont supprimés après 48h",
      "Mise à jour des fonctions purge_old_articles et test_purge_articles"
    ]
  },
  {
    version: "1.12.0",
    date: "2026-01-29",
    category: "improvement",
    title: "Purge optimisée des anciens articles",
    description: "Amélioration de la logique de suppression automatique pour une base de données plus légère.",
    details: [
      "Les articles lus mais non épinglés sont maintenant supprimés après 48h",
      "Seuls les articles épinglés sont protégés de la purge",
      "Suppression en cascade des interactions utilisateur avant les articles",
      "Limite de 1000 articles par exécution pour éviter les timeouts",
      "Réduction estimée de ~6 400 articles obsolètes"
    ]
  },
  {
    version: "1.11.0",
    date: "2026-01-19",
    category: "improvement",
    title: "Thème sombre amélioré et compteur d'abonnés",
    description: "Refonte du thème sombre pour une meilleure lisibilité et affichage du nombre d'abonnés par flux.",
    details: [
      "Palette de couleurs sombres plus douce (bleu-gris au lieu de noir pur)",
      "Meilleur contraste et hiérarchie visuelle des cartes",
      "Bordures plus visibles pour délimiter les éléments",
      "Toggle de thème animé avec icônes soleil/lune colorées",
      "Label textuel du mode actuel (Sombre/Clair)",
      "Nouveau compteur d'abonnés visible pour chaque flux",
      "Statistique globale du total d'abonnements",
      "Accès public aux articles pour les visiteurs non connectés"
    ]
  },
  {
    version: "1.10.0",
    date: "2026-01-16",
    category: "feature",
    title: "Thème sombre avec switch",
    description: "Ajout d'un mode sombre complet avec un switch de basculement accessible dans le header.",
    details: [
      "Composant ThemeToggle avec next-themes",
      "Switch accessible dans le header desktop et menu mobile",
      "Support du thème système par défaut",
      "Icônes dynamiques Soleil/Lune selon le thème actif",
      "Persistance du choix utilisateur dans le navigateur"
    ]
  },
  {
    version: "1.9.1",
    date: "2026-01-15",
    category: "security",
    title: "Sécurisation des tâches automatisées",
    description: "Mise en place d'une authentification sécurisée pour les cron jobs PostgreSQL.",
    details: [
      "Création de la table app_secrets pour les secrets applicatifs",
      "Protection RLS stricte (aucun accès direct possible)",
      "Authentification des fonctions trigger via x-cron-secret",
      "Lecture sécurisée des secrets via fonctions SECURITY DEFINER"
    ]
  },
  {
    version: "1.9.0",
    date: "2026-01-15",
    category: "improvement",
    title: "Automatisation des tâches planifiées",
    description: "Mise en place de cron jobs PostgreSQL pour automatiser la maintenance de la base de données.",
    details: [
      "Cron jobs PostgreSQL avec extension pg_cron",
      "Récupération automatique des flux RSS toutes les 10 minutes",
      "Purge automatique des anciens articles à 3h du matin",
      "Fonctions trigger dédiées (trigger_fetch_all_feeds, trigger_purge_articles)",
      "Rapport de purge envoyé par email aux administrateurs"
    ]
  },
  {
    version: "1.8.4",
    date: "2026-01-13",
    category: "security",
    title: "Protection renforcée des données",
    description: "Renforcement des politiques de sécurité pour protéger les données sensibles.",
    details: [
      "Authentification requise pour accéder aux articles",
      "Protection de la table super_users contre les accès directs",
      "Vérification du statut admin via fonction is_super_user()",
      "Renforcement des politiques RLS existantes"
    ]
  },
  {
    version: "1.8.3",
    date: "2026-01-06",
    category: "bugfix",
    title: "Correction de l'affichage des noms de source",
    description: "Correction du décodage HTML et de la mise en page des badges source dans les cartes d'articles.",
    details: [
      "Décodage des entités HTML dans les noms de source (ex: &#039; → ')",
      "Limitation de la largeur du badge source avec troncature",
      "Ajout d'un tooltip pour afficher le nom complet au survol",
      "Amélioration de la stabilité de la mise en page"
    ]
  },
  {
    version: "1.8.2",
    date: "2026-01-05",
    category: "improvement",
    title: "Renommage de la page Flux",
    description: "La page 'Gestion des flux' a été renommée en 'Flux disponibles' pour plus de clarté.",
    details: [
      "Nouveau titre : 'Flux disponibles'",
      "Mise à jour des liens de navigation (desktop et mobile)",
      "Sous-titre adapté pour les utilisateurs connectés"
    ]
  },
  {
    version: "1.8.1",
    date: "2025-12-20",
    category: "bugfix",
    title: "Affichage des miniatures YouTube",
    description: "Correction de l'affichage des miniatures pour les vidéos YouTube dans les cartes d'articles.",
    details: [
      "Les miniatures YouTube s'affichent maintenant dans les cartes",
      "Normalisation des types de flux RSS (rss-manual/rss-auto → rss)",
      "Icônes de catégorie correctement affichées"
    ]
  },
  {
    version: "1.8.0",
    date: "2025-12-17",
    category: "improvement",
    title: "Amélioration de la purge des articles",
    description: "Refonte de la logique de suppression automatique des anciens articles pour une meilleure rétention du contenu pertinent.",
    details: [
      "Critère basé sur last_seen_at (non vu dans le flux RSS depuis 48h)",
      "Protection de tous les articles consultés par au moins un utilisateur",
      "Suppression du critère arbitraire des 20 lectures minimum",
      "Meilleure préservation du contenu engageant"
    ]
  },
  {
    version: "1.7.0",
    date: "2025-12-03",
    category: "feature",
    title: "Pagination des articles",
    description: "Ajout d'un système de pagination sur la page d'accueil pour améliorer la navigation.",
    details: [
      "Affichage de 20 articles par page",
      "Navigation intuitive avec boutons Précédent/Suivant",
      "Indicateur de page courante et nombre total",
      "Réinitialisation automatique lors du changement de filtres",
      "Suppression des notifications 'Article marqué comme lu'"
    ]
  },
  {
    version: "1.6.0",
    date: "2025-12-03",
    category: "improvement",
    title: "Optimisations de performance",
    description: "Amélioration significative des performances et de la qualité du code.",
    details: [
      "Memoization du décodage HTML avec cache LRU",
      "Lazy loading des images pour un chargement plus rapide",
      "Suppression des logs de debug en production",
      "Amélioration du typage TypeScript",
      "Optimisation des calculs de filtres avec useMemo"
    ]
  },
  {
    version: "1.5.0",
    date: "2025-12-02",
    category: "security",
    title: "Renforcement de la sécurité RLS",
    description: "Correction et amélioration des politiques de sécurité Row Level Security.",
    details: [
      "Restriction des modifications de flux aux super-utilisateurs",
      "Protection de la table super_users contre les accès non autorisés",
      "Correction des accès null-safe sur les données utilisateur",
      "Gestion des erreurs localStorage améliorée"
    ]
  },
  {
    version: "1.4.0",
    date: "2025-01-14",
    category: "improvement",
    title: "Interface mobile optimisée et filtrage amélioré",
    description: "Refonte complète du header pour mobile avec menu hamburger et amélioration du système de filtrage des flux.",
    details: [
      "Header responsive avec menu hamburger sur mobile",
      "Navigation optimisée pour tablettes et smartphones",
      "Filtrage automatique des flux désactivés",
      "Affichage par défaut des flux suivis pour les utilisateurs connectés",
      "Amélioration de l'expérience utilisateur sur tous les écrans"
    ]
  },
  {
    version: "1.3.0",
    date: "2025-01-20",
    category: "feature",
    title: "Détection automatique de flux RSS",
    description: "Ajout d'une fonctionnalité pour détecter automatiquement les flux RSS d'un site web lors de l'ajout d'un nouveau flux.",
    details: [
      "Détection automatique des flux RSS/Atom",
      "Support de plusieurs flux sur un même site",
      "Pré-remplissage automatique du nom du site",
      "Gestion des erreurs avec messages informatifs"
    ]
  },
  {
    version: "1.2.0",
    date: "2025-01-19",
    category: "improvement",
    title: "Pages 410 Gone pour anciennes URLs",
    description: "Mise en place de redirections intelligentes et pages 410 pour améliorer le SEO et gérer les anciennes URLs indexées.",
    details: [
      "Redirections 301 pour /flux/youtube-* vers /feeds",
      "Redirections 301 pour /account/* vers /auth",
      "Page 410 Gone pour les contenus définitivement supprimés",
      "Mise à jour du robots.txt"
    ]
  },
  {
    version: "1.1.0",
    date: "2025-01-15",
    category: "improvement",
    title: "Amélioration des notifications par email",
    description: "Configuration du domaine notifications.duhaz.fr pour l'envoi d'emails de purge.",
    details: [
      "Domaine personnalisé pour les emails",
      "Amélioration de la délivrabilité",
      "Templates d'emails optimisés"
    ]
  },
  {
    version: "1.0.0",
    date: "2025-01-10",
    category: "feature",
    title: "Lancement de Feeds.Duhaz.fr",
    description: "Première version publique du site avec toutes les fonctionnalités de base.",
    details: [
      "Gestion complète des flux RSS et Atom",
      "Détection automatique des chaînes YouTube",
      "Système d'épinglage d'articles",
      "Filtres par catégorie et date",
      "Authentification utilisateur sécurisée",
      "Mode lecture avec articles lus/non lus",
      "Interface responsive et moderne",
      "Support du dark mode"
    ]
  }
];
