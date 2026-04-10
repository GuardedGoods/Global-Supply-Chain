import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn, formatPercent } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string;
  change: number;
  changePercent: number;
  icon: LucideIcon;
  trend: { value: number }[];
  unit?: string;
}

export function KpiCard({
  title,
  value,
  change,
  changePercent,
  icon: Icon,
  trend,
  unit,
}: KpiCardProps) {
  const isPositive = change >= 0;
  const trendColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div className="glass-card rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-muted-foreground truncate">
              {title}
            </p>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-xs text-muted-foreground">{unit}</span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                isPositive
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-red-500/10 text-red-500'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {formatPercent(changePercent)}
            </span>
            <span className="text-xs text-muted-foreground">
              {isPositive ? '+' : ''}
              {change.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="w-24 h-10 ml-3 opacity-70 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id={`kpi-gradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={trendColor}
                strokeWidth={1.5}
                fill={`url(#kpi-gradient-${title.replace(/\s+/g, '-')})`}
                dot={false}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
