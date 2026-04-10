import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { RiskMap } from '@/components/map/RiskMap';
import { PageLoader } from '@/components/common/LoadingSpinner';
import type { WeatherData } from '../../../shared/types/weather';
import type { LogisticsData } from '../../../shared/types/logistics';

export function MapView() {
  const { data: weather, loading: loadingWeather } = useApi<WeatherData>(() => api.weather.getAll() as Promise<{ data: WeatherData }>);
  const { data: logistics, loading: loadingLogistics } = useApi<LogisticsData>(() => api.logistics.getAll() as Promise<{ data: LogisticsData }>);

  if (loadingWeather && loadingLogistics) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Risk Map</h2>
        <p className="text-sm text-muted-foreground mt-1">Interactive view of supply chain risks across North America</p>
      </div>

      <div className="h-[calc(100vh-180px)]">
        <RiskMap
          weatherAlerts={weather?.alerts}
          ports={logistics?.ports}
          className="h-full"
        />
      </div>

      {/* Alert sidebar */}
      {weather?.alerts && weather.alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {weather.alerts.slice(0, 9).map((alert) => (
            <div key={alert.id} className="glass-card rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  alert.severity === 'Extreme' ? 'bg-red-600 risk-pulse' :
                  alert.severity === 'Severe' ? 'bg-red-500' :
                  alert.severity === 'Moderate' ? 'bg-amber-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm font-medium truncate">{alert.event}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">{alert.areaDesc}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Expires: {new Date(alert.expires).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
