import { Sun, Moon, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useThemeContext } from './ThemeProvider';
import { cn } from '@/lib/utils';

interface HeaderProps {
  connected: boolean;
  lastUpdate: string | null;
  onRefresh: () => void;
}

export function Header({ connected, lastUpdate, onRefresh }: HeaderProps) {
  const { theme, toggleTheme } = useThemeContext();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
          connected ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        )}>
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {connected ? 'Live' : 'Disconnected'}
        </div>
        {lastUpdate && (
          <span className="text-xs text-muted-foreground">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
