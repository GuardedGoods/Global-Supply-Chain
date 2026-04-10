import { Brain, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiSummaryPanelProps {
  summary: string | null;
  loading: boolean;
  onRefresh?: () => void;
}

export function AiSummaryPanel({ summary, loading, onRefresh }: AiSummaryPanelProps) {
  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Subtle gradient border */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 p-[1px]">
        <div className="h-full w-full rounded-xl bg-card" />
      </div>

      <div className="relative glass-card rounded-xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Brain className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">AI Analysis</h3>
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
                'bg-primary/10 text-primary hover:bg-primary/20 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
              Refresh
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-5/6 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-4/6 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-3/4 rounded-md bg-muted animate-pulse" />
          </div>
        ) : summary ? (
          <div className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line">
            {summary}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Brain className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No analysis available</p>
            <p className="text-xs mt-1">Click refresh to generate insights</p>
          </div>
        )}
      </div>
    </div>
  );
}
