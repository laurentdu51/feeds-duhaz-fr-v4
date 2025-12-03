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
