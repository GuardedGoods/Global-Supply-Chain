import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { EconomicTrendChart } from '@/components/charts/EconomicTrendChart';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { RefreshIndicator } from '@/components/common/RefreshIndicator';
import { formatNumber, formatPercent, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { EconomicData } from '../../../shared/types/economic';

export function Economic() {
  const { data, loading, error, refetch } = useApi<EconomicData>(() => api.economic.getAll() as Promise<{ data: EconomicData }>);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Economic Indicators</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Key economic metrics affecting supply chain decisions</p>
        </div>
        <RefreshIndicator loading={loading} error={error} lastUpdated={data?.lastUpdated} onRefresh={refetch} />
      </div>

      {/* Indicator cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {data?.indicators?.map((indicator) => (
          <div key={indicator.id} className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{indicator.name}</p>
            <p className="text-2xl font-bold mt-2">
              {formatNumber(indicator.value)}{indicator.unit === '%' ? '%' : ` ${indicator.unit}`}
            </p>
            <div className={cn(
              'flex items-center gap-1 text-xs mt-2',
              indicator.changePercent > 0 ? 'text-green-500' :
              indicator.changePercent < 0 ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {indicator.changePercent > 0 ? <TrendingUp className="h-3 w-3" /> :
               indicator.changePercent < 0 ? <TrendingDown className="h-3 w-3" /> :
               <Minus className="h-3 w-3" />}
              {formatPercent(indicator.changePercent)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {indicator.frequency} | {indicator.date}
            </p>
          </div>
        ))}
      </div>

      {/* Trend charts */}
      {data?.history && data.history.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {data.history.map((series) => (
            <div key={series.id} className="glass-card rounded-xl p-4">
              <EconomicTrendChart
                data={series.data}
                name={series.name}
                unit=""
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
