import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <SEO
        title="Page non trouvée - 404"
        description="La page que vous recherchez n'existe pas."
        canonical={`https://feeds.duhaz.fr${location.pathname}`}
      />
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
          <p className="text-xl text-muted-foreground mb-4">Page non trouvée</p>
          <Link to="/" className="text-primary hover:text-primary/90 underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;
