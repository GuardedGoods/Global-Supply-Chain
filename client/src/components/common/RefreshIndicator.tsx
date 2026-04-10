import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefreshIndicatorProps {
  loading: boolean;
  error: string | null;
  lastUpdated?: string;
  onRefresh?: () => void;
}

export function RefreshIndicator({ loading, error, lastUpdated, onRefresh }: RefreshIndicatorProps) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      {error && (
        <span className="text-destructive">{error}</span>
      )}
      {lastUpdated && (
        <span>Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
      )}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
        </button>
      )}
    </div>
  );
}
