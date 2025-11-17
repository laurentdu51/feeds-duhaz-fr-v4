import { NewsItem } from '@/types/news';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Pin, ExternalLink, Eye, Trash2, Copy, Rss, Youtube, Gamepad2, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
interface NewsCardProps {
  news: NewsItem;
  onTogglePin: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenArticle: (article: NewsItem) => void;
  onSourceClick?: (feedId: string, feedName: string) => void;
  isDiscoveryMode?: boolean;
}
const NewsCard = ({
  news,
  onTogglePin,
  onMarkAsRead,
  onDelete,
  onOpenArticle,
  onSourceClick,
  isDiscoveryMode
}: NewsCardProps) => {
  const {
    user
  } = useAuth();

  // Function to decode HTML entities
  const decodeHtmlEntities = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rss':
        return <Rss className="h-4 w-4 text-blue-600" />;
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-600" />;
      case 'steam':
        return <Gamepad2 className="h-4 w-4 text-gray-600" />;
      case 'actualites':
        return <Newspaper className="h-4 w-4 text-green-600" />;
      default:
        return <Rss className="h-4 w-4 text-muted-foreground" />;
    }
  };
  const getSourceColor = (category: string) => {
    switch (category) {
      case 'rss':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'youtube':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'steam':
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
      case 'actualites':
        return 'bg-green-500/10 text-green-700 border-green-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };
  const getYouTubeThumbnail = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };
  const handleCardClick = () => {
    onOpenArticle(news);
    // Don't automatically mark as read on card click - user can use the "Mark as read" button
  };
  return <Card className={cn("group hover:shadow-lg transition-all duration-300 border-l-4 cursor-pointer", news.isPinned && "border-l-yellow-500", isDiscoveryMode && "border-l-purple-500", news.isRead && "opacity-75", !news.isRead && !isDiscoveryMode && "border-l-primary")}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2" onClick={handleCardClick}>
            <div className="flex items-center gap-2">
              {isDiscoveryMode && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-200">
                  🔍 Nouveau flux
                </Badge>
              )}
            </div>
            
            <h3 className={cn("flex items-center gap-2 font-semibold leading-tight group-hover:text-primary transition-colors", news.isRead && "text-muted-foreground")}>
              {getCategoryIcon(news.category)}
              {decodeHtmlEntities(news.title)}
            </h3>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={e => {
            e.stopPropagation();
            onTogglePin(news.id);
          }} disabled={!user} className={cn("h-8 w-8 p-0", news.isPinned && "text-yellow-600", !user && "opacity-50 cursor-not-allowed")}>
              <Pin className={cn("h-4 w-4", news.isPinned && "fill-current")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4" onClick={handleCardClick}>
        <div className="space-y-3">
          {/* Show image only for non-YouTube articles */}
          {news.imageUrl && news.category !== 'youtube' && <div className="w-full">
              <img src={news.imageUrl} alt={news.title} className="w-full h-48 object-cover rounded-md" />
            </div>}
          
          {news.category !== 'youtube' && <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {decodeHtmlEntities(news.description)}
              </p>
            </div>}
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge 
              variant="outline" 
              className={cn(
                getSourceColor(news.category),
                onSourceClick && news.feedId && "cursor-pointer hover:opacity-80 transition-opacity"
              )}
              onClick={(e) => {
                if (onSourceClick && news.feedId) {
                  e.stopPropagation();
                  onSourceClick(news.feedId, news.source);
                }
              }}
            >
              {news.source}
            </Badge>
            <span>
              {new Date(news.publishedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            })}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {!news.isRead && user && <Button variant="outline" size="sm" onClick={e => {
            e.stopPropagation();
            onMarkAsRead(news.id);
          }} className="gap-1">
                <Eye className="h-3 w-3" />
                Marquer lu
              </Button>}
            
            {news.url && <>
                
                
                <Button variant="default" size="sm" className="gap-1" onClick={e => {
              e.stopPropagation();
              window.open(news.url, '_blank');
            }}>
                  <ExternalLink className="h-3 w-3" />
                  Lire
                </Button>
              </>}
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default NewsCard;