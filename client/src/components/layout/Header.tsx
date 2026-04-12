import { Sun, Moon, RefreshCw, Wifi, WifiOff, Rows2, Rows3 } from 'lucide-react';
import { useThemeContext } from './ThemeProvider';
import { cn } from '@/lib/utils';
import type { Density } from '@/hooks/useDensity';

interface HeaderProps {
  connected: boolean;
  lastUpdate: string | null;
  onRefresh: () => void;
  density: Density;
  onToggleDensity: () => void;
}

export function Header({
  connected,
  lastUpdate,
  onRefresh,
  density,
  onToggleDensity,
}: HeaderProps) {
  const { theme, toggleTheme } = useThemeContext();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex items-center gap-2 rounded px-2 py-1 text-xs font-medium border',
          connected
            ? 'border-green-600/30 text-green-600 dark:text-green-500'
            : 'border-red-600/30 text-red-600 dark:text-red-500'
        )}>
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {connected ? 'Live' : 'Disconnected'}
        </div>
        {lastUpdate && (
          <span className="numeric text-xs text-muted-foreground">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onToggleDensity}
          className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={`Switch to ${density === 'comfortable' ? 'compact' : 'comfortable'} density`}
          aria-label="Toggle row density"
        >
          {density === 'comfortable' ? (
            <Rows3 className="h-4 w-4" />
          ) : (
            <Rows2 className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={onRefresh}
          className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          onClick={toggleTheme}
          className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
