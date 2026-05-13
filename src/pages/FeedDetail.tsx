import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFeedArticles } from '@/hooks/useFeedArticles';
import NewsCard from '@/components/NewsCard';
import ArticleModal from '@/components/ArticleModal';
import { NewsItem } from '@/types/news';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { SEO } from '@/components/SEO';

const FeedDetail = () => {
  const { feedId } = useParams<{ feedId: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  
  const {
    articles,
    feedInfo,
    loading,
    totalCount,
    totalPages,
    togglePin,
    markAsRead,
    deleteArticle
  } = useFeedArticles(feedId || '', currentPage);

  const handleOpenArticle = (article: NewsItem) => {
    setSelectedArticle(article);
  };

  const handleCloseArticleModal = () => {
    setSelectedArticle(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis or pages around current
      if (currentPage > 3) {
        items.push(<PaginationEllipsis key="ellipsis-1" />);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(<PaginationEllipsis key="ellipsis-2" />);
      }

      // Always show last page
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!feedInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Flux introuvable</h1>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${feedInfo.name} - Feeds.Duhaz.fr`}
        description={feedInfo.description || `Tous les articles du flux ${feedInfo.name} agrégés sur Feeds.Duhaz.fr.`}
        canonical={`https://feeds.duhaz.fr/feed/${feedId}`}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button and feed info */}
        <div className="mb-8 space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">{feedInfo.name}</h1>
            {feedInfo.description && (
              <p className="text-muted-foreground">{feedInfo.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {totalCount} article{totalCount > 1 ? 's' : ''} au total
            </p>
          </div>
        </div>

        {/* Articles grid */}
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucun article disponible pour ce flux</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 mb-8">
              {articles.map((article) => (
                <NewsCard
                  key={article.id}
                  news={article}
                  onTogglePin={togglePin}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteArticle}
                  onOpenArticle={handleOpenArticle}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {renderPaginationItems()}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Article Modal */}
      <ArticleModal
        article={selectedArticle}
        isOpen={!!selectedArticle}
        onClose={handleCloseArticleModal}
      />
    </div>
  );
};

export default FeedDetail;
