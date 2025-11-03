import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  convertYouTubeToRSS, 
  fetchYouTubeChannelName, 
  fetchYouTubeRSSUrl,
  needsChannelIdLookup, 
  getChannelIdInstructions,
  isDirectRSSFeed
} from '@/utils/youtube';
import { fetchWebsiteRSS, isDirectRSSFeed as isDirectRSSUrl } from '@/utils/rss';
import { feedTypeOptions } from './FeedTypeOptions';
import { NewsCategory } from '@/types/news';
import { AlertTriangle, Info } from 'lucide-react';

interface FeedFormData {
  name: string;
  url: string;
  category: string;
  description?: string;
}

interface FeedFormProps {
  selectedType: string;
  onSubmit: (feedData: any) => void;
  onCancel: () => void;
  categories: NewsCategory[];
}

const FeedForm = ({ selectedType, onSubmit, onCancel, categories }: FeedFormProps) => {
  const [isLoadingChannelName, setIsLoadingChannelName] = useState(false);
  const [urlWarning, setUrlWarning] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  
  const form = useForm<FeedFormData>({
    defaultValues: {
      name: '',
      url: '',
      category: '',
      description: '',
    },
  });

  const handleSubmit = (data: FeedFormData) => {
    let processedUrl = data.url;
    
    // If it's a YouTube feed, convert the URL to RSS format
    if (selectedType === 'youtube') {
      processedUrl = convertYouTubeToRSS(data.url);
      console.log('YouTube URL converted:', { original: data.url, converted: processedUrl });
    }
    
    const feedData = {
      ...data,
      url: processedUrl,
      type: selectedType,
      id: Date.now().toString(), // Simple ID generation
    };
    
    onSubmit(feedData);
  };

  const handleUrlChange = async (url: string) => {
    form.setValue('url', url);
    setUrlWarning(null);
    setShowInstructions(false);
    
    // If it's a YouTube URL, try to automatically fetch RSS URL and channel name
    if (selectedType === 'youtube' && url && url.includes('youtube.com')) {
      setIsLoadingChannelName(true);
      
      try {
        // Try to automatically fetch the RSS URL and channel name
        const result = await fetchYouTubeRSSUrl(url);
        
        if (result) {
          // Update the URL field with the correct RSS URL
          form.setValue('url', result.rssUrl);
          
          // Set the channel name if we don't have one yet
          if (!form.getValues('name') && result.channelName) {
            form.setValue('name', result.channelName);
          }
          
          setUrlWarning(null);
          setShowInstructions(false);
        } else {
          // Fallback to manual instructions if automatic detection fails
          setUrlWarning('Impossible de détecter automatiquement le flux RSS. Veuillez utiliser les instructions ci-dessous.');
          setShowInstructions(true);
        }
      } catch (error) {
        console.error('Error fetching YouTube RSS:', error);
        setUrlWarning('Erreur lors de la détection automatique. Veuillez utiliser les instructions ci-dessous.');
        setShowInstructions(true);
      }
      
      setIsLoadingChannelName(false);
    }
    
    // If it's an RSS auto URL, try to automatically detect RSS feed
    if (selectedType === 'rss-auto' && url && !isDirectRSSUrl(url)) {
      setIsLoadingChannelName(true);
      
      try {
        const result = await fetchWebsiteRSS(url);
        
        if (result) {
          // Update the URL field with the detected RSS URL
          form.setValue('url', result.rssUrl);
          
          // Set the site name if we don't have one yet
          if (!form.getValues('name') && result.siteName) {
            form.setValue('name', result.siteName);
          }
          
          setUrlWarning(null);
          
          // If multiple feeds found, show info
          if (result.feeds && result.feeds.length > 1) {
            setUrlWarning(`✓ ${result.feeds.length} flux RSS détectés. Le premier a été sélectionné.`);
          }
        } else {
          setUrlWarning('Aucun flux RSS détecté automatiquement sur ce site.');
        }
      } catch (error) {
        console.error('Error fetching website RSS:', error);
        setUrlWarning('Erreur lors de la détection automatique du flux RSS.');
      }
      
      setIsLoadingChannelName(false);
    }
  };

  const selectedTypeOption = feedTypeOptions.find(option => option.value === selectedType);

  const getUrlPlaceholder = () => {
    switch (selectedType) {
      case 'youtube':
        return 'https://www.youtube.com/channel/UCxxxxx ou https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxx';
      case 'rss-auto':
        return 'https://example.com (le flux RSS sera détecté automatiquement)';
      case 'rss-manual':
        return 'https://example.com/feed.xml';
      default:
        return 'https://...';
    }
  };

  const getUrlHelperText = () => {
    if (selectedType === 'youtube') {
      return 'Utilisez de préférence l\'URL avec l\'ID de chaîne (UC...) ou l\'URL RSS directe pour éviter les erreurs';
    }
    if (selectedType === 'rss-auto') {
      return 'Entrez l\'URL du site web et le flux RSS sera automatiquement détecté';
    }
    return null;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          {selectedTypeOption && (
            <>
              <div className={`p-2 rounded ${selectedTypeOption.color} text-white`}>
                <selectedTypeOption.icon className="h-4 w-4" />
              </div>
              <span className="font-medium">{selectedTypeOption.label}</span>
            </>
          )}
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nom du flux
                {isLoadingChannelName && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (détection automatique...)
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nom du flux..." 
                  {...field} 
                  required
                  disabled={isLoadingChannelName}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input 
                  placeholder={getUrlPlaceholder()}
                  type="url"
                  {...field} 
                  onChange={(e) => handleUrlChange(e.target.value)}
                  required
                />
              </FormControl>
              {getUrlHelperText() && (
                <p className="text-xs text-muted-foreground mt-1">
                  {getUrlHelperText()}
                </p>
              )}
              {urlWarning && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {urlWarning}
                  </AlertDescription>
                </Alert>
              )}
              {showInstructions && selectedType === 'youtube' && (
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm whitespace-pre-line">
                    {getChannelIdInstructions()}
                  </AlertDescription>
                </Alert>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optionnel)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Description du flux..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoadingChannelName}>
            Ajouter le flux
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default FeedForm;
