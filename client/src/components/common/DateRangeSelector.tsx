import { cn } from '@/lib/utils';

export type DateRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  ranges?: DateRange[];
  className?: string;
}

const DEFAULT_RANGES: DateRange[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

export function DateRangeSelector({
  value,
  onChange,
  ranges = DEFAULT_RANGES,
  className,
}: DateRangeSelectorProps) {
  return (
    <div className={cn('inline-flex items-center border border-border rounded overflow-hidden', className)}>
      {ranges.map((range, idx) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={cn(
            'px-2.5 py-1 text-[11px] font-medium transition-colors',
            idx > 0 && 'border-l border-border',
            value === range
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

export function filterByRange<T extends { date: string }>(data: T[], range: DateRange): T[] {
  if (range === 'ALL') return data;
  const now = Date.now();
  const ms = {
    '1W': 7 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000,
    '3M': 90 * 24 * 60 * 60 * 1000,
    '6M': 180 * 24 * 60 * 60 * 1000,
    '1Y': 365 * 24 * 60 * 60 * 1000,
    'ALL': Infinity,
  }[range];
  return data.filter(d => now - new Date(d.date).getTime() <= ms);
}
