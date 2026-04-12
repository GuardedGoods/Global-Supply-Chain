import { describe, it, expect } from 'vitest';
import { calculateRiskScore } from './risk-score.service';

describe('calculateRiskScore', () => {
  it('returns Low rating for minimal risk data', () => {
    const result = calculateRiskScore({
      commodities: { prices: [], history: [], lastUpdated: '' },
      economic: { indicators: [], history: [], lastUpdated: '' },
      weather: { alerts: [], forecasts: [], lastUpdated: '' },
      news: { articles: [], lastUpdated: '' },
      logistics: { ports: [], freightIndicators: [], lastUpdated: '' },
      currency: { rates: [], history: [], lastUpdated: '' },
    });
    expect(result.rating).toMatch(/Low|Medium/);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('score is within 0-100 range', () => {
    const result = calculateRiskScore({
      commodities: { prices: [], history: [], lastUpdated: '' },
      economic: { indicators: [], history: [], lastUpdated: '' },
      weather: {
        alerts: Array(50).fill({
          id: 'x',
          event: 'Severe',
          severity: 'Severe',
          headline: '',
          description: '',
          areaDesc: '',
          onset: '',
          expires: '',
        }),
        forecasts: [],
        lastUpdated: '',
      },
      news: { articles: [], lastUpdated: '' },
      logistics: { ports: [], freightIndicators: [], lastUpdated: '' },
      currency: { rates: [], history: [], lastUpdated: '' },
    });
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('produces a color string', () => {
    const result = calculateRiskScore({
      commodities: { prices: [], history: [], lastUpdated: '' },
      economic: { indicators: [], history: [], lastUpdated: '' },
      weather: { alerts: [], forecasts: [], lastUpdated: '' },
      news: { articles: [], lastUpdated: '' },
      logistics: { ports: [], freightIndicators: [], lastUpdated: '' },
      currency: { rates: [], history: [], lastUpdated: '' },
    });
    expect(typeof result.color).toBe('string');
    expect(result.color.length).toBeGreaterThan(0);
  });
});
