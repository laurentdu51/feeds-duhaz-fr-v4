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
