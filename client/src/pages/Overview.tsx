import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RiskAssessmentPanel } from '@/components/dashboard/RiskAssessmentPanel';
import { AiSummaryPanel } from '@/components/dashboard/AiSummaryPanel';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { RiskMap } from '@/components/map/RiskMap';
import { WatchlistPanel } from '@/components/dashboard/WatchlistPanel';
import { ScenarioModeler } from '@/components/dashboard/ScenarioModeler';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { BarChart3, Fuel, CloudLightning, DollarSign, TrendingUp, Newspaper } from 'lucide-react';
import type { CommoditiesData } from '../../../shared/types/commodities';
import type { WeatherData } from '../../../shared/types/weather';
import type { EconomicData } from '../../../shared/types/economic';
import type { CurrencyData } from '../../../shared/types/currency';
import type { NewsData } from '../../../shared/types/news';
import type { LogisticsData } from '../../../shared/types/logistics';
import type { RiskAssessment } from '../../../shared/types/api';

export function Overview() {
  const { data: commodities, loading: loadingComm } = useApi<CommoditiesData>(() => api.commodities.getAll() as Promise<{ data: CommoditiesData }>);
  const { data: weather, loading: loadingWeather } = useApi<WeatherData>(() => api.weather.getAll() as Promise<{ data: WeatherData }>);
  const { data: economic, loading: loadingEcon } = useApi<EconomicData>(() => api.economic.getAll() as Promise<{ data: EconomicData }>);
  const { data: currency, loading: loadingCurrency } = useApi<CurrencyData>(() => api.currency.getAll() as Promise<{ data: CurrencyData }>);
  const { data: news } = useApi<NewsData>(() => api.news.getAll() as Promise<{ data: NewsData }>);
  const { data: logistics } = useApi<LogisticsData>(() => api.logistics.getAll() as Promise<{ data: LogisticsData }>);
  const { data: riskAssessment, loading: loadingRisk } = useApi<RiskAssessment>(() => api.riskAssessment.get() as Promise<{ data: RiskAssessment }>);
  const { data: summary, loading: loadingSummary } = useApi<string>(() => api.summary.get() as Promise<{ data: string }>);

  const loading = loadingComm && loadingWeather && loadingEcon && loadingCurrency;

  if (loading) return <PageLoader />;

  // Extract KPI values
  const crudeOil = commodities?.prices?.find(p => p.seriesId === 'DCOILWTICO');
  const cpi = economic?.indicators?.find(i => i.id === 'CPIAUCSL');
  const unemployment = economic?.indicators?.find(i => i.id === 'UNRATE');
  const cadRate = currency?.rates?.find(r => r.to === 'CAD');
  const alertCount = weather?.alerts?.length || 0;
  const negativeNews = news?.articles?.filter(a => a.sentiment === 'negative').length || 0;

  const criticalAlerts = weather?.alerts
    ?.filter(a => a.severity === 'Extreme' || a.severity === 'Severe')
    .map(a => ({
      message: `${a.event}: ${a.headline}`,
      severity: (a.severity === 'Extreme' ? 'Critical' : 'High') as 'Critical' | 'High',
      category: 'Weather',
    })) || [];

  return (
    <div className="space-y-4 md:space-y-6">
      {criticalAlerts.length > 0 && <AlertBanner alerts={criticalAlerts} />}

      <div>
        <h2 className="text-xl md:text-2xl font-bold">Executive Overview</h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">Supply chain risk intelligence at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <KpiCard
          title="Crude Oil (WTI)"
          value={crudeOil ? `$${crudeOil.value.toFixed(2)}` : '--'}
          change={crudeOil?.change || 0}
          changePercent={crudeOil?.changePercent || 0}
          icon={Fuel}
          trend={[]}
        />
        <KpiCard
          title="CPI Index"
          value={cpi ? cpi.value.toFixed(1) : '--'}
          change={cpi?.change || 0}
          changePercent={cpi?.changePercent || 0}
          icon={TrendingUp}
          trend={[]}
        />
        <KpiCard
          title="Unemployment"
          value={unemployment ? `${unemployment.value}%` : '--'}
          change={unemployment?.change || 0}
          changePercent={unemployment?.changePercent || 0}
          icon={BarChart3}
          trend={[]}
        />
        <KpiCard
          title="USD/CAD"
          value={cadRate ? cadRate.rate.toFixed(4) : '--'}
          change={cadRate?.change || 0}
          changePercent={cadRate?.changePercent || 0}
          icon={DollarSign}
          trend={[]}
        />
        <KpiCard
          title="Weather Alerts"
          value={String(alertCount)}
          change={0}
          changePercent={0}
          icon={CloudLightning}
          trend={[]}
        />
        <KpiCard
          title="Risk Headlines"
          value={String(negativeNews)}
          change={0}
          changePercent={0}
          icon={Newspaper}
          trend={[]}
        />
      </div>

      {/* Risk Assessment + Map Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <RiskAssessmentPanel assessment={riskAssessment} loading={loadingRisk} />
        <div className="h-[260px] md:h-[400px]">
          <RiskMap
            weatherAlerts={weather?.alerts}
            ports={logistics?.ports}
            className="h-full"
          />
        </div>
      </div>

      {/* Watchlist + Scenario */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <WatchlistPanel
          commodities={commodities?.prices}
          rates={currency?.rates}
        />
        <ScenarioModeler commodities={commodities?.prices || []} />
      </div>

      {/* AI Summary */}
      <AiSummaryPanel
        summary={typeof summary === 'string' ? summary : null}
        loading={loadingSummary}
      />
    </div>
  );
}
