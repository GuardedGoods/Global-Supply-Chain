import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { RiskMap } from '@/components/map/RiskMap';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { RefreshIndicator } from '@/components/common/RefreshIndicator';
import { cn } from '@/lib/utils';
import { CloudLightning, Thermometer, Wind, Droplets, AlertTriangle } from 'lucide-react';
import type { WeatherData } from '../../../shared/types/weather';

export function Weather() {
  const { data, loading, error, refetch } = useApi<WeatherData>(() => api.weather.getAll() as Promise<{ data: WeatherData }>);

  if (loading) return <PageLoader />;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Extreme': return 'border-red-600 bg-red-600/10';
      case 'Severe': return 'border-red-500 bg-red-500/10';
      case 'Moderate': return 'border-amber-500 bg-amber-500/10';
      default: return 'border-yellow-500 bg-yellow-500/10';
    }
  };

  const extremeAlerts = data?.alerts?.filter(a => a.severity === 'Extreme') || [];
  const severeAlerts = data?.alerts?.filter(a => a.severity === 'Severe') || [];
  const moderateAlerts = data?.alerts?.filter(a => a.severity === 'Moderate') || [];
  const minorAlerts = data?.alerts?.filter(a => a.severity === 'Minor') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Weather & Natural Disasters</h2>
          <p className="text-sm text-muted-foreground mt-1">Active weather alerts and forecasts for key logistics hubs</p>
        </div>
        <RefreshIndicator loading={loading} error={error} lastUpdated={data?.lastUpdated} onRefresh={refetch} />
      </div>

      {/* Alert summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 text-center border-l-4 border-red-600">
          <p className="text-2xl font-bold text-red-600">{extremeAlerts.length}</p>
          <p className="text-xs text-muted-foreground">Extreme</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center border-l-4 border-red-500">
          <p className="text-2xl font-bold text-red-500">{severeAlerts.length}</p>
          <p className="text-xs text-muted-foreground">Severe</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center border-l-4 border-amber-500">
          <p className="text-2xl font-bold text-amber-500">{moderateAlerts.length}</p>
          <p className="text-xs text-muted-foreground">Moderate</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center border-l-4 border-yellow-500">
          <p className="text-2xl font-bold text-yellow-500">{minorAlerts.length}</p>
          <p className="text-xs text-muted-foreground">Minor</p>
        </div>
      </div>

      {/* Map */}
      <div className="h-[350px]">
        <RiskMap weatherAlerts={data?.alerts} className="h-full" />
      </div>

      {/* Active Alerts */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Active Alerts ({data?.alerts?.length || 0})
        </h3>
        <div className="space-y-2">
          {data?.alerts?.map((alert) => (
            <div key={alert.id} className={cn('glass-card rounded-lg p-4 border-l-4', getSeverityColor(alert.severity))}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm">{alert.event}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{alert.headline}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.areaDesc}</p>
                </div>
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ml-4',
                  alert.severity === 'Extreme' ? 'bg-red-600/20 text-red-600' :
                  alert.severity === 'Severe' ? 'bg-red-500/20 text-red-500' :
                  alert.severity === 'Moderate' ? 'bg-amber-500/20 text-amber-500' :
                  'bg-yellow-500/20 text-yellow-500'
                )}>
                  {alert.severity}
                </span>
              </div>
              <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                <span>Onset: {new Date(alert.onset).toLocaleString()}</span>
                <span>Expires: {new Date(alert.expires).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {(!data?.alerts || data.alerts.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">No active weather alerts</p>
          )}
        </div>
      </div>

      {/* Forecasts */}
      {data?.forecasts && data.forecasts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Logistics Hub Forecasts</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.forecasts.map((forecast) => (
              <div key={forecast.location} className="glass-card rounded-xl p-4">
                <p className="text-sm font-medium">{forecast.location}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Thermometer className="h-3 w-3 text-orange-400" />
                    <span className="text-xs">{forecast.temperature}°F</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wind className="h-3 w-3 text-blue-400" />
                    <span className="text-xs">{forecast.windSpeed} mph</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Droplets className="h-3 w-3 text-cyan-400" />
                  <span className="text-xs">{forecast.precipitation} mm</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
