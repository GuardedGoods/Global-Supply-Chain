import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { RiskMap } from '@/components/map/RiskMap';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { RefreshIndicator } from '@/components/common/RefreshIndicator';
import { cn } from '@/lib/utils';
import { Anchor, Ship, Clock, AlertTriangle } from 'lucide-react';
import type { LogisticsData } from '../../../shared/types/logistics';

export function Logistics() {
  const { data, loading, error, refetch } = useApi<LogisticsData>(() => api.logistics.getAll() as Promise<{ data: LogisticsData }>);

  if (loading) return <PageLoader />;

  const getCongestionBadge = (level: string) => {
    switch (level) {
      case 'Severe': return 'bg-red-500/10 text-red-500';
      case 'High': return 'bg-orange-500/10 text-orange-500';
      case 'Moderate': return 'bg-amber-500/10 text-amber-500';
      default: return 'bg-green-500/10 text-green-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Logistics & Transportation</h2>
          <p className="text-sm text-muted-foreground mt-1">Port congestion, freight indicators, and transportation disruptions</p>
        </div>
        <RefreshIndicator loading={loading} error={error} lastUpdated={data?.lastUpdated} onRefresh={refetch} />
      </div>

      {/* Port summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <Anchor className="h-5 w-5 mx-auto text-primary" />
          <p className="text-2xl font-bold mt-2">{data?.ports?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Ports Tracked</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto text-red-500" />
          <p className="text-2xl font-bold mt-2">
            {data?.ports?.filter(p => p.congestionLevel === 'Severe' || p.congestionLevel === 'High').length || 0}
          </p>
          <p className="text-xs text-muted-foreground">High Congestion</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Clock className="h-5 w-5 mx-auto text-amber-500" />
          <p className="text-2xl font-bold mt-2">
            {data?.ports ? (data.ports.reduce((sum, p) => sum + p.avgWaitDays, 0) / data.ports.length).toFixed(1) : '--'}
          </p>
          <p className="text-xs text-muted-foreground">Avg Wait (Days)</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Ship className="h-5 w-5 mx-auto text-blue-500" />
          <p className="text-2xl font-bold mt-2">
            {data?.ports?.reduce((sum, p) => sum + p.vesselCount, 0) || 0}
          </p>
          <p className="text-xs text-muted-foreground">Total Vessels</p>
        </div>
      </div>

      {/* Map */}
      <div className="h-[350px]">
        <RiskMap ports={data?.ports} className="h-full" />
      </div>

      {/* Port details table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Port Status</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left p-3">Port</th>
              <th className="text-left p-3">Location</th>
              <th className="text-center p-3">Congestion</th>
              <th className="text-right p-3">Avg Wait</th>
              <th className="text-right p-3">Vessels</th>
            </tr>
          </thead>
          <tbody>
            {data?.ports?.map((port) => (
              <tr key={port.name} className="border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors">
                <td className="p-3 text-sm font-medium">{port.name}</td>
                <td className="p-3 text-sm text-muted-foreground">{port.location}</td>
                <td className="p-3 text-center">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getCongestionBadge(port.congestionLevel))}>
                    {port.congestionLevel}
                  </span>
                </td>
                <td className="p-3 text-sm text-right">{port.avgWaitDays} days</td>
                <td className="p-3 text-sm text-right">{port.vesselCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Freight indicators */}
      {data?.freightIndicators && data.freightIndicators.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Freight Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.freightIndicators.map((indicator) => (
              <div key={indicator.name} className="glass-card rounded-xl p-4">
                <p className="text-xs text-muted-foreground">{indicator.name}</p>
                <p className="text-xl font-bold mt-1">{indicator.value} {indicator.unit}</p>
                <p className={cn('text-xs mt-1', indicator.change >= 0 ? 'text-green-500' : 'text-red-500')}>
                  {indicator.change >= 0 ? '+' : ''}{indicator.change.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
