import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter l'hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <Sun className="h-4 w-4" />
        <span className="text-xs">Clair</span>
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleTheme}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      className="gap-2 transition-all duration-300"
    >
      <div className="relative w-4 h-4">
        <Sun 
          className={`h-4 w-4 absolute inset-0 transition-all duration-300 ${
            isDark 
              ? 'rotate-0 scale-100 opacity-100 text-yellow-400' 
              : 'rotate-90 scale-0 opacity-0'
          }`} 
        />
        <Moon 
          className={`h-4 w-4 absolute inset-0 transition-all duration-300 ${
            isDark 
              ? '-rotate-90 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100 text-slate-600 dark:text-slate-400'
          }`} 
        />
      </div>
      <span className="text-xs font-medium hidden sm:inline">
        {isDark ? 'Sombre' : 'Clair'}
      </span>
    </Button>
  );
};

export default ThemeToggle;
