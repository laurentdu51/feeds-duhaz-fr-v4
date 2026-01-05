import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, Settings, User, Rss, List, LogOut, Shield, Pin, FileText, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSuperUser } from '@/hooks/useSuperUser';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  pinnedCount: number;
}

const Header = ({
  searchQuery,
  onSearchChange,
  pinnedCount
}: HeaderProps) => {
  const { user, signOut } = useAuth();
  const { isSuperUser } = useSuperUser();
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const closeSheet = () => setIsSheetOpen(false);

  // Version Desktop
  if (!isMobile) {
    return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Rss className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Feeds.Duhaz.fr</h1>
                {isSuperUser && (
                  <Badge variant="destructive" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher..." 
                  value={searchQuery} 
                  onChange={e => onSearchChange(e.target.value)} 
                  className="pl-10 w-48 lg:w-64" 
                />
              </div>
              
              <Link to="/changelog">
                <Button variant="ghost" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden lg:inline">Changelog</span>
                </Button>
              </Link>

              {user ? (
                <>
                  <Link to="/pinned">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Pin className="h-4 w-4" />
                      <span className="hidden lg:inline">Épinglés</span>
                      {pinnedCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                          {pinnedCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  
                  <Link to="/feeds">
                    <Button variant="outline" size="sm" className="gap-2">
                      <List className="h-4 w-4" />
                      <span className="hidden lg:inline">Flux disponibles</span>
                    </Button>
                  </Link>
                  
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  
                  <div className="hidden xl:flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="xl:hidden">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="default" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline">Se connecter</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Version Mobile
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Feeds</h1>
            {isSuperUser && (
              <Badge variant="destructive" className="gap-1 text-xs px-1.5">
                <Shield className="h-3 w-3" />
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              
              <SheetContent side="right" className="w-[280px]">
                <div className="flex flex-col h-full">
                  <SheetHeader className="mb-6">
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>

                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Rechercher..." 
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <nav className="flex flex-col gap-2 flex-1">
                    <Link to="/changelog" onClick={closeSheet}>
                      <Button variant="ghost" className="w-full justify-start gap-3">
                        <FileText className="h-4 w-4" />
                        Changelog
                      </Button>
                    </Link>

                    {user && (
                      <>
                        <Link to="/pinned" onClick={closeSheet}>
                          <Button variant="ghost" className="w-full justify-start gap-3">
                            <Pin className="h-4 w-4" />
                            Épinglés
                            {pinnedCount > 0 && (
                              <Badge variant="secondary" className="ml-auto">
                                {pinnedCount}
                              </Badge>
                            )}
                          </Button>
                        </Link>

                        <Link to="/feeds" onClick={closeSheet}>
                          <Button variant="ghost" className="w-full justify-start gap-3">
                            <List className="h-4 w-4" />
                            Flux disponibles
                          </Button>
                        </Link>

                        <Button variant="ghost" className="w-full justify-start gap-3">
                          <Settings className="h-4 w-4" />
                          Paramètres
                        </Button>
                      </>
                    )}
                  </nav>

                  <div className="border-t pt-4 mt-4">
                    {user ? (
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full gap-2"
                          onClick={() => {
                            handleSignOut();
                            closeSheet();
                          }}
                        >
                          <LogOut className="h-4 w-4" />
                          Déconnexion
                        </Button>
                      </div>
                    ) : (
                      <Link to="/auth" onClick={closeSheet}>
                        <Button variant="default" className="w-full gap-2">
                          <User className="h-4 w-4" />
                          Se connecter
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;