import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  type TooltipProps,
} from 'recharts';
import { formatDate, formatNumber } from '@/lib/utils';

interface DataPoint {
  date: string;
  value: number;
}

interface EconomicTrendChartProps {
  data: DataPoint[];
  name: string;
  unit: string;
  positiveIsGood?: boolean;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0];
  return (
    <div className="glass-card rounded-lg border border-border/50 px-3 py-2 shadow-xl">
      <p className="text-[10px] text-muted-foreground mb-1">{formatDate(label)}</p>
      <p className="text-sm font-semibold" style={{ color: point.color }}>
        {formatNumber(point.value as number)}
      </p>
    </div>
  );
}

export function EconomicTrendChart({
  data,
  name,
  unit,
  positiveIsGood = true,
}: EconomicTrendChartProps) {
  const { currentValue, referenceValue, isAboveRef, trendColor, gradientId } = useMemo(() => {
    const id = `econ-gradient-${name.replace(/\s+/g, '-')}`;
    if (data.length === 0) {
      return {
        currentValue: 0,
        referenceValue: 0,
        isAboveRef: true,
        trendColor: '#6b7280',
        gradientId: id,
      };
    }
    const current = data[data.length - 1].value;
    const avg = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    const above = current >= avg;
    // If positive is good and value is above average, show green. Otherwise red.
    const isGood = positiveIsGood ? above : !above;
    const color = isGood ? '#22c55e' : '#ef4444';
    return {
      currentValue: current,
      referenceValue: avg,
      isAboveRef: above,
      trendColor: color,
      gradientId: id,
    };
  }, [data, name, positiveIsGood]);

  const changeFromRef = data.length > 0
    ? ((currentValue - referenceValue) / Math.abs(referenceValue || 1)) * 100
    : 0;

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Header with current value */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{unit}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold tabular-nums" style={{ color: trendColor }}>
              {formatNumber(currentValue)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              <span style={{ color: trendColor }}>
                {changeFromRef >= 0 ? '+' : ''}{changeFromRef.toFixed(1)}%
              </span>
              {' '}vs avg
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
              </linearGradient>
            </defs>
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
              width={45}
              tickFormatter={(val: number) => formatNumber(val, 1)}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '3 3' }} />
            <ReferenceLine
              y={referenceValue}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              strokeOpacity={0.4}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={trendColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
              isAnimationActive={true}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
