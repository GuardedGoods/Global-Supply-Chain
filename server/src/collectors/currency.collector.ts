import { BaseCollector } from './base.collector';
import type {
  CurrencyData,
  ExchangeRate,
  CurrencyHistory,
} from '../../../shared/types/currency';

// ── Frankfurter API response shapes ───────────────────────────────────────
interface FrankfurterLatestResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface FrankfurterTimeSeriesResponse {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}

// ── Target currencies ─────────────────────────────────────────────────────
const TARGET_CURRENCIES = ['CAD', 'MXN', 'EUR', 'GBP', 'JPY', 'CNY'];
const CURRENCY_NAMES: Record<string, string> = {
  CAD: 'Canadian Dollar',
  MXN: 'Mexican Peso',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan',
};

// ── Collector ──────────────────────────────────────────────────────────────
export class CurrencyCollector extends BaseCollector<CurrencyData> {
  readonly name = 'currency';

  protected async fetchData(): Promise<CurrencyData> {
    const targets = TARGET_CURRENCIES.join(',');

    // Calculate date range for historical data (last 30 days)
    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 86_400_000);
    const startStr = this.formatDate(startDate);
    const endStr = this.formatDate(endDate);

    // Fetch latest rates and historical series in parallel
    const [latestResult, historyResult] = await Promise.allSettled([
      this.httpGet<FrankfurterLatestResponse>(
        `https://api.frankfurter.app/latest?from=USD&to=${targets}`
      ),
      this.httpGet<FrankfurterTimeSeriesResponse>(
        `https://api.frankfurter.app/${startStr}..${endStr}?from=USD&to=${targets}`
      ),
    ]);

    if (latestResult.status === 'rejected') {
      console.error('[currency] Failed to fetch latest rates:', latestResult.reason);
      return this.getDefault();
    }

    const latest = latestResult.value;
    const historicalData =
      historyResult.status === 'fulfilled' ? historyResult.value : null;

    if (historyResult.status === 'rejected') {
      console.warn('[currency] Failed to fetch historical rates:', historyResult.reason);
    }

    // Build history lookup: currency -> sorted [{date, rate}]
    const historyMap = new Map<string, { date: string; rate: number }[]>();
    if (historicalData?.rates) {
      for (const currency of TARGET_CURRENCIES) {
        const points: { date: string; rate: number }[] = [];
        for (const [dateStr, dayRates] of Object.entries(historicalData.rates)) {
          if (dayRates[currency] !== undefined) {
            points.push({ date: dateStr, rate: dayRates[currency] });
          }
        }
        points.sort((a, b) => a.date.localeCompare(b.date));
        historyMap.set(currency, points);
      }
    }

    // Build rates array
    const rates: ExchangeRate[] = [];
    const history: CurrencyHistory[] = [];

    for (const currency of TARGET_CURRENCIES) {
      const currentRate = latest.rates[currency];
      if (currentRate === undefined) continue;

      // Calculate change from previous day in history
      const currHistory = historyMap.get(currency) ?? [];
      let change = 0;
      let changePercent = 0;

      if (currHistory.length >= 2) {
        const prevRate = currHistory[currHistory.length - 2].rate;
        change = currentRate - prevRate;
        changePercent =
          prevRate !== 0 ? (change / Math.abs(prevRate)) * 100 : 0;
      }

      rates.push({
        from: 'USD',
        to: currency,
        rate: currentRate,
        date: latest.date,
        change: Math.round(change * 10000) / 10000,
        changePercent: Math.round(changePercent * 100) / 100,
      });

      if (currHistory.length > 0) {
        history.push({
          pair: `USD/${currency}`,
          data: currHistory,
        });
      }
    }

    return {
      rates,
      history,
      lastUpdated: new Date().toISOString(),
    };
  }

  private formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  protected getDefault(): CurrencyData {
    return {
      rates: [],
      history: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const currencyCollector = new CurrencyCollector();
