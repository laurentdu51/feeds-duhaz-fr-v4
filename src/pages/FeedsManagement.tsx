import { useState, useEffect } from 'react';
import { useFeeds } from '@/hooks/useFeeds';
import { useFeedUpdate } from '@/hooks/useFeedUpdate';
import { useAuth } from '@/hooks/useAuth';
import { useSuperUser } from '@/hooks/useSuperUser';
import { Feed } from '@/types/feed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Globe, 
  Rss, 
  Play, 
  Gamepad2,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  LogOut,
  User,
  RefreshCw,
  Edit,
  Timer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AddFeedModal from '@/components/AddFeedModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import EditFeedModal from '@/components/EditFeedModal';

const FeedsManagement = () => {
  const { feeds, loading, toggleFollow, refetch } = useFeeds();
  const { updateFeed, updating } = useFeedUpdate();
  const { user, signOut } = useAuth();
  const { isSuperUser, loading: superUserLoading } = useSuperUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isAddFeedModalOpen, setIsAddFeedModalOpen] = useState(false);
  const [isEditFeedModalOpen, setIsEditFeedModalOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  // Stable computed value for super admin buttons visibility
  const showSuperAdminButtons = user && isSuperUser && !superUserLoading;

  // Force re-render when super user status changes
  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [isSuperUser, user]);

  const handleUpdateFeed = async (feed: Feed) => {
    try {
      await updateFeed(feed.id, feed.url);
      // Refetch feeds to get updated data
      await refetch();
    } catch (error) {
      // Error already handled in useFeedUpdate
    }
  };

  const handleAddFeed = async (feedData: any) => {
    if (!user) {
      toast.error('Vous devez être connecté pour ajouter un flux');
      return;
    }

    try {
      // Insert the new feed
      const { data: newFeed, error } = await supabase
        .from('feeds')
        .insert({
          name: feedData.name,
          url: feedData.url,
          type: feedData.type,
          description: feedData.description || null,
          category: feedData.category || 'general',
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding feed:', error);
        toast.error('Erreur lors de l\'ajout du flux');
        return;
      }

      toast.success('Flux ajouté avec succès');
      setIsAddFeedModalOpen(false);

      // Test the feed by fetching content
      try {
        toast.info('Test de récupération du contenu...');
        
        const { data: testResult, error: testError } = await supabase.functions.invoke('fetch-rss', {
          body: { feedId: newFeed.id, feedUrl: newFeed.url }
        });

        if (testError) {
          console.error('Error testing feed:', testError);
          toast.warning('Flux ajouté mais le test de récupération a échoué');
        } else if (testResult.success) {
          // If test successful, update status to active
          const { error: updateError } = await supabase
            .from('feeds')
            .update({ status: 'active' })
            .eq('id', newFeed.id);

          if (updateError) {
            console.error('Error updating feed status:', updateError);
            toast.warning('Flux testé avec succès mais impossible de l\'activer automatiquement');
          } else {
            toast.success(`Flux activé automatiquement ! ${testResult.articlesProcessed} articles récupérés`);
          }
        } else {
          toast.warning('Flux ajouté mais le test de récupération a échoué');
        }
      } catch (testError) {
        console.error('Error testing feed:', testError);
        toast.warning('Flux ajouté mais le test de récupération a échoué');
      }

      // Refetch feeds to show the updated status
      await refetch();
    } catch (error) {
      console.error('Error adding feed:', error);
      toast.error('Erreur lors de l\'ajout du flux');
    }
  };

  const handleEditFeed = (feed: Feed) => {
    setSelectedFeed(feed);
    setIsEditFeedModalOpen(true);
  };

  const handleSaveEdit = async (feedData: any) => {
    if (!isSuperUser || !selectedFeed) return;

    try {
      const { error } = await supabase
        .from('feeds')
        .update({
          name: feedData.name,
          url: feedData.url,
          type: feedData.type,
          description: feedData.description,
          category: feedData.category,
          status: feedData.status
        })
        .eq('id', selectedFeed.id);

      if (error) {
        console.error('Error updating feed:', error);
        toast.error('Erreur lors de la mise à jour du flux');
        return;
      }

      toast.success('Flux mis à jour avec succès');
      setIsEditFeedModalOpen(false);
      await refetch();
    } catch (error) {
      console.error('Error updating feed:', error);
      toast.error('Erreur lors de la mise à jour du flux');
    }
  };

  const handleToggleStatus = async (feed: Feed) => {
    if (!isSuperUser) return;

    const newStatus = feed.status === 'active' ? 'pending' : 'active';
    
    try {
      const { error } = await supabase
        .from('feeds')
        .update({ status: newStatus })
        .eq('id', feed.id);

      if (error) {
        console.error('Error toggling feed status:', error);
        toast.error('Erreur lors du changement de statut');
        return;
      }

      toast.success(`Flux ${newStatus === 'active' ? 'activé' : 'désactivé'} avec succès`);
      await refetch();
    } catch (error) {
      console.error('Error toggling feed status:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDeleteFeed = async (feed: Feed) => {
    if (!isSuperUser) return;

    try {
      // Supprimer d'abord tous les articles liés au flux
      const { error: articlesError } = await supabase
        .from('articles')
        .delete()
        .eq('feed_id', feed.id);

      if (articlesError) {
        console.error('Error deleting articles:', articlesError);
        toast.error('Erreur lors de la suppression des articles');
        return;
      }

      // Supprimer toutes les relations user_feeds
      const { error: userFeedsError } = await supabase
        .from('user_feeds')
        .delete()
        .eq('feed_id', feed.id);

      if (userFeedsError) {
        console.error('Error deleting user feeds relations:', userFeedsError);
        toast.error('Erreur lors de la suppression des relations utilisateur');
        return;
      }

      // Enfin, supprimer le flux lui-même
      const { error: feedError } = await supabase
        .from('feeds')
        .delete()
        .eq('id', feed.id);

      if (feedError) {
        console.error('Error deleting feed:', feedError);
        toast.error('Erreur lors de la suppression du flux');
        return;
      }

      toast.success('Flux supprimé avec succès');
      await refetch();
    } catch (error) {
      console.error('Error deleting feed:', error);
      toast.error('Erreur lors de la suppression du flux');
    }
  };

  const getTypeIcon = (type: Feed['type']) => {
    switch (type) {
      case 'website': return Globe;
      case 'rss-auto':
      case 'rss-manual': return Rss;
      case 'youtube': return Play;
      case 'steam': return Gamepad2;
      default: return Rss;
    }
  };

  const getStatusIcon = (status: Feed['status']) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'error': return AlertCircle;
      case 'pending': return Clock;
    }
  };

  const getStatusColor = (status: Feed['status']) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'pending': return 'text-yellow-500';
    }
  };

  const filteredFeeds = feeds.filter(feed => {
    const matchesSearch = feed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feed.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || feed.type === selectedType;
    return matchesSearch && matchesType;
  });

  const followedCount = feeds.filter(f => f.isFollowed).length;
  const activeCount = feeds.filter(f => f.status === 'active').length;
  const errorCount = feeds.filter(f => f.status === 'error').length;

  const feedTypes = [
    { value: 'website', label: 'Sites web', icon: Globe },
    { value: 'rss-auto', label: 'RSS Auto', icon: Rss },
    { value: 'rss-manual', label: 'RSS Manuel', icon: Rss },
    { value: 'youtube', label: 'YouTube', icon: Play },
    { value: 'steam', label: 'Steam', icon: Gamepad2 },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading || superUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Chargement des flux...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Flux disponibles</h1>
                <p className="text-muted-foreground">
                  {user ? 'Gérez vos abonnements et découvrez de nouveaux flux' : 'Découvrez nos flux RSS disponibles'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="default" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Se connecter
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total flux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{feeds.length}</div>
              </CardContent>
            </Card>
            {user && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Suivis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{followedCount}</div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Mis à jour auto</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un flux..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {user && (
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setIsAddFeedModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un flux
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedType === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(null)}
                >
                  Tous
                </Button>
                {feedTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <Button
                      key={type.value}
                      variant={selectedType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(type.value)}
                      className="gap-2"
                    >
                      <IconComponent className="h-4 w-4" />
                      {type.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Avertissement pour les visiteurs */}
          {!user && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Connectez-vous pour plus de fonctionnalités</p>
                    <p className="text-sm text-blue-700">
                      Créez un compte pour suivre vos flux préférés et personnaliser votre expérience.
                    </p>
                  </div>
                  <Link to="/auth">
                    <Button size="sm" className="ml-auto">
                      Se connecter
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Super admin info */}
          {user && isSuperUser && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">Mode Super Admin</p>
                    <p className="text-sm text-purple-700">
                      Vous disposez des droits d'administration pour modifier et désactiver les flux.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste des flux avec colonne Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Flux disponibles</CardTitle>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Timer className="h-4 w-4" />
                  <span>Mise à jour automatique activée</span>
                </div>
              </div>
              <CardDescription>
                {filteredFeeds.length} flux trouvé{filteredFeeds.length !== 1 ? 's' : ''} • 
                Les flux actifs sont automatiquement mis à jour toutes les 10 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Flux</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Articles</TableHead>
                      <TableHead>Dernière MAJ</TableHead>
                      {user && <TableHead>Suivi</TableHead>}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                   <TableBody key={renderKey}>
                     {filteredFeeds.map((feed) => {
                       const TypeIcon = getTypeIcon(feed.type);
                       const StatusIcon = getStatusIcon(feed.status);
                       
                       return (
                         <TableRow key={feed.id}>
                           <TableCell>
                             <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                 <div className="font-medium">{feed.name}</div>
                                 {feed.status === 'active' && (
                                   <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                     <Timer className="h-3 w-3 mr-1" />
                                     Auto
                                   </Badge>
                                 )}
                               </div>
                               {feed.description && (
                                 <div className="text-sm text-muted-foreground">
                                   {feed.description}
                                 </div>
                               )}
                               <div className="text-xs text-muted-foreground">
                                 {feed.url}
                               </div>
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="flex items-center gap-2">
                               <TypeIcon className="h-4 w-4" />
                               <Badge variant="outline">
                                 {feedTypes.find(t => t.value === feed.type)?.label}
                               </Badge>
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="flex items-center gap-2">
                               <StatusIcon className={`h-4 w-4 ${getStatusColor(feed.status)}`} />
                               <span className="capitalize">{feed.status}</span>
                             </div>
                           </TableCell>
                           <TableCell>
                             <Badge variant="secondary">{feed.articleCount}</Badge>
                           </TableCell>
                           <TableCell>
                             <div className="text-sm">
                               {new Date(feed.lastUpdated).toLocaleDateString('fr-FR', {
                                 day: '2-digit',
                                 month: '2-digit',
                                 year: 'numeric',
                                 hour: '2-digit',
                                 minute: '2-digit'
                               })}
                             </div>
                           </TableCell>
                           {user && (
                             <TableCell>
                               <Switch
                                 checked={feed.isFollowed}
                                 onCheckedChange={() => toggleFollow(feed.id)}
                               />
                             </TableCell>
                           )}
                           <TableCell>
                             <div className="flex gap-2">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleUpdateFeed(feed)}
                                 disabled={updating === feed.id}
                                 className="gap-2"
                               >
                                 <RefreshCw className={`h-4 w-4 ${updating === feed.id ? 'animate-spin' : ''}`} />
                                 {updating === feed.id ? 'Mise à jour...' : 'Actualiser'}
                               </Button>
                               
                               {showSuperAdminButtons && (
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleEditFeed(feed)}
                                   className="gap-2"
                                 >
                                   <Edit className="h-4 w-4" />
                                   Modifier
                                 </Button>
                               )}
                             </div>
                           </TableCell>
                         </TableRow>
                       );
                     })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Feed Modal */}
      <AddFeedModal
        isOpen={isAddFeedModalOpen}
        onClose={() => setIsAddFeedModalOpen(false)}
        onAddFeed={handleAddFeed}
        categories={[]} // Pas besoin de catégories pour l'instant
      />

      {/* Edit Feed Modal */}
      {selectedFeed && (
        <EditFeedModal
          isOpen={isEditFeedModalOpen}
          onClose={() => setIsEditFeedModalOpen(false)}
          onSave={handleSaveEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteFeed}
          feed={selectedFeed}
          feedTypes={feedTypes}
          isSuperUser={isSuperUser}
        />
      )}
    </div>
  );
};

export default FeedsManagement;
