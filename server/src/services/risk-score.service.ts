import { RiskLevel } from '../../../shared/types/api';
import { CommoditiesData } from '../../../shared/types/commodities';
import { EconomicData } from '../../../shared/types/economic';
import { WeatherData } from '../../../shared/types/weather';
import { NewsData } from '../../../shared/types/news';
import { LogisticsData } from '../../../shared/types/logistics';
import { CurrencyData } from '../../../shared/types/currency';

interface RiskScoreInput {
  commodities?: CommoditiesData | null;
  economic?: EconomicData | null;
  weather?: WeatherData | null;
  news?: NewsData | null;
  logistics?: LogisticsData | null;
  currency?: CurrencyData | null;
}

/**
 * Calculates weather alert risk score (weight: 25%)
 * More alerts and higher severity = higher risk
 */
function calculateWeatherScore(weather: WeatherData | null | undefined): number {
  if (!weather || weather.alerts.length === 0) return 10;

  const severityWeights: Record<string, number> = {
    Minor: 10,
    Moderate: 30,
    Severe: 60,
    Extreme: 90,
  };

  const totalSeverity = weather.alerts.reduce((sum, alert) => {
    return sum + (severityWeights[alert.severity] || 20);
  }, 0);

  // Normalize: more alerts = higher score, capped at 100
  const alertCountFactor = Math.min(weather.alerts.length / 5, 1);
  const avgSeverity = totalSeverity / weather.alerts.length;
  const score = avgSeverity * 0.6 + alertCountFactor * 100 * 0.4;

  return Math.min(Math.round(score), 100);
}

/**
 * Calculates commodity price volatility risk score (weight: 20%)
 * Higher absolute changePercent values indicate higher risk
 */
function calculateCommodityScore(commodities: CommoditiesData | null | undefined): number {
  if (!commodities || commodities.prices.length === 0) return 15;

  const changes = commodities.prices.map((p) => Math.abs(p.changePercent));

  if (changes.length === 0) return 15;

  const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
  const maxChange = Math.max(...changes);

  // Map volatility to score: 0-2% change is low risk, 5%+ is high risk
  const avgScore = Math.min(avgChange * 15, 80);
  const maxScore = Math.min(maxChange * 10, 100);

  return Math.min(Math.round(avgScore * 0.6 + maxScore * 0.4), 100);
}

/**
 * Calculates news sentiment risk score (weight: 20%)
 * More negative sentiment = higher risk
 */
function calculateNewsScore(news: NewsData | null | undefined): number {
  if (!news || news.articles.length === 0) return 20;

  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  let totalTone = 0;

  for (const article of news.articles) {
    sentimentCounts[article.sentiment]++;
    totalTone += article.tone;
  }

  const total = news.articles.length;
  const negativeRatio = sentimentCounts.negative / total;
  const avgTone = totalTone / total;

  // Higher negative ratio and lower tone = higher risk
  // Tone is typically -1 to 1; negative tone = higher risk
  const ratioScore = negativeRatio * 80;
  const toneScore = Math.max(0, (1 - avgTone) * 40);

  return Math.min(Math.round(ratioScore * 0.5 + toneScore * 0.5), 100);
}

/**
 * Calculates port congestion risk score (weight: 15%)
 * Higher congestion and wait times = higher risk
 */
function calculatePortScore(logistics: LogisticsData | null | undefined): number {
  if (!logistics || logistics.ports.length === 0) return 15;

  const congestionWeights: Record<string, number> = {
    Low: 10,
    Moderate: 35,
    High: 65,
    Severe: 90,
  };

  const congestionScores = logistics.ports.map((port) => {
    const congestionScore = congestionWeights[port.congestionLevel] || 25;
    // Factor in wait time: 0-1 days low, 3+ days high
    const waitScore = Math.min(port.avgWaitDays * 20, 90);
    return congestionScore * 0.6 + waitScore * 0.4;
  });

  const avgScore = congestionScores.reduce((sum, s) => sum + s, 0) / congestionScores.length;

  return Math.min(Math.round(avgScore), 100);
}

/**
 * Calculates economic indicator risk score (weight: 10%)
 * Negative economic changes increase risk
 */
function calculateEconomicScore(economic: EconomicData | null | undefined): number {
  if (!economic || economic.indicators.length === 0) return 20;

  const negativeChanges = economic.indicators.filter((i) => i.change < 0);
  const negativeRatio = negativeChanges.length / economic.indicators.length;

  const avgAbsChange = economic.indicators.reduce(
    (sum, i) => sum + Math.abs(i.changePercent), 0
  ) / economic.indicators.length;

  // Higher ratio of negative changes + larger changes = higher risk
  const ratioScore = negativeRatio * 60;
  const changeScore = Math.min(avgAbsChange * 10, 70);

  return Math.min(Math.round(ratioScore * 0.5 + changeScore * 0.5), 100);
}

/**
 * Calculates currency volatility risk score (weight: 10%)
 * Higher exchange rate volatility = higher risk
 */
function calculateCurrencyScore(currency: CurrencyData | null | undefined): number {
  if (!currency || currency.rates.length === 0) return 15;

  const changes = currency.rates.map((r) => Math.abs(r.changePercent));

  if (changes.length === 0) return 15;

  const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
  const maxChange = Math.max(...changes);

  // Currency changes: 0-0.5% is normal, 1%+ is notable, 3%+ is extreme
  const avgScore = Math.min(avgChange * 30, 80);
  const maxScore = Math.min(maxChange * 20, 100);

  return Math.min(Math.round(avgScore * 0.6 + maxScore * 0.4), 100);
}

/**
 * Maps a numeric risk score to a rating string
 */
function scoreToRating(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score <= 25) return 'Low';
  if (score <= 50) return 'Medium';
  if (score <= 75) return 'High';
  return 'Critical';
}

/**
 * Maps a numeric risk score to a color
 */
function scoreToColor(score: number): string {
  if (score <= 25) return 'green';
  if (score <= 50) return 'yellow';
  if (score <= 75) return 'orange';
  return 'red';
}

/**
 * Calculates a composite risk score (1-100) based on all available data.
 *
 * Weights:
 *   - Weather alerts: 25%
 *   - Commodity price volatility: 20%
 *   - News sentiment: 20%
 *   - Port congestion: 15%
 *   - Economic indicators: 10%
 *   - Currency volatility: 10%
 */
export function calculateRiskScore(data: RiskScoreInput): RiskLevel {
  const weatherScore = calculateWeatherScore(data.weather);
  const commodityScore = calculateCommodityScore(data.commodities);
  const newsScore = calculateNewsScore(data.news);
  const portScore = calculatePortScore(data.logistics);
  const economicScore = calculateEconomicScore(data.economic);
  const currencyScore = calculateCurrencyScore(data.currency);

  const weightedScore = Math.round(
    weatherScore * 0.25 +
    commodityScore * 0.20 +
    newsScore * 0.20 +
    portScore * 0.15 +
    economicScore * 0.10 +
    currencyScore * 0.10
  );

  const finalScore = Math.max(1, Math.min(100, weightedScore));

  return {
    score: finalScore,
    rating: scoreToRating(finalScore),
    color: scoreToColor(finalScore),
  };
}
