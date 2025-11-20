import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { SEO } from '@/components/SEO';

export default function PolitiqueCookies() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Politique de cookies - Feeds.Duhaz.fr"
        description="Découvrez quels cookies nous utilisons et comment nous respectons votre vie privée sur Feeds.Duhaz.fr"
        canonical="https://feeds.duhaz.fr/politique-cookies"
      />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          asChild
          className="mb-6"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Politique de cookies
            </h1>
            <p className="text-muted-foreground">
              Dernière mise à jour : 18 novembre 2025
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Qu'est-ce qu'un cookie ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Un cookie est un petit fichier texte stocké sur votre appareil lors de votre visite sur un site web. 
                Les cookies permettent au site de mémoriser certaines informations sur votre visite.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies utilisés sur Feeds.Duhaz.fr</CardTitle>
              <CardDescription>
                Nous utilisons uniquement des cookies essentiels au fonctionnement du site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  1. Cookies d'authentification (Supabase)
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Finalité :</strong> Gérer votre session de connexion et maintenir votre authentification</p>
                  <p><strong>Durée :</strong> Session ou jusqu'à expiration du token (définie par Supabase)</p>
                  <p><strong>Type :</strong> Cookie essentiel - requis pour le fonctionnement du site</p>
                  <p><strong>Données stockées :</strong> Token d'authentification, identifiant de session</p>
                  <p><strong>Fournisseur :</strong> Supabase (hébergement sécurisé)</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  2. Cookie de préférence d'interface
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Nom :</strong> sidebar:state</p>
                  <p><strong>Finalité :</strong> Mémoriser l'état (ouvert/fermé) de la barre latérale</p>
                  <p><strong>Durée :</strong> 7 jours</p>
                  <p><strong>Type :</strong> Cookie fonctionnel - améliore votre expérience utilisateur</p>
                  <p><strong>Données stockées :</strong> État de la barre latérale (true/false)</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  3. Cookie de consentement
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Nom :</strong> cookie-consent</p>
                  <p><strong>Finalité :</strong> Mémoriser votre choix concernant l'acceptation des cookies</p>
                  <p><strong>Durée :</strong> Permanent (localStorage)</p>
                  <p><strong>Type :</strong> Cookie essentiel</p>
                  <p><strong>Données stockées :</strong> Votre consentement (accepted/declined)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies non utilisés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Nous <strong>n'utilisons pas</strong> de cookies de :
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                <li>Suivi publicitaire</li>
                <li>Analytics ou statistiques</li>
                <li>Réseaux sociaux tiers</li>
                <li>Marketing ou ciblage</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestion de vos cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Vous pouvez à tout moment supprimer les cookies stockés sur votre navigateur via les paramètres de celui-ci :
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies</li>
                <li><strong>Firefox :</strong> Paramètres → Vie privée et sécurité → Cookies</li>
                <li><strong>Safari :</strong> Préférences → Confidentialité → Gérer les données</li>
                <li><strong>Edge :</strong> Paramètres → Cookies et autorisations du site</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                ⚠️ Attention : La suppression des cookies d'authentification vous déconnectera du site.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conformité RGPD</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground">
                Conformément au Règlement Général sur la Protection des Données (RGPD), nous vous informons 
                de l'utilisation de cookies essentiels et fonctionnels sur notre site.
              </p>
              <p className="text-muted-foreground">
                Ces cookies étant strictement nécessaires au fonctionnement du service ou améliorant uniquement 
                votre expérience utilisateur sans tracer votre navigation, leur utilisation ne nécessite pas 
                de consentement préalable selon l'article 82 de la loi Informatique et Libertés.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Pour toute question concernant notre politique de cookies, vous pouvez nous contacter 
                via les informations disponibles sur notre site.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
