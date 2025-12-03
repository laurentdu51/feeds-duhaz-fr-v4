import { useState, useMemo, useEffect } from 'react';
import { categories } from '@/data/mockNews';
import { useRealArticles } from '@/hooks/useRealArticles';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { NewsItem } from '@/types/news';
import Header from '@/components/Header';
import CategoryFilter from '@/components/CategoryFilter';
import NewsCard from '@/components/NewsCard';
import AddFeedModal from '@/components/AddFeedModal';
import ArticleModal from '@/components/ArticleModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { RefreshCw, Filter, Rss, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

const ARTICLES_PER_PAGE = 20;
const Index = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | null>(null);
  const [showFollowedOnly, setShowFollowedOnly] = useState(!!user);
  const [showDiscoveryMode, setShowDiscoveryMode] = useState(false);
  const [showReadArticles, setShowReadArticles] = useState(false);

  // Handle view mode changes (followed, discovery, all)
  const handleViewModeChange = (mode: 'followed' | 'discovery' | 'all') => {
    switch (mode) {
      case 'followed':
        setShowFollowedOnly(true);
        setShowDiscoveryMode(false);
        break;
      case 'discovery':
        setShowFollowedOnly(false);
        setShowDiscoveryMode(true);
        setDateFilter(null);
        break;
      case 'all':
        setShowFollowedOnly(false);
        setShowDiscoveryMode(false);
        setDateFilter(null);
        break;
    }
  };
  const {
    articles,
    loading,
    togglePin,
    markAsRead,
    deleteArticle,
    refetch
  } = useRealArticles(dateFilter, showFollowedOnly, showReadArticles, showDiscoveryMode);
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [isAddFeedModalOpen, setIsAddFeedModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  console.log('🏠 Index page - Articles count:', articles.length, 'Loading:', loading, 'User:', !!user);
  const filteredNews = useMemo(() => {
    let filtered = articles;
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        filtered = filtered.filter(item => item.category === category.type);
      }
    }
    if (searchQuery) {
      filtered = filtered.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase()) || item.source.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [articles, selectedCategory, searchQuery]);

  // Separate pinned and regular articles
  const pinnedArticles = useMemo(() => {
    return filteredNews.filter(article => article.isPinned);
  }, [filteredNews]);

  const regularArticles = useMemo(() => {
    return filteredNews.filter(article => !article.isPinned);
  }, [filteredNews]);

  // Pagination logic
  const totalPages = Math.ceil(regularArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    return regularArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);
  }, [regularArticles, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, dateFilter, showFollowedOnly, showDiscoveryMode, showReadArticles]);

  const pinnedCount = articles.filter(item => item.isPinned).length;
  const unreadCount = articles.filter(item => !item.isRead).length;

  // Update document title with unread count
  useEffect(() => {
    const baseTitle = 'Feeds.Duhaz.fr';
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [unreadCount]);
  const handleRefresh = () => {
    refetch();
    toast.success("Flux actualisés");
  };
  const handleAddFeed = (feedData: any) => {
    console.log('Nouveau flux ajouté:', feedData);
    toast.success(`Flux "${feedData.name}" ajouté avec succès!`);
  };
  const handleOpenArticle = (article: NewsItem) => {
    setSelectedArticle(article);
    setIsArticleModalOpen(true);
  };
  const handleCloseArticleModal = () => {
    setIsArticleModalOpen(false);
    setSelectedArticle(null);
  };

  const handleSourceClick = (feedId: string, feedName: string) => {
    navigate(`/feed/${feedId}`);
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Rss className="h-6 w-6 animate-spin text-primary" />
          <p>Chargement des articles...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} pinnedCount={pinnedCount} />
      
      <main className="container mx-auto px-4 py-6">
        {/* Message pour les utilisateurs non connectés */}
        {!user && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              Vous consultez les articles en mode visiteur. 
              <Link to="/auth" className="font-semibold text-blue-600 hover:text-blue-800 ml-1">
                Connectez-vous
              </Link> pour gérer vos flux et marquer vos articles préférés.
            </p>
          </div>
        )}

        {/* Message pour les utilisateurs connectés sans articles suivis */}
        {user && articles.length === 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800">
              Vous ne suivez aucun flux RSS pour le moment. 
              <Link to="/feeds" className="font-semibold text-amber-600 hover:text-amber-800 ml-1">
                Ajoutez des flux
              </Link> pour commencer à voir des articles.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Desktop only */}
          {!isMobile && (
            <div className={`lg:col-span-1 space-y-6 ${!showFilters && 'hidden lg:block'}`}>
              <CategoryFilter 
                categories={categories} 
                selectedCategory={selectedCategory} 
                onCategoryChange={setSelectedCategory} 
                newsCount={articles.length} 
                pinnedCount={pinnedCount} 
                articles={articles}
                pinnedArticles={pinnedArticles}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                showFollowedOnly={showFollowedOnly}
                showDiscoveryMode={showDiscoveryMode}
                onViewModeChange={handleViewModeChange}
                showReadArticles={showReadArticles}
                onShowReadArticlesChange={setShowReadArticles}
                onTogglePin={togglePin}
                onMarkAsRead={markAsRead}
                onDeleteArticle={deleteArticle}
                onOpenArticle={handleOpenArticle}
              />
              
              <div className="bg-card border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Statistiques</h3>
                <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Articles non lus</span>
                              <Badge variant="outline">{unreadCount}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Articles totaux</span>
                              <Badge variant="outline">{articles.length}</Badge>
                            </div>
                  {user && <div className="flex justify-between">
                      <span className="text-muted-foreground">Épinglés</span>
                      <Badge variant="secondary">{pinnedCount}</Badge>
                    </div>}
                </div>
              </div>
            </div>
          )}
          
          {/* Main content */}
          <div className={`${isMobile ? 'col-span-1' : 'lg:col-span-3'} space-y-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">
                  {showReadArticles ? 'Tous les articles' : (user ? 'Articles non lus' : 'Derniers articles')}
                </h2>
                
              </div>
              
              <div className="flex items-center gap-2">
                {/* Mobile Filter Drawer */}
                {isMobile && (
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filtres
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <div className="p-4 space-y-6">
                        <CategoryFilter 
                          categories={categories} 
                          selectedCategory={selectedCategory} 
                          onCategoryChange={setSelectedCategory} 
                          newsCount={articles.length} 
                          pinnedCount={pinnedCount} 
                          articles={articles}
                          pinnedArticles={pinnedArticles}
                          dateFilter={dateFilter}
                          onDateFilterChange={setDateFilter}
                          showFollowedOnly={showFollowedOnly}
                          showDiscoveryMode={showDiscoveryMode}
                          onViewModeChange={handleViewModeChange}
                          showReadArticles={showReadArticles}
                          onShowReadArticlesChange={setShowReadArticles}
                          onTogglePin={togglePin}
                          onMarkAsRead={markAsRead}
                          onDeleteArticle={deleteArticle}
                          onOpenArticle={handleOpenArticle}
                        />
                        
                        <div className="bg-card border rounded-lg p-4 space-y-3">
                          <h3 className="font-semibold text-sm">Statistiques</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Articles non lus</span>
                              <Badge variant="outline">{unreadCount}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Articles totaux</span>
                              <Badge variant="outline">{articles.length}</Badge>
                            </div>
                            {user && <div className="flex justify-between">
                                <span className="text-muted-foreground">Épinglés</span>
                                <Badge variant="secondary">{pinnedCount}</Badge>
                              </div>}
                          </div>
                        </div>
                      </div>
                    </DrawerContent>
                  </Drawer>
                )}
                
                {/* Desktop Filter Toggle - keep existing logic */}
                {!isMobile && (
                  <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="lg:hidden gap-2">
                    <Filter className="h-4 w-4" />
                    Filtres
                  </Button>
                )}
                
                <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </Button>
              </div>
            </div>
            
            {regularArticles.length === 0 && articles.length > 0 ? <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Aucun article trouvé avec ces filtres</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Essayez de modifier vos filtres ou votre recherche
                </p>
                {pinnedArticles.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ({pinnedArticles.length} article{pinnedArticles.length > 1 ? 's' : ''} épinglé{pinnedArticles.length > 1 ? 's' : ''} dans la sidebar)
                  </p>
                )}
              </div> : regularArticles.length === 0 ? <div className="text-center py-12">
                <Rss className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">Aucun article non lu disponible</p>
                <p className="text-sm text-muted-foreground mt-2 mb-4">
                  {user ? 'Bravo ! Tous vos articles sont lus ou suivez des flux RSS pour voir des articles ici' : 'Aucun article public disponible pour le moment'}
                </p>
                {pinnedArticles.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-4">
                    ({pinnedArticles.length} article{pinnedArticles.length > 1 ? 's' : ''} épinglé{pinnedArticles.length > 1 ? 's' : ''} dans la sidebar)
                  </p>
                )}
                {user && <div className="flex gap-2 justify-center">
                    <Link to="/feeds">
                      <Button variant="outline">
                        Gérer les flux
                      </Button>
                    </Link>
                    <Button onClick={() => setIsAddFeedModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un flux
                    </Button>
                  </div>}
              </div> : <div className="space-y-4">
                {paginatedArticles.map(item => <NewsCard key={item.id} news={item} onTogglePin={togglePin} onMarkAsRead={markAsRead} onDelete={deleteArticle} onOpenArticle={handleOpenArticle} onSourceClick={handleSourceClick} isDiscoveryMode={showDiscoveryMode} />)}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination className="mt-8">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                        .map((page, index, array) => (
                          <>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <PaginationItem key={`ellipsis-${page}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
                
                {/* Info pagination */}
                {totalPages > 1 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Page {currentPage} sur {totalPages} ({regularArticles.length} articles)
                  </p>
                )}
              </div>}
          </div>
        </div>
      </main>

      {/* Modals */}
      {user && <AddFeedModal isOpen={isAddFeedModalOpen} onClose={() => setIsAddFeedModalOpen(false)} onAddFeed={handleAddFeed} categories={categories} />}

      <ArticleModal isOpen={isArticleModalOpen} onClose={handleCloseArticleModal} article={selectedArticle} />
    </div>;
};
export default Index;