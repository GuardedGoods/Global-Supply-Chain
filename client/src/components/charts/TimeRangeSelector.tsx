import { cn } from '@/lib/utils';

interface TimeRangeSelectorProps {
  ranges: string[];
  selected: string;
  onChange: (range: string) => void;
}

export function TimeRangeSelector({ ranges, selected, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200',
            range === selected
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}
