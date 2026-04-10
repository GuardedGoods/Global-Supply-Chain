import { BaseCollector } from './base.collector';
import type { CommodityPrice, CommodityHistory, CommoditiesData } from '../../../shared/types/commodities';

// ── EIA API v2 response shapes ──────────────────────────────────────────────
interface EiaSeriesRow {
  period: string;
  'area-name'?: string;
  'product-name'?: string;
  'process-name'?: string;
  duoarea?: string;
  product?: string;
  process?: string;
  series?: string;
  value: number | null;
}

interface EiaResponse {
  response: {
    data: EiaSeriesRow[];
    total?: number;
  };
}

// ── Collector ───────────────────────────────────────────────────────────────
export class EiaCollector extends BaseCollector<CommoditiesData> {
  readonly name = 'eia';

  private get apiKey(): string {
    return process.env.EIA_API_KEY ?? '';
  }

  protected async fetchData(): Promise<CommoditiesData> {
    if (!this.apiKey) {
      console.warn('[eia] EIA_API_KEY not set — skipping EIA data');
      return this.getDefault();
    }

    const url =
      `https://api.eia.gov/v2/petroleum/pri/gnd/data/` +
      `?api_key=${this.apiKey}` +
      `&frequency=weekly` +
      `&data[0]=value` +
      `&sort[0][column]=period` +
      `&sort[0][direction]=desc` +
      `&length=52`; // ~1 year of weekly data for history

    const resp = await this.httpGet<EiaResponse>(url);
    const rows = resp?.response?.data ?? [];

    if (rows.length === 0) {
      console.warn('[eia] No data returned from EIA API');
      return this.getDefault();
    }

    // Group rows by product+process (e.g. "Regular Gasoline - Retail")
    const groups = new Map<string, EiaSeriesRow[]>();
    for (const row of rows) {
      const productName = row['product-name'] ?? row.product ?? 'Unknown';
      const processName = row['process-name'] ?? row.process ?? '';
      const areaName = row['area-name'] ?? row.duoarea ?? 'US';
      const key = `${productName}|${processName}|${areaName}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    const prices: CommodityPrice[] = [];
    const history: CommodityHistory[] = [];

    for (const [key, groupRows] of groups) {
      const [productName, processName, areaName] = key.split('|');
      const seriesId = `EIA_${productName}_${areaName}`.replace(/\s+/g, '_').slice(0, 60);
      const label = `${productName}${processName ? ' - ' + processName : ''} (${areaName})`;

      // Filter valid values and sort descending by period
      const valid = groupRows
        .filter((r) => r.value !== null && r.value !== undefined)
        .map((r) => ({ date: r.period, value: r.value as number }))
        .sort((a, b) => b.date.localeCompare(a.date));

      if (valid.length === 0) continue;

      const latest = valid[0];
      const previous = valid.length > 1 ? valid[1] : latest;
      const change = latest.value - previous.value;
      const changePercent = previous.value !== 0 ? (change / Math.abs(previous.value)) * 100 : 0;

      prices.push({
        seriesId,
        name: label,
        category: 'energy',
        value: latest.value,
        unit: '$/gallon',
        date: latest.date,
        change: Math.round(change * 1000) / 1000,
        changePercent: Math.round(changePercent * 100) / 100,
      });

      history.push({
        seriesId,
        name: label,
        data: [...valid].reverse(), // ascending for charts
      });
    }

    return {
      prices,
      history,
      lastUpdated: new Date().toISOString(),
    };
  }

  protected getDefault(): CommoditiesData {
    return { prices: [], history: [], lastUpdated: new Date().toISOString() };
  }
}

export const eiaCollector = new EiaCollector();
