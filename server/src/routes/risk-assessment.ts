import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cache.service';
import { generateAssessment } from '../services/risk-assessment.service';
import { RiskAssessment, ApiResponse } from '../../../shared/types/api';

export const riskAssessmentRouter = Router();

riskAssessmentRouter.get('/', async (_req: Request, res: Response) => {
  try {
    // Check for cached risk assessment first
    const cached = cacheService.get<RiskAssessment>('risk-assessment');

    if (cached) {
      const response: ApiResponse<RiskAssessment> = {
        data: cached,
        timestamp: new Date().toISOString(),
        cached: true,
      };
      return res.json(response);
    }

    // Generate a fresh assessment
    const assessment = await generateAssessment();

    const response: ApiResponse<RiskAssessment> = {
      data: assessment,
      timestamp: new Date().toISOString(),
      cached: false,
    };
    return res.json(response);
  } catch (error) {
    console.error('Error fetching risk assessment:', error);
    return res.status(500).json({
      error: 'Failed to fetch risk assessment',
      timestamp: new Date().toISOString(),
    });
  }
});

riskAssessmentRouter.post('/refresh', async (_req: Request, res: Response) => {
  try {
    // Invalidate existing cached assessment
    cacheService.invalidate('risk-assessment');

    // Generate a fresh assessment
    const assessment = await generateAssessment();

    const response: ApiResponse<RiskAssessment> = {
      data: assessment,
      timestamp: new Date().toISOString(),
      cached: false,
    };
    return res.json(response);
  } catch (error) {
    console.error('Error refreshing risk assessment:', error);
    return res.status(500).json({
      error: 'Failed to refresh risk assessment',
      timestamp: new Date().toISOString(),
    });
  }
});
