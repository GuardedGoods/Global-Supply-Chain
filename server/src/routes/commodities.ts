import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cache.service';
import { CommoditiesData } from '../../../shared/types/commodities';
import { ApiResponse } from '../../../shared/types/api';

export const commoditiesRouter = Router();

commoditiesRouter.get('/', (_req: Request, res: Response) => {
  try {
    const cached = cacheService.get<CommoditiesData>('commodities');

    if (cached) {
      const response: ApiResponse<CommoditiesData> = {
        data: cached,
        timestamp: new Date().toISOString(),
        cached: true,
      };
      return res.json(response);
    }

    const defaults: CommoditiesData = {
      prices: [],
      history: [],
      lastUpdated: new Date().toISOString(),
    };

    const response: ApiResponse<CommoditiesData> = {
      data: defaults,
      timestamp: new Date().toISOString(),
      cached: false,
    };
    return res.json(response);
  } catch (error) {
    console.error('Error fetching commodities data:', error);
    return res.status(500).json({
      error: 'Failed to fetch commodities data',
      timestamp: new Date().toISOString(),
    });
  }
});

commoditiesRouter.get('/history/:seriesId', (req: Request, res: Response) => {
  try {
    const { seriesId } = req.params;
    const cached = cacheService.get<CommoditiesData>('commodities');

    if (cached) {
      const historyEntry = cached.history.find((h) => h.seriesId === seriesId);

      if (historyEntry) {
        const response: ApiResponse<typeof historyEntry> = {
          data: historyEntry,
          timestamp: new Date().toISOString(),
          cached: true,
        };
        return res.json(response);
      }
    }

    const response: ApiResponse<{ seriesId: string; name: string; data: { date: string; value: number }[] }> = {
      data: { seriesId: String(seriesId), name: '', data: [] },
      timestamp: new Date().toISOString(),
      cached: false,
    };
    return res.json(response);
  } catch (error) {
    console.error('Error fetching commodity history:', error);
    return res.status(500).json({
      error: 'Failed to fetch commodity history',
      timestamp: new Date().toISOString(),
    });
  }
});
