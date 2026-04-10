import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  type TooltipProps,
} from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils';

interface FuelDataPoint {
  date: string;
  gasoline: number;
  diesel: number;
  crudeOil: number;
}

interface FuelPriceChartProps {
  data: FuelDataPoint[];
}

const FUEL_LINES = [
  { key: 'gasoline', label: 'Gasoline', color: '#3b82f6' },
  { key: 'diesel', label: 'Diesel', color: '#f59e0b' },
  { key: 'crudeOil', label: 'Crude Oil', color: '#ef4444' },
] as const;

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
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
            <span className="text-xs font-semibold" style={{ color: entry.color }}>
              {formatCurrency(entry.value as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;
  return (
    <div className="flex items-center justify-center gap-4 mb-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function FuelPriceChart({ data }: FuelPriceChartProps) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Fuel Prices</h3>
        <p className="text-xs text-muted-foreground mt-0.5">USD per gallon / barrel</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
              tickFormatter={(val: number) => `$${val.toFixed(val >= 10 ? 0 : 2)}`}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '3 3' }} />
            <Legend content={<CustomLegend />} verticalAlign="top" />
            {FUEL_LINES.map((fuel) => (
              <Line
                key={fuel.key}
                type="monotone"
                dataKey={fuel.key}
                name={fuel.label}
                stroke={fuel.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
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
