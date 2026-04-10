import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { CommodityChart } from '@/components/charts/CommodityChart';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { RefreshIndicator } from '@/components/common/RefreshIndicator';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { CommoditiesData } from '../../../shared/types/commodities';

export function Commodities() {
  const { data, loading, error, refetch } = useApi<CommoditiesData>(() => api.commodities.getAll() as Promise<{ data: CommoditiesData }>);

  if (loading) return <PageLoader />;

  const agricultural = data?.prices?.filter(p => p.category === 'agricultural') || [];
  const energy = data?.prices?.filter(p => p.category === 'energy') || [];
  const metals = data?.prices?.filter(p => p.category === 'metals') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Commodities & Pricing</h2>
          <p className="text-sm text-muted-foreground mt-1">Track commodity prices impacting supply chain costs</p>
        </div>
        <RefreshIndicator loading={loading} error={error} lastUpdated={data?.lastUpdated} onRefresh={refetch} />
      </div>

      {/* Price summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {data?.prices?.map((commodity) => (
          <div key={commodity.seriesId} className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{commodity.name}</p>
            <p className="text-lg font-bold mt-1">
              {commodity.unit === '$' ? formatCurrency(commodity.value) : `${commodity.value.toFixed(2)} ${commodity.unit}`}
            </p>
            <div className={cn(
              'flex items-center gap-1 text-xs mt-1',
              commodity.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {commodity.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPercent(commodity.changePercent)}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {data?.history && data.history.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.history.map((series) => (
            <div key={series.seriesId} className="glass-card rounded-xl p-4">
              <CommodityChart
                data={series.data}
                name={series.name}
                unit="$"
              />
            </div>
          ))}
        </div>
      )}

      {/* Category sections */}
      {[
        { title: 'Agricultural', items: agricultural },
        { title: 'Energy', items: energy },
        { title: 'Metals', items: metals },
      ].map(({ title, items }) => items.length > 0 && (
        <div key={title}>
          <h3 className="text-lg font-semibold mb-3">{title}</h3>
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left p-3">Commodity</th>
                  <th className="text-right p-3">Price</th>
                  <th className="text-right p-3">Change</th>
                  <th className="text-right p-3">% Change</th>
                  <th className="text-right p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.seriesId} className="border-b border-border/50 last:border-0">
                    <td className="p-3 text-sm font-medium">{item.name}</td>
                    <td className="p-3 text-sm text-right">{formatCurrency(item.value)}</td>
                    <td className={cn('p-3 text-sm text-right', item.change >= 0 ? 'text-green-500' : 'text-red-500')}>
                      {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
                    </td>
                    <td className={cn('p-3 text-sm text-right', item.changePercent >= 0 ? 'text-green-500' : 'text-red-500')}>
                      {formatPercent(item.changePercent)}
                    </td>
                    <td className="p-3 text-sm text-right text-muted-foreground">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
