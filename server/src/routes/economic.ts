import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cache.service';
import { EconomicData } from '../../../shared/types/economic';
import { ApiResponse } from '../../../shared/types/api';

export const economicRouter = Router();

economicRouter.get('/', (_req: Request, res: Response) => {
  try {
    const cached = cacheService.get<EconomicData>('economic');

    if (cached) {
      const response: ApiResponse<EconomicData> = {
        data: cached,
        timestamp: new Date().toISOString(),
        cached: true,
      };
      return res.json(response);
    }

    const defaults: EconomicData = {
      indicators: [],
      history: [],
      lastUpdated: new Date().toISOString(),
    };

    const response: ApiResponse<EconomicData> = {
      data: defaults,
      timestamp: new Date().toISOString(),
      cached: false,
    };
    return res.json(response);
  } catch (error) {
    console.error('Error fetching economic data:', error);
    return res.status(500).json({
      error: 'Failed to fetch economic data',
      timestamp: new Date().toISOString(),
    });
  }
});
