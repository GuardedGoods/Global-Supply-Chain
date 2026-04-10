import type { WeatherAlert } from '../../../../shared/types/weather';

interface WeatherLayerProps {
  alerts: WeatherAlert[];
  visible: boolean;
}

export function WeatherLayer({ alerts, visible }: WeatherLayerProps) {
  if (!visible || alerts.length === 0) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Extreme': return 'bg-red-600/20 border-red-600';
      case 'Severe': return 'bg-red-500/20 border-red-500';
      case 'Moderate': return 'bg-amber-500/20 border-amber-500';
      default: return 'bg-yellow-500/20 border-yellow-500';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Weather alerts are shown as sidebar list since geo-coordinates may not be available */}
      <div className="absolute top-12 left-3 max-h-48 overflow-y-auto space-y-1 pointer-events-auto">
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className={`text-xs px-2 py-1 rounded border backdrop-blur-sm ${getSeverityColor(alert.severity)}`}
            title={alert.description}
          >
            <span className="font-medium">{alert.event}</span>
            <span className="text-muted-foreground ml-1">- {alert.areaDesc?.slice(0, 40)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
