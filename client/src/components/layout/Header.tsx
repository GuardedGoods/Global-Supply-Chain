import { Sun, Moon, RefreshCw, Wifi, WifiOff, Rows2, Rows3, Menu } from 'lucide-react';
import { useThemeContext } from './ThemeProvider';
import { cn } from '@/lib/utils';
import type { Density } from '@/hooks/useDensity';

interface HeaderProps {
  connected: boolean;
  lastUpdate: string | null;
  onRefresh: () => void;
  density: Density;
  onToggleDensity: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export function Header({
  connected,
  lastUpdate,
  onRefresh,
  density,
  onToggleDensity,
  onMenuClick,
  isMobile = false,
}: HeaderProps) {
  const { theme, toggleTheme } = useThemeContext();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-3 md:px-6 safe-pt">
      {/* Left: hamburger (mobile) + connection status */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground tap-target"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className={cn(
          'flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium border shrink-0',
          connected
            ? 'border-green-600/30 text-green-600 dark:text-green-500'
            : 'border-red-600/30 text-red-600 dark:text-red-500'
        )}>
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span className="hidden sm:inline">{connected ? 'Live' : 'Disconnected'}</span>
        </div>
        {lastUpdate && (
          <span className="numeric text-xs text-muted-foreground hidden sm:inline truncate">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-0.5 md:gap-1">
        {/* Density toggle — hidden on mobile (always compact there) */}
        <button
          onClick={onToggleDensity}
          className="hidden md:inline-flex rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
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
          className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors tap-target"
          title="Refresh data"
          aria-label="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          onClick={toggleTheme}
          className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors tap-target"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
