import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cache.service';
import { WeatherData } from '../../../shared/types/weather';
import { ApiResponse } from '../../../shared/types/api';

export const weatherRouter = Router();

weatherRouter.get('/', (_req: Request, res: Response) => {
  try {
    const cached = cacheService.get<WeatherData>('weather');

    if (cached) {
      const response: ApiResponse<WeatherData> = {
        data: cached,
        timestamp: new Date().toISOString(),
        cached: true,
      };
      return res.json(response);
    }

    const defaults: WeatherData = {
      alerts: [],
      forecasts: [],
      lastUpdated: new Date().toISOString(),
    };

    const response: ApiResponse<WeatherData> = {
      data: defaults,
      timestamp: new Date().toISOString(),
      cached: false,
    };
    return res.json(response);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return res.status(500).json({
      error: 'Failed to fetch weather data',
      timestamp: new Date().toISOString(),
    });
  }
});

weatherRouter.get('/alerts', (_req: Request, res: Response) => {
  try {
    const cached = cacheService.get<WeatherData>('weather');

    if (cached) {
      const response: ApiResponse<typeof cached.alerts> = {
        data: cached.alerts,
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
    console.error('Error fetching weather alerts:', error);
    return res.status(500).json({
      error: 'Failed to fetch weather alerts',
      timestamp: new Date().toISOString(),
    });
  }
});
