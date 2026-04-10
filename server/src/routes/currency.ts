import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cache.service';
import { CurrencyData } from '../../../shared/types/currency';
import { ApiResponse } from '../../../shared/types/api';

export const currencyRouter = Router();

currencyRouter.get('/', (_req: Request, res: Response) => {
  try {
    const cached = cacheService.get<CurrencyData>('currency');

    if (cached) {
      const response: ApiResponse<CurrencyData> = {
        data: cached,
        timestamp: new Date().toISOString(),
        cached: true,
      };
      return res.json(response);
    }

    const defaults: CurrencyData = {
      rates: [],
      history: [],
      lastUpdated: new Date().toISOString(),
    };

    const response: ApiResponse<CurrencyData> = {
      data: defaults,
      timestamp: new Date().toISOString(),
      cached: false,
    };
    return res.json(response);
  } catch (error) {
    console.error('Error fetching currency data:', error);
    return res.status(500).json({
      error: 'Failed to fetch currency data',
      timestamp: new Date().toISOString(),
    });
  }
});

currencyRouter.get('/history/:pair', (req: Request, res: Response) => {
  try {
    const { pair } = req.params;
    const cached = cacheService.get<CurrencyData>('currency');

    if (cached) {
      const historyEntry = cached.history.find((h) => h.pair === pair);

      if (historyEntry) {
        const response: ApiResponse<typeof historyEntry> = {
          data: historyEntry,
          timestamp: new Date().toISOString(),
          cached: true,
        };
        return res.json(response);
      }
    }

    const response: ApiResponse<{ pair: string; data: { date: string; rate: number }[] }> = {
      data: { pair: String(pair), data: [] },
      timestamp: new Date().toISOString(),
      cached: false,
    };
    return res.json(response);
  } catch (error) {
    console.error('Error fetching currency history:', error);
    return res.status(500).json({
      error: 'Failed to fetch currency history',
      timestamp: new Date().toISOString(),
    });
  }
});
