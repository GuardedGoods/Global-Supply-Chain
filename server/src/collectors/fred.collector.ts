import { BaseCollector } from './base.collector';
import type {
  CommoditiesData,
  CommodityPrice,
  CommodityHistory,
} from '../../../shared/types/commodities';
import type {
  EconomicData,
  EconomicIndicator,
  EconomicHistory,
} from '../../../shared/types/economic';

// ── FRED series configuration ───────────────────────────────────────────────
interface SeriesDef {
  seriesId: string;
  name: string;
  unit: string;
  category: 'agricultural' | 'energy' | 'metals';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  type: 'commodity' | 'economic';
}

const COMMODITY_SERIES: SeriesDef[] = [
  { seriesId: 'DCOILWTICO', name: 'WTI Crude Oil', unit: '$/barrel', category: 'energy', frequency: 'daily', type: 'commodity' },
  { seriesId: 'GASDESW', name: 'Diesel Fuel', unit: '$/gallon', category: 'energy', frequency: 'weekly', type: 'commodity' },
  { seriesId: 'WPU0911', name: 'Wheat', unit: 'Index', category: 'agricultural', frequency: 'monthly', type: 'commodity' },
  { seriesId: 'WPU0121', name: 'Corn', unit: 'Index', category: 'agricultural', frequency: 'monthly', type: 'commodity' },
];

const ECONOMIC_SERIES: SeriesDef[] = [
  { seriesId: 'PPIACO', name: 'All Commodities PPI', unit: 'Index', category: 'energy', frequency: 'monthly', type: 'economic' },
  { seriesId: 'CPIAUCSL', name: 'CPI', unit: 'Index', category: 'energy', frequency: 'monthly', type: 'economic' },
  { seriesId: 'GDP', name: 'GDP', unit: 'Billions $', category: 'energy', frequency: 'quarterly', type: 'economic' },
  { seriesId: 'UNRATE', name: 'Unemployment Rate', unit: '%', category: 'energy', frequency: 'monthly', type: 'economic' },
  { seriesId: 'FEDFUNDS', name: 'Fed Funds Rate', unit: '%', category: 'energy', frequency: 'daily', type: 'economic' },
  { seriesId: 'T10Y2Y', name: 'Treasury Yield Spread', unit: '%', category: 'energy', frequency: 'daily', type: 'economic' },
];

const ALL_SERIES = [...COMMODITY_SERIES, ...ECONOMIC_SERIES];

// ── FRED API response shape ─────────────────────────────────────────────────
interface FredObservation {
  date: string;
  value: string;
}
interface FredResponse {
  observations: FredObservation[];
}

// ── Combined output ─────────────────────────────────────────────────────────
export interface FredCollectorResult {
  commodities: CommoditiesData;
  economic: EconomicData;
}

// ── Collector ───────────────────────────────────────────────────────────────
export class FredCollector extends BaseCollector<FredCollectorResult> {
  readonly name = 'fred';

  private get apiKey(): string {
    return process.env.FRED_API_KEY ?? '';
  }

  protected async fetchData(): Promise<FredCollectorResult> {
    if (!this.apiKey) {
      console.warn('[fred] FRED_API_KEY not set — skipping FRED data');
      return this.getDefault();
    }

    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);

    // Fetch all series in parallel
    const results = await Promise.allSettled(
      ALL_SERIES.map(async (s) => {
        const url =
          `https://api.stlouisfed.org/fred/series/observations` +
          `?series_id=${s.seriesId}` +
          `&api_key=${this.apiKey}` +
          `&file_type=json` +
          `&observation_start=${startDate}` +
          `&observation_end=${endDate}` +
          `&sort_order=desc`;
        const resp = await this.httpGet<FredResponse>(url);
        return { def: s, observations: resp.observations ?? [] };
      })
    );

    const commodityPrices: CommodityPrice[] = [];
    const commodityHistory: CommodityHistory[] = [];
    const indicators: EconomicIndicator[] = [];
    const economicHistory: EconomicHistory[] = [];

    for (const r of results) {
      if (r.status === 'rejected') {
        console.warn('[fred] Series fetch failed:', r.reason);
        continue;
      }

      const { def, observations } = r.value;

      // Filter out "." (missing) values and parse
      const points = observations
        .filter((o) => o.value !== '.')
        .map((o) => ({ date: o.date, value: parseFloat(o.value) }))
        .filter((o) => !isNaN(o.value));

      if (points.length === 0) continue;

      // Points are desc-sorted; latest is index 0
      const latest = points[0];
      const previous = points.length > 1 ? points[1] : latest;
      const change = latest.value - previous.value;
      const changePercent = previous.value !== 0 ? (change / Math.abs(previous.value)) * 100 : 0;

      // History in ascending order for charts
      const ascendingPoints = [...points].reverse();

      if (def.type === 'commodity') {
        commodityPrices.push({
          seriesId: def.seriesId,
          name: def.name,
          category: def.category,
          value: latest.value,
          unit: def.unit,
          date: latest.date,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
        });
        commodityHistory.push({
          seriesId: def.seriesId,
          name: def.name,
          data: ascendingPoints,
        });
      } else {
        indicators.push({
          id: def.seriesId,
          name: def.name,
          value: latest.value,
          unit: def.unit,
          date: latest.date,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          frequency: def.frequency,
        });
        economicHistory.push({
          id: def.seriesId,
          name: def.name,
          data: ascendingPoints,
        });
      }
    }

    const now = new Date().toISOString();
    return {
      commodities: { prices: commodityPrices, history: commodityHistory, lastUpdated: now },
      economic: { indicators, history: economicHistory, lastUpdated: now },
    };
  }

  protected getDefault(): FredCollectorResult {
    const now = new Date().toISOString();
    return {
      commodities: { prices: [], history: [], lastUpdated: now },
      economic: { indicators: [], history: [], lastUpdated: now },
    };
  }
}

export const fredCollector = new FredCollector();
