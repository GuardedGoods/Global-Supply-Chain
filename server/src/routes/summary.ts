import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cache.service';
import { generateSummary } from '../services/openai.service';
import { CommoditiesData } from '../../../shared/types/commodities';
import { EconomicData } from '../../../shared/types/economic';
import { WeatherData } from '../../../shared/types/weather';
import { NewsData } from '../../../shared/types/news';
import { LogisticsData } from '../../../shared/types/logistics';
import { CurrencyData } from '../../../shared/types/currency';
import { ApiResponse } from '../../../shared/types/api';

export const summaryRouter = Router();

summaryRouter.get('/', async (_req: Request, res: Response) => {
  try {
    // Check for cached summary first (15-minute TTL)
    const cachedSummary = cacheService.get<string>('summary');

    if (cachedSummary) {
      const response: ApiResponse<string> = {
        data: cachedSummary,
        timestamp: new Date().toISOString(),
        cached: true,
      };
      return res.json(response);
    }

    // Gather all available data from cache
    const commodities = cacheService.get<CommoditiesData>('commodities');
    const economic = cacheService.get<EconomicData>('economic');
    const weather = cacheService.get<WeatherData>('weather');
    const news = cacheService.get<NewsData>('news');
    const logistics = cacheService.get<LogisticsData>('logistics');
    const currency = cacheService.get<CurrencyData>('currency');

    const dataSnapshot = {
      commodities: commodities ? {
        priceCount: commodities.prices.length,
        prices: commodities.prices.slice(0, 10),
        lastUpdated: commodities.lastUpdated,
      } : null,
      economic: economic ? {
        indicatorCount: economic.indicators.length,
        indicators: economic.indicators,
        lastUpdated: economic.lastUpdated,
      } : null,
      weather: weather ? {
        alertCount: weather.alerts.length,
        alerts: weather.alerts.slice(0, 10),
        lastUpdated: weather.lastUpdated,
      } : null,
      news: news ? {
        articleCount: news.articles.length,
        articles: news.articles.slice(0, 10),
        lastUpdated: news.lastUpdated,
      } : null,
      logistics: logistics ? {
        portCount: logistics.ports.length,
        ports: logistics.ports,
        freightIndicators: logistics.freightIndicators,
        lastUpdated: logistics.lastUpdated,
      } : null,
      currency: currency ? {
        rateCount: currency.rates.length,
        rates: currency.rates,
        lastUpdated: currency.lastUpdated,
      } : null,
    };

    const summary = await generateSummary(dataSnapshot);

    // Cache summary for 15 minutes (900 seconds)
    cacheService.set('summary', summary, 900);

    const response: ApiResponse<string> = {
      data: summary,
      timestamp: new Date().toISOString(),
      cached: false,
    };
    return res.json(response);
  } catch (error) {
    console.error('Error generating summary:', error);
    return res.status(500).json({
      error: 'Failed to generate supply chain summary',
      timestamp: new Date().toISOString(),
    });
  }
});
