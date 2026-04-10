import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cache.service';
import { LogisticsData } from '../../../shared/types/logistics';
import { ApiResponse } from '../../../shared/types/api';

export const logisticsRouter = Router();

logisticsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const cached = cacheService.get<LogisticsData>('logistics');

    if (cached) {
      const response: ApiResponse<LogisticsData> = {
        data: cached,
        timestamp: new Date().toISOString(),
        cached: true,
      };
      return res.json(response);
    }

    const defaults: LogisticsData = {
      ports: [],
      freightIndicators: [],
      lastUpdated: new Date().toISOString(),
    };

    const response: ApiResponse<LogisticsData> = {
      data: defaults,
      timestamp: new Date().toISOString(),
      cached: false,
    };
    return res.json(response);
  } catch (error) {
    console.error('Error fetching logistics data:', error);
    return res.status(500).json({
      error: 'Failed to fetch logistics data',
      timestamp: new Date().toISOString(),
    });
  }
});

logisticsRouter.get('/ports', (_req: Request, res: Response) => {
  try {
    const cached = cacheService.get<LogisticsData>('logistics');

    if (cached) {
      const response: ApiResponse<typeof cached.ports> = {
        data: cached.ports,
        timestamp: new Date().toISOString(),
        cached: true,
      };
      return res.json(response);
    }

    const response: ApiResponse<never[]> = {
      data: [],
      timestamp: new Date().toISOString(),
      cached: false,
    };
    return res.json(response);
  } catch (error) {
    console.error('Error fetching port status:', error);
    return res.status(500).json({
      error: 'Failed to fetch port status',
      timestamp: new Date().toISOString(),
    });
  }
});
