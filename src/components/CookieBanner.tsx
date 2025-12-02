import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie-consent';

const getStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = getStorageItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setStorageItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    setStorageItem(COOKIE_CONSENT_KEY, 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5">
      <Card className="max-w-4xl mx-auto p-6 shadow-lg border-border bg-card">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              🍪 Gestion des cookies
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Nous utilisons des cookies essentiels pour assurer le fonctionnement de l'authentification 
              et mémoriser vos préférences d'interface. Aucun cookie de suivi ou publicitaire n'est utilisé.
            </p>
            <Link 
              to="/politique-cookies" 
              className="text-sm text-primary hover:underline"
            >
              En savoir plus sur notre politique de cookies
            </Link>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDecline}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-3 mt-4">
          <Button onClick={handleAccept} className="flex-1 sm:flex-none">
            Accepter
          </Button>
          <Button onClick={handleDecline} variant="outline" className="flex-1 sm:flex-none">
            Refuser
          </Button>
        </div>
      </Card>
    </div>
  );
}
