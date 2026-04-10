import { CloudLightning, Anchor, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapControlsProps {
  layers: {
    weather: boolean;
    ports: boolean;
  };
  onToggleLayer: (layer: 'weather' | 'ports') => void;
  alertCount: number;
  portCount: number;
}

export function MapControls({ layers, onToggleLayer, alertCount, portCount }: MapControlsProps) {
  return (
    <div className="absolute bottom-3 right-3 flex flex-col gap-1 bg-card/90 backdrop-blur-sm rounded-lg border border-border p-2">
      <div className="flex items-center gap-1 px-1 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        <Layers className="h-3 w-3" />
        Layers
      </div>
      <button
        onClick={() => onToggleLayer('weather')}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
          layers.weather
            ? 'bg-amber-500/10 text-amber-500'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <CloudLightning className="h-3 w-3" />
        Weather ({alertCount})
      </button>
      <button
        onClick={() => onToggleLayer('ports')}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
          layers.ports
            ? 'bg-blue-500/10 text-blue-500'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Anchor className="h-3 w-3" />
        Ports ({portCount})
      </button>
    </div>
  );
}
