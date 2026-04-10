import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  type TooltipProps,
} from 'recharts';
import { formatDate, formatNumber, cn } from '@/lib/utils';
import type { CurrencyHistory } from '../../../../shared/types/currency';

interface CurrencyChartProps {
  data: CurrencyHistory[];
  selectedPairs: string[];
}

const PAIR_COLORS: Record<string, string> = {
  'USD/CAD': '#3b82f6',
  'USD/MXN': '#22c55e',
  'CAD/MXN': '#f59e0b',
  'EUR/USD': '#8b5cf6',
  'GBP/USD': '#ec4899',
  'USD/JPY': '#06b6d4',
};

function getColor(pair: string, index: number): string {
  if (PAIR_COLORS[pair]) return PAIR_COLORS[pair];
  const fallback = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  return fallback[index % fallback.length];
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="glass-card rounded-lg border border-border/50 px-3 py-2.5 shadow-xl min-w-[140px]">
      <p className="text-[10px] text-muted-foreground mb-2">{formatDate(label)}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold tabular-nums" style={{ color: entry.color }}>
              {formatNumber(entry.value as number, 4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CurrencyChart({ data, selectedPairs }: CurrencyChartProps) {
  const [normalized, setNormalized] = useState(false);
  const [visiblePairs, setVisiblePairs] = useState<Set<string>>(
    new Set(selectedPairs)
  );

  // Merge all currency data into a shared timeline
  const { chartData, pairKeys } = useMemo(() => {
    const filtered = data.filter((c) => visiblePairs.has(c.pair));
    if (filtered.length === 0) return { chartData: [], pairKeys: [] };

    // Collect all dates
    const dateSet = new Set<string>();
    filtered.forEach((c) => c.data.forEach((d) => dateSet.add(d.date)));
    const sortedDates = Array.from(dateSet).sort();

    // Build lookup per pair
    const pairLookup: Record<string, Record<string, number>> = {};
    const pairFirstValues: Record<string, number> = {};
    filtered.forEach((c) => {
      const lookup: Record<string, number> = {};
      c.data.forEach((d) => { lookup[d.date] = d.rate; });
      pairLookup[c.pair] = lookup;
      if (c.data.length > 0) {
        pairFirstValues[c.pair] = c.data[0].rate;
      }
    });

    const merged = sortedDates.map((date) => {
      const row: Record<string, string | number> = { date };
      filtered.forEach((c) => {
        const rawVal = pairLookup[c.pair]?.[date];
        if (rawVal != null) {
          if (normalized && pairFirstValues[c.pair]) {
            row[c.pair] = ((rawVal - pairFirstValues[c.pair]) / pairFirstValues[c.pair]) * 100;
          } else {
            row[c.pair] = rawVal;
          }
        }
      });
      return row;
    });

    return {
      chartData: merged,
      pairKeys: filtered.map((c) => c.pair),
    };
  }, [data, visiblePairs, normalized]);

  const togglePair = (pair: string) => {
    setVisiblePairs((prev) => {
      const next = new Set(prev);
      if (next.has(pair)) {
        if (next.size > 1) next.delete(pair);
      } else {
        next.add(pair);
      }
      return next;
    });
  };

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">Exchange Rates</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {normalized ? '% change from start' : 'Spot rates'}
          </p>
        </div>
        <button
          onClick={() => setNormalized((v) => !v)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            normalized
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          {normalized ? '% View' : 'Absolute'}
        </button>
      </div>

      {/* Currency toggles */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {selectedPairs.map((pair, i) => {
          const color = getColor(pair, i);
          const active = visiblePairs.has(pair);
          return (
            <button
              key={pair}
              onClick={() => togglePair(pair)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all',
                active
                  ? 'border border-current shadow-sm'
                  : 'border border-border/50 text-muted-foreground opacity-50 hover:opacity-75'
              )}
              style={active ? { color, borderColor: color + '60' } : undefined}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: active ? color : 'currentColor' }}
              />
              {pair}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: string) => {
                const d = new Date(val);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              minTickGap={30}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={50}
              tickFormatter={(val: number) =>
                normalized ? `${val >= 0 ? '+' : ''}${val.toFixed(1)}%` : formatNumber(val, 2)
              }
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '3 3' }} />
            {pairKeys.map((pair, i) => (
              <Line
                key={pair}
                type="monotone"
                dataKey={pair}
                name={pair}
                stroke={getColor(pair, i)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
                connectNulls
                isAnimationActive={true}
                animationDuration={800}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
