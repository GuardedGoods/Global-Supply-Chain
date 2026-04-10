import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { CurrencyChart } from '@/components/charts/CurrencyChart';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { RefreshIndicator } from '@/components/common/RefreshIndicator';
import { formatPercent, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react';
import type { CurrencyData } from '../../../shared/types/currency';

export function Currency() {
  const { data, loading, error, refetch } = useApi<CurrencyData>(() => api.currency.getAll() as Promise<{ data: CurrencyData }>);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Currency & Trade</h2>
          <p className="text-sm text-muted-foreground mt-1">Exchange rates and currency trends affecting international trade</p>
        </div>
        <RefreshIndicator loading={loading} error={error} lastUpdated={data?.lastUpdated} onRefresh={refetch} />
      </div>

      {/* Rate cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {data?.rates?.map((rate) => (
          <div key={rate.to} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">USD/{rate.to}</p>
            </div>
            <p className="text-xl font-bold mt-2">{rate.rate.toFixed(4)}</p>
            <div className={cn(
              'flex items-center gap-1 text-xs mt-1',
              rate.changePercent > 0 ? 'text-green-500' :
              rate.changePercent < 0 ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {rate.changePercent > 0 ? <TrendingUp className="h-3 w-3" /> :
               rate.changePercent < 0 ? <TrendingDown className="h-3 w-3" /> :
               <Minus className="h-3 w-3" />}
              {formatPercent(rate.changePercent)}
            </div>
          </div>
        ))}
      </div>

      {/* Currency chart */}
      {data?.history && data.history.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">Exchange Rate Trends (30 Days)</h3>
          <CurrencyChart
            data={data.history}
            selectedPairs={data.history.map(h => h.pair)}
          />
        </div>
      )}

      {/* Rate table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Exchange Rate Details</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left p-3">Pair</th>
              <th className="text-right p-3">Rate</th>
              <th className="text-right p-3">Change</th>
              <th className="text-right p-3">% Change</th>
              <th className="text-right p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {data?.rates?.map((rate) => (
              <tr key={rate.to} className="border-b border-border/50 last:border-0">
                <td className="p-3 text-sm font-medium">USD/{rate.to}</td>
                <td className="p-3 text-sm text-right">{rate.rate.toFixed(4)}</td>
                <td className={cn('p-3 text-sm text-right', rate.change >= 0 ? 'text-green-500' : 'text-red-500')}>
                  {rate.change >= 0 ? '+' : ''}{rate.change.toFixed(4)}
                </td>
                <td className={cn('p-3 text-sm text-right', rate.changePercent >= 0 ? 'text-green-500' : 'text-red-500')}>
                  {formatPercent(rate.changePercent)}
                </td>
                <td className="p-3 text-sm text-right text-muted-foreground">{rate.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
