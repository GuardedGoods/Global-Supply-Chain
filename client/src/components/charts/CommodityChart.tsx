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
import { TimeRangeSelector } from './TimeRangeSelector';

interface DataPoint {
  date: string;
  value: number;
}

interface CommodityChartProps {
  data: DataPoint[];
  name: string;
  unit: string;
  color?: string;
}

const RANGES = ['1W', '1M', '3M'];

function getRangeFilterDays(range: string): number {
  switch (range) {
    case '1W': return 7;
    case '1M': return 30;
    case '3M': return 90;
    default: return 30;
  }
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0];
  return (
    <div className="glass-card rounded-lg border border-border/50 px-3 py-2 shadow-xl">
      <p className="text-[10px] text-muted-foreground mb-1">{formatDate(label)}</p>
      <p className="text-sm font-semibold" style={{ color: point.color }}>
        {formatNumber(point.value as number)} {(point.payload as DataPoint & { _unit?: string })?._unit ?? ''}
      </p>
    </div>
  );
}

export function CommodityChart({ data, name, unit, color = '#3b82f6' }: CommodityChartProps) {
  const [range, setRange] = useState('1M');

  const filteredData = useMemo(() => {
    const days = getRangeFilterDays(range);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const filtered = data
      .filter((d) => new Date(d.date) >= cutoff)
      .map((d) => ({ ...d, _unit: unit }));
    return filtered.length > 0 ? filtered : data.slice(-7).map((d) => ({ ...d, _unit: unit }));
  }, [data, range, unit]);

  const gradientId = `commodity-gradient-${name.replace(/\s+/g, '-')}`;

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{unit}</p>
        </div>
        <TimeRangeSelector ranges={RANGES} selected={range} onChange={setRange} />
      </div>

      {/* Chart */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
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
              tickFormatter={(val: number) => formatNumber(val, 0)}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '3 3' }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
              isAnimationActive={true}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
