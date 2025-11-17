
import { NewsCategory } from '@/types/news';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Rss, 
  Play, 
  Gamepad2, 
  Newspaper,
  Filter,
  Pin,
  Calendar,
  Clock,
  Heart,
  Eye,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NewsItem } from '@/types/news';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface CategoryFilterProps {
  categories: NewsCategory[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  newsCount: number;
  pinnedCount?: number;
  articles: any[]; // Add articles to calculate counts per category
  pinnedArticles?: NewsItem[]; // Pinned articles to display
  dateFilter?: 'today' | 'yesterday' | null;
  onDateFilterChange?: (filter: 'today' | 'yesterday' | null) => void;
  showFollowedOnly?: boolean;
  showDiscoveryMode?: boolean;
  onViewModeChange?: (mode: 'followed' | 'discovery' | 'all') => void;
  showReadArticles?: boolean;
  onShowReadArticlesChange?: (showReadArticles: boolean) => void;
  onTogglePin?: (articleId: string) => void;
  onMarkAsRead?: (articleId: string) => void;
  onDeleteArticle?: (articleId: string) => void;
  onOpenArticle?: (article: NewsItem) => void;
}

const iconMap = {
  rss: Rss,
  play: Play,
  'gamepad-2': Gamepad2,
  newspaper: Newspaper,
};

const CategoryFilter = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  newsCount,
  pinnedCount = 0,
  articles,
  pinnedArticles = [],
  dateFilter,
  onDateFilterChange,
  showFollowedOnly,
  showDiscoveryMode,
  onViewModeChange,
  showReadArticles,
  onShowReadArticlesChange,
  onTogglePin,
  onMarkAsRead,
  onDeleteArticle,
  onOpenArticle
}: CategoryFilterProps) => {
  const { user } = useAuth();
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(true);

  // Calculate count for each category
  const getCategoryCount = (categoryType: string) => {
    return articles.filter(article => article.category === categoryType).length;
  };

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Filtrer par type de flux</h2>
      </div>
      
      <div className="space-y-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          className="w-full justify-start gap-2"
          onClick={() => onCategoryChange(null)}
        >
          <span>Toutes</span>
          <Badge variant="secondary" className="ml-auto">
            {newsCount}
          </Badge>
        </Button>
        
        {categories.map((category) => {
          const IconComponent = iconMap[category.icon as keyof typeof iconMap];
          const isSelected = selectedCategory === category.id;
          const categoryCount = getCategoryCount(category.type);
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              className="w-full justify-start gap-2"
              onClick={() => onCategoryChange(category.id)}
            >
              <IconComponent className="h-4 w-4" />
              <span>{category.name}</span>
              <Badge variant="secondary" className="ml-auto">
                {categoryCount}
              </Badge>
            </Button>
          );
        })}
      </div>
      
      {(onDateFilterChange || (user && onViewModeChange) || user) && (
        <div className="pt-4 border-t space-y-3">
          <div className="flex flex-wrap items-start gap-4">
            
            {/* Section 1: Filtres d'affichage */}
            {user && onViewModeChange && (
              <div className="flex flex-col gap-2 min-w-fit">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Affichage</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={showFollowedOnly ? "default" : "outline"}
                    size="sm"
                    className="justify-start gap-2 whitespace-nowrap"
                    onClick={() => onViewModeChange('followed')}
                  >
                    <Heart className="h-3 w-3" />
                    Mes flux
                  </Button>
                  <Button
                    variant={showDiscoveryMode ? "default" : "outline"}
                    size="sm"
                    className="justify-start gap-2 whitespace-nowrap"
                    onClick={() => onViewModeChange('discovery')}
                  >
                    <Rss className="h-3 w-3" />
                    Découverte
                  </Button>
                  <Button
                    variant={!showFollowedOnly && !showDiscoveryMode ? "default" : "outline"}
                    size="sm"
                    className="justify-start gap-2 whitespace-nowrap"
                    onClick={() => onViewModeChange('all')}
                  >
                    Tous les flux
                  </Button>
                </div>
              </div>
            )}

            {/* Section 1b: Articles lus */}
            {user && onShowReadArticlesChange && (
              <div className="flex flex-col gap-2 min-w-fit">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Articles lus</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={showReadArticles ? "default" : "outline"}
                    size="sm"
                    className="justify-start gap-2 whitespace-nowrap"
                    onClick={() => onShowReadArticlesChange(!showReadArticles)}
                  >
                    <Eye className="h-3 w-3" />
                    {showReadArticles ? 'Masquer les lus' : 'Afficher les lus'}
                  </Button>
                </div>
              </div>
            )}

            {/* Section 2: Filtres de date - Only show for followed feeds */}
            {onDateFilterChange && showFollowedOnly && !showDiscoveryMode && (
              <div className="flex flex-col gap-2 min-w-fit">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Période</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={dateFilter === null ? "default" : "outline"}
                    size="sm"
                    className="justify-start gap-2 whitespace-nowrap"
                    onClick={() => onDateFilterChange(null)}
                  >
                    Tous les articles
                  </Button>
                  <Button
                    variant={dateFilter === 'today' ? "default" : "outline"}
                    size="sm"
                    className="justify-start gap-2 whitespace-nowrap"
                    onClick={() => onDateFilterChange('today')}
                  >
                    <Clock className="h-3 w-3" />
                    Aujourd'hui
                  </Button>
                  <Button
                    variant={dateFilter === 'yesterday' ? "default" : "outline"}
                    size="sm"
                    className="justify-start gap-2 whitespace-nowrap"
                    onClick={() => onDateFilterChange('yesterday')}
                  >
                    <Calendar className="h-3 w-3" />
                    Hier
                  </Button>
                </div>
              </div>
            )}

            {/* Info message when in "All articles" mode */}
            {!showFollowedOnly && user && (
              <div className="flex flex-col gap-2 min-w-fit">
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                  Mode "Tous les flux" : affiche tous les articles sans filtre de date
                </div>
              </div>
            )}

            {/* Section 3: Articles épinglés */}
            {user && (
              <div className="col-span-full">
                <Collapsible open={isPinnedExpanded} onOpenChange={setIsPinnedExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between p-3">
                      <div className="flex items-center gap-2">
                        <Pin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Articles épinglés</span>
                        <Badge variant="secondary">{pinnedCount}</Badge>
                      </div>
                      {isPinnedExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {pinnedArticles.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Aucun article épinglé
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pinnedArticles.slice(0, 3).map((article) => (
                          <div
                            key={article.id}
                            className="border rounded-lg p-3 bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => onOpenArticle?.(article)}
                              >
                                <h4 className="text-sm font-medium line-clamp-2 mb-1 hover:text-primary transition-colors">
                                  {article.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{article.source}</span>
                                  <span>•</span>
                                  <span>{new Date(article.publishedAt).toLocaleDateString('fr-FR')}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {!article.isRead && onMarkAsRead && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        title="Marquer comme lu"
                                      >
                                        <BookOpen className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Marquer comme lu</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Êtes-vous sûr de vouloir marquer cet article comme lu ?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onMarkAsRead(article.id)}>
                                          Marquer comme lu
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {onTogglePin && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        title="Désépingler"
                                      >
                                        <Pin className="h-3 w-3 fill-current" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Désépingler l'article</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Êtes-vous sûr de vouloir désépingler cet article ?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onTogglePin(article.id)}>
                                          Désépingler
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {onDeleteArticle && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    onClick={() => onDeleteArticle(article.id)}
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {pinnedArticles.length > 3 && (
                          <Link to="/pinned">
                            <Button 
                              variant="outline" 
                              className="w-full gap-2 mt-2"
                              size="sm"
                            >
                              Voir tous les articles épinglés ({pinnedArticles.length})
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
};

export default CategoryFilter;
