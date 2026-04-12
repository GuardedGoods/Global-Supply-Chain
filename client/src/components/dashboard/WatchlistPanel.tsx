import { Bookmark, Bell, X, AlertCircle } from 'lucide-react';
import { useWatchlist, type WatchlistItem } from '@/hooks/useWatchlist';
import { cn, formatPercent, formatCurrency } from '@/lib/utils';
import type { CommodityPrice } from '../../../../shared/types/commodities';
import type { ExchangeRate } from '../../../../shared/types/currency';

interface WatchlistPanelProps {
  commodities?: CommodityPrice[];
  rates?: ExchangeRate[];
}

function itemValue(
  item: WatchlistItem,
  commodities?: CommodityPrice[],
  rates?: ExchangeRate[]
): { value: number; changePercent: number } | null {
  if (item.category === 'commodity') {
    const c = commodities?.find(p => p.seriesId === item.id);
    if (!c) return null;
    return { value: c.value, changePercent: c.changePercent };
  }
  if (item.category === 'currency') {
    const r = rates?.find(rt => rt.to === item.id);
    if (!r) return null;
    return { value: r.rate, changePercent: r.changePercent };
  }
  return null;
}

function thresholdTriggered(
  threshold: WatchlistItem['threshold'],
  v: { value: number; changePercent: number }
): boolean {
  if (!threshold) return false;
  if (threshold.operator === 'gt') return v.value > threshold.value;
  if (threshold.operator === 'lt') return v.value < threshold.value;
  if (threshold.operator === 'change_gt') return v.changePercent > threshold.value;
  if (threshold.operator === 'change_lt') return v.changePercent < threshold.value;
  return false;
}

export function WatchlistPanel({ commodities, rates }: WatchlistPanelProps) {
  const { items, remove } = useWatchlist();

  if (items.length === 0) {
    return (
      <div className="minimal-card rounded p-4">
        <div className="flex items-center gap-2 mb-2">
          <Bookmark className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Watchlist</h3>
        </div>
        <p className="text-xs text-muted-foreground py-6 text-center">
          No items watched. Click the bookmark icon on commodities or currency to track them.
        </p>
      </div>
    );
  }

  return (
    <div className="minimal-card rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Watchlist</h3>
        </div>
        <span className="text-[10px] text-muted-foreground">{items.length} items</span>
      </div>

      <div className="space-y-1">
        {items.map(item => {
          const v = itemValue(item, commodities, rates);
          const triggered = v && item.threshold ? thresholdTriggered(item.threshold, v) : false;

          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-2 py-1.5 px-2 rounded border transition-colors',
                triggered ? 'border-red-500/50 bg-red-500/5' : 'border-transparent hover:border-border hover:bg-accent/30'
              )}
            >
              {triggered && <Bell className="h-3 w-3 text-red-500 risk-pulse shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.name}</p>
                {item.threshold && (
                  <p className="text-[10px] text-muted-foreground numeric">
                    Alert: {item.threshold.operator.replace('_', ' ')} {item.threshold.value}
                  </p>
                )}
              </div>
              {v && (
                <div className="text-right shrink-0">
                  <p className="numeric text-xs font-semibold">
                    {item.category === 'commodity' ? formatCurrency(v.value) : v.value.toFixed(4)}
                  </p>
                  <p className={cn(
                    'numeric text-[10px]',
                    v.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {formatPercent(v.changePercent)}
                  </p>
                </div>
              )}
              {!v && <span title="Data unavailable"><AlertCircle className="h-3 w-3 text-muted-foreground shrink-0" /></span>}
              <button
                onClick={() => remove(item.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
