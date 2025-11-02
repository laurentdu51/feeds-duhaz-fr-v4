import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/components/SEO";

const Gone = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn(
      "410 Gone: User attempted to access permanently removed content:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <SEO
        title="Contenu supprimé - 410 Gone"
        description="Cette page n'existe plus. Le contenu a été définitivement supprimé ou déplacé."
        canonical={`https://feeds.duhaz.fr${location.pathname}`}
      />
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-2xl px-4">
          <h1 className="text-6xl font-bold mb-4 text-foreground">410</h1>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Contenu définitivement supprimé
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Cette page n'existe plus. Le contenu a été supprimé ou déplacé
            suite à une refonte du site.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              Accueil
            </Link>
            <Link
              to="/feeds"
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition"
            >
              Gérer mes flux
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Gone;
