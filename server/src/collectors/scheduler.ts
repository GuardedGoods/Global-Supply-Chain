import { EventEmitter } from 'events';
import cron from 'node-cron';
import { fredCollector, type FredCollectorResult } from './fred.collector';
import { eiaCollector } from './eia.collector';
import { weatherCollector } from './weather.collector';
import { newsCollector } from './news.collector';
import { currencyCollector } from './currency.collector';
import { logisticsCollector } from './logistics.collector';
import type { CommoditiesData } from '../../../shared/types/commodities';
import type { EconomicData } from '../../../shared/types/economic';
import type { WeatherData } from '../../../shared/types/weather';
import type { NewsData } from '../../../shared/types/news';
import type { LogisticsData } from '../../../shared/types/logistics';
import type { CurrencyData } from '../../../shared/types/currency';

// ── Event emitter for data updates ─────────────────────────────────────────
export const dataEventEmitter = new EventEmitter();

// ── Latest data store ──────────────────────────────────────────────────────
export interface LatestData {
  commodities: CommoditiesData | null;
  economic: EconomicData | null;
  weather: WeatherData | null;
  news: NewsData | null;
  logistics: LogisticsData | null;
  currency: CurrencyData | null;
}

let latestData: LatestData = {
  commodities: null,
  economic: null,
  weather: null,
  news: null,
  logistics: null,
  currency: null,
};

// ── Individual collector runners ───────────────────────────────────────────
async function runFred(): Promise<void> {
  try {
    const result: FredCollectorResult = await fredCollector.collect();
    latestData.commodities = mergeEiaCommodities(
      result.commodities,
      latestData.commodities
    );
    latestData.economic = result.economic;
    dataEventEmitter.emit('data-updated', 'commodities');
    dataEventEmitter.emit('data-updated', 'economic');
    console.log('[scheduler] FRED data updated');
  } catch (err) {
    console.error('[scheduler] FRED collection failed:', err);
  }
}

async function runEia(): Promise<void> {
  try {
    const result = await eiaCollector.collect();
    // Merge EIA fuel prices into existing commodities
    if (latestData.commodities) {
      latestData.commodities = mergeEiaCommodities(latestData.commodities, null, result);
    } else {
      latestData.commodities = result;
    }
    dataEventEmitter.emit('data-updated', 'commodities');
    console.log('[scheduler] EIA data updated');
  } catch (err) {
    console.error('[scheduler] EIA collection failed:', err);
  }
}

async function runWeather(): Promise<void> {
  try {
    latestData.weather = await weatherCollector.collect();
    dataEventEmitter.emit('data-updated', 'weather');
    console.log('[scheduler] Weather data updated');
  } catch (err) {
    console.error('[scheduler] Weather collection failed:', err);
  }
}

async function runNews(): Promise<void> {
  try {
    latestData.news = await newsCollector.collect();
    dataEventEmitter.emit('data-updated', 'news');
    console.log('[scheduler] News data updated');
  } catch (err) {
    console.error('[scheduler] News collection failed:', err);
  }
}

async function runCurrency(): Promise<void> {
  try {
    latestData.currency = await currencyCollector.collect();
    dataEventEmitter.emit('data-updated', 'currency');
    console.log('[scheduler] Currency data updated');
  } catch (err) {
    console.error('[scheduler] Currency collection failed:', err);
  }
}

async function runLogistics(): Promise<void> {
  try {
    latestData.logistics = await logisticsCollector.collect();
    dataEventEmitter.emit('data-updated', 'logistics');
    console.log('[scheduler] Logistics data updated');
  } catch (err) {
    console.error('[scheduler] Logistics collection failed:', err);
  }
}

/**
 * Merge FRED commodities with EIA commodities, avoiding duplicate seriesIds.
 */
function mergeEiaCommodities(
  base: CommoditiesData,
  _prev: CommoditiesData | null,
  eia?: CommoditiesData
): CommoditiesData {
  if (!eia) return base;

  const existingIds = new Set(base.prices.map((p) => p.seriesId));
  const newPrices = eia.prices.filter((p) => !existingIds.has(p.seriesId));

  const existingHistoryIds = new Set(base.history.map((h) => h.seriesId));
  const newHistory = eia.history.filter((h) => !existingHistoryIds.has(h.seriesId));

  return {
    prices: [...base.prices, ...newPrices],
    history: [...base.history, ...newHistory],
    lastUpdated: new Date().toISOString(),
  };
}

// ── Run all collectors ─────────────────────────────────────────────────────
async function runAllCollectors(): Promise<void> {
  console.log('[scheduler] Running all collectors...');
  const start = Date.now();

  // Run all in parallel — each handles its own errors
  await Promise.allSettled([
    runFred(),
    runEia(),
    runWeather(),
    runNews(),
    runCurrency(),
    runLogistics(),
  ]);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[scheduler] All collectors finished in ${elapsed}s`);
}

// ── Cron management ────────────────────────────────────────────────────────
let cronTask: cron.ScheduledTask | null = null;

/**
 * Start the collection scheduler.
 * Runs all collectors immediately, then every 15 minutes.
 */
export function startScheduler(): void {
  console.log('[scheduler] Starting data collection scheduler');

  // Run immediately on startup (non-blocking)
  runAllCollectors().catch((err) => {
    console.error('[scheduler] Initial collection run failed:', err);
  });

  // Schedule every 15 minutes: "*/15 * * * *"
  cronTask = cron.schedule('*/15 * * * *', () => {
    runAllCollectors().catch((err) => {
      console.error('[scheduler] Scheduled collection run failed:', err);
    });
  });

  console.log('[scheduler] Cron scheduled: every 15 minutes');
}

/**
 * Stop the collection scheduler.
 */
export function stopScheduler(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log('[scheduler] Scheduler stopped');
  }
}

/**
 * Get the latest collected data from all sources.
 */
export function getLatestData(): LatestData {
  return { ...latestData };
}
