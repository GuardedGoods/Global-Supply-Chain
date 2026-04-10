import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cache.service';
import { NewsData, NewsArticle } from '../../../shared/types/news';
import { ApiResponse } from '../../../shared/types/api';

export const newsRouter = Router();

newsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const cached = cacheService.get<NewsData>('news');

    if (cached) {
      const response: ApiResponse<NewsData> = {
        data: cached,
        timestamp: new Date().toISOString(),
        cached: true,
      };
      return res.json(response);
    }

    const defaults: NewsData = {
      articles: [],
      lastUpdated: new Date().toISOString(),
    };

    const response: ApiResponse<NewsData> = {
      data: defaults,
      timestamp: new Date().toISOString(),
      cached: false,
    };
    return res.json(response);
  } catch (error) {
    console.error('Error fetching news data:', error);
    return res.status(500).json({
      error: 'Failed to fetch news data',
      timestamp: new Date().toISOString(),
    });
  }
});

newsRouter.get('/search', (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || '').toLowerCase().trim();

    if (!query) {
      return res.status(400).json({
        error: 'Query parameter "q" is required',
        timestamp: new Date().toISOString(),
      });
    }

    const cached = cacheService.get<NewsData>('news');

    if (cached) {
      const filtered: NewsArticle[] = cached.articles.filter((article) =>
        article.title.toLowerCase().includes(query)
      );

      const response: ApiResponse<NewsArticle[]> = {
        data: filtered,
        timestamp: new Date().toISOString(),
        cached: true,
      };
      return res.json(response);
    }

    const response: ApiResponse<NewsArticle[]> = {
      data: [],
      timestamp: new Date().toISOString(),
      cached: false,
    };
    return res.json(response);
  } catch (error) {
    console.error('Error searching news:', error);
    return res.status(500).json({
      error: 'Failed to search news',
      timestamp: new Date().toISOString(),
    });
  }
});
