import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Settings, User, Rss, List, LogOut, Shield, Pin, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSuperUser } from '@/hooks/useSuperUser';
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
  const {
    user,
    signOut
  } = useAuth();
  const {
    isSuperUser
  } = useSuperUser();
  const handleSignOut = async () => {
    await signOut();
  };
  return <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Rss className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Feeds.Duhaz.fr</h1>
              {isSuperUser && <Badge variant="destructive" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>}
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} className="pl-10 w-64" />
            </div>
            
            <Link to="/changelog">
              <Button variant="ghost" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Changelog</span>
              </Button>
            </Link>

            {user ? <>
                <Link to="/pinned">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Pin className="h-4 w-4" />
                    Épinglés
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
                    Gérer les flux
                  </Button>
                </Link>
                
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </> : <Link to="/auth">
                <Button variant="default" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Se connecter
                </Button>
              </Link>}
          </div>
        </div>
      </div>
    </header>;
};
export default Header;