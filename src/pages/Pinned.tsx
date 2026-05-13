import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pin, ArrowLeft } from "lucide-react";
import { useRealArticles } from "@/hooks/useRealArticles";
import { useAuth } from "@/hooks/useAuth";
import NewsCard from "@/components/NewsCard";
import ArticleModal from "@/components/ArticleModal";
import { NewsItem } from "@/types/news";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

const Pinned = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { articles, loading, togglePin, markAsRead, deleteArticle } = useRealArticles();
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  // Redirect if not authenticated
  if (!user) {
    navigate("/auth");
    return null;
  }

  // Filter only pinned articles
  const pinnedArticles = articles.filter(article => article.isPinned);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Articles épinglés - Feeds.Duhaz.fr"
        description="Retrouvez tous vos articles favoris épinglés au même endroit pour les consulter ou les partager plus tard."
        canonical="https://feeds.duhaz.fr/pinned"
      />
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              aria-label="Retour à l'accueil"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Pin className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Articles épinglés</h1>
              {pinnedArticles.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {pinnedArticles.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {pinnedArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Pin className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Aucun article épinglé</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Vous n'avez pas encore épinglé d'articles. Épinglez vos articles préférés depuis la page principale pour les retrouver facilement ici.
            </p>
            <Button onClick={() => navigate("/")} variant="default">
              Retour à l'accueil
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pinnedArticles.map((article) => (
              <NewsCard
                key={article.id}
                news={article}
                onTogglePin={togglePin}
                onMarkAsRead={markAsRead}
                onDelete={deleteArticle}
                onOpenArticle={setSelectedArticle}
              />
            ))}
          </div>
        )}
      </main>

      {/* Article Modal */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          isOpen={!!selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
};

export default Pinned;
