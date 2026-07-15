
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NewsItem } from '@/types/news';
import { toast } from 'sonner';
import { 
  Clock, 
  ExternalLink,
  Calendar,
  Copy,
  Rss,
  Youtube,
  Gamepad2,
  Newspaper
} from 'lucide-react';

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: NewsItem | null;
}

const ArticleModal = ({ isOpen, onClose, article }: ArticleModalProps) => {
  if (!article) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rss': return <Rss className="h-5 w-5 text-blue-600" />;
      case 'youtube': return <Youtube className="h-5 w-5 text-red-600" />;
      case 'steam': return <Gamepad2 className="h-5 w-5 text-gray-600" />;
      case 'actualites': return <Newspaper className="h-5 w-5 text-green-600" />;
      default: return <Rss className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSourceColor = (category: string) => {
    switch (category) {
      case 'rss': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'youtube': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'steam': return 'bg-gray-500/10 text-gray-700 border-gray-200';
      case 'actualites': return 'bg-green-500/10 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const isYouTubeVideo = article.category === 'youtube' && article.url;
  const youtubeVideoId = isYouTubeVideo ? getYouTubeVideoId(article.url!) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getSourceColor(article.category)}>
              {article.source}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {article.readTime} min
            </div>
          </div>
          
          <DialogTitle className="flex items-center gap-2 text-xl font-bold leading-tight text-left">
            {getCategoryIcon(article.category)}
            {article.title}
          </DialogTitle>
          
          <DialogDescription className="sr-only">
            Article détaillé: {article.description}
          </DialogDescription>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* YouTube Video Player */}
          {isYouTubeVideo && youtubeVideoId && (
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                title={article.title}
                className="w-full h-full rounded-lg"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          {/* Article Image - Only for non-YouTube articles */}
          {article.imageUrl && article.category !== 'youtube' && (
            <div className="w-full">
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="w-full h-auto rounded-lg object-cover"
              />
            </div>
          )}

          {/* Article Description */}
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              {article.description}
            </p>
          </div>

          {/* Article Content */}
          <div className="prose prose-sm max-w-none">
            <div className="text-foreground leading-relaxed whitespace-pre-wrap">
              {article.content}
            </div>
          </div>

          {/* External Link Button */}
          {article.url && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="gap-2"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(article.url!);
                    toast.success("Lien copié dans le presse-papier");
                  } catch (error) {
                    toast.error("Erreur lors de la copie du lien");
                  }
                }}
              >
                <Copy className="h-4 w-4" />
                Copier le lien
              </Button>
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={() => window.open(article.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Voir la source
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleModal;
