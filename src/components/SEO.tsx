import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

/**
 * SEO Component - Dynamically updates meta tags for each page
 * Usage: <SEO title="Page Title" description="Page description" />
 */
export const SEO = ({ 
  title = 'Feeds.Duhaz.fr - Agrégateur de flux RSS personnalisé',
  description = "Votre flux d'informations personnalisé, simplifié. Agrégez vos flux RSS, YouTube et actualités préférés en un seul endroit.",
  keywords = 'RSS, agrégateur, flux d\'informations, actualités, news feed, personnalisé, YouTube, agrégateur RSS',
  ogImage = 'https://feeds.duhaz.fr/favicon.ico',
  canonical
}: SEOProps) => {
  const location = useLocation();
  const currentUrl = `https://feeds.duhaz.fr${location.pathname}`;
  const canonicalUrl = canonical || currentUrl;

  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Update standard meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Update Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:image', ogImage, true);

    // Update Twitter tags
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:url', currentUrl);
    updateMetaTag('twitter:image', ogImage);

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);
  }, [title, description, keywords, ogImage, currentUrl, canonicalUrl]);

  return null;
};
