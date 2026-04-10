import { cacheService } from './cache.service';
import { generateRiskAssessment } from './openai.service';
import { calculateRiskScore } from './risk-score.service';
import { getDb } from '../db/schema';
import { RiskAssessment, RiskItem } from '../../../shared/types/api';
import { CommoditiesData } from '../../../shared/types/commodities';
import { EconomicData } from '../../../shared/types/economic';
import { WeatherData } from '../../../shared/types/weather';
import { NewsData } from '../../../shared/types/news';
import { LogisticsData } from '../../../shared/types/logistics';
import { CurrencyData } from '../../../shared/types/currency';

/**
 * Gathers all available data from cache and generates a comprehensive
 * AI-powered risk assessment. Falls back to the risk-score service
 * for a basic assessment if OpenAI is unavailable or fails.
 */
export async function generateAssessment(): Promise<RiskAssessment> {
  // Gather all cached data
  const commodities = cacheService.get<CommoditiesData>('commodities');
  const economic = cacheService.get<EconomicData>('economic');
  const weather = cacheService.get<WeatherData>('weather');
  const news = cacheService.get<NewsData>('news');
  const logistics = cacheService.get<LogisticsData>('logistics');
  const currency = cacheService.get<CurrencyData>('currency');

  const allData = {
    commodities: commodities ? {
      priceCount: commodities.prices.length,
      prices: commodities.prices,
      lastUpdated: commodities.lastUpdated,
    } : null,
    economic: economic ? {
      indicatorCount: economic.indicators.length,
      indicators: economic.indicators,
      lastUpdated: economic.lastUpdated,
    } : null,
    weather: weather ? {
      alertCount: weather.alerts.length,
      alerts: weather.alerts.slice(0, 15),
      forecastCount: weather.forecasts.length,
      forecasts: weather.forecasts.slice(0, 10),
      lastUpdated: weather.lastUpdated,
    } : null,
    news: news ? {
      articleCount: news.articles.length,
      articles: news.articles.slice(0, 15),
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

  let assessment: RiskAssessment;

  try {
    // Attempt AI-powered assessment via OpenAI
    assessment = await generateRiskAssessment(allData);
  } catch (error) {
    console.error('OpenAI risk assessment failed, falling back to calculated score:', error);
    assessment = buildFallbackAssessment({ commodities, economic, weather, news, logistics, currency });
  }

  // Cache the assessment (15-minute TTL)
  cacheService.set('risk-assessment', assessment, 900);

  // Store in risk_assessments history table
  try {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      'INSERT INTO risk_assessments (assessment, created_at) VALUES (?, ?)'
    ).run(JSON.stringify(assessment), now);
  } catch (dbError) {
    console.error('Failed to store risk assessment in history:', dbError);
  }

  return assessment;
}

/**
 * Builds a basic risk assessment using the risk-score service
 * when AI generation is not available.
 */
function buildFallbackAssessment(data: {
  commodities: CommoditiesData | null;
  economic: EconomicData | null;
  weather: WeatherData | null;
  news: NewsData | null;
  logistics: LogisticsData | null;
  currency: CurrencyData | null;
}): RiskAssessment {
  const overallRisk = calculateRiskScore(data);

  const topRisks: RiskItem[] = [];

  // Derive top risks from available data
  if (data.weather && data.weather.alerts.length > 0) {
    const severeAlerts = data.weather.alerts.filter(
      (a) => a.severity === 'Severe' || a.severity === 'Extreme'
    );
    topRisks.push({
      title: `${data.weather.alerts.length} Active Weather Alert${data.weather.alerts.length !== 1 ? 's' : ''}`,
      severity: severeAlerts.length > 0 ? ('High' as const) : ('Medium' as const),
      category: 'Weather',
      description: `${severeAlerts.length} severe/extreme alerts affecting supply chain corridors. Areas: ${data.weather.alerts.slice(0, 3).map((a) => a.areaDesc).join(', ')}.`,
    });
  }

  if (data.commodities && data.commodities.prices.length > 0) {
    const volatilePrices = data.commodities.prices.filter(
      (p) => Math.abs(p.changePercent) > 3
    );
    if (volatilePrices.length > 0) {
      topRisks.push({
        title: 'Commodity Price Volatility',
        severity: volatilePrices.some((p) => Math.abs(p.changePercent) > 5) ? ('High' as const) : ('Medium' as const),
        category: 'Commodities',
        description: `${volatilePrices.length} commodities showing significant price movement: ${volatilePrices.slice(0, 3).map((p) => `${p.name} (${p.changePercent > 0 ? '+' : ''}${p.changePercent.toFixed(1)}%)`).join(', ')}.`,
      });
    }
  }

  if (data.logistics && data.logistics.ports.length > 0) {
    const congestedPorts = data.logistics.ports.filter(
      (p) => p.congestionLevel === 'High' || p.congestionLevel === 'Severe'
    );
    if (congestedPorts.length > 0) {
      topRisks.push({
        title: 'Port Congestion',
        severity: congestedPorts.some((p) => p.congestionLevel === 'Severe') ? ('High' as const) : ('Medium' as const),
        category: 'Logistics',
        description: `${congestedPorts.length} ports experiencing elevated congestion: ${congestedPorts.slice(0, 3).map((p) => `${p.name} (${p.avgWaitDays}d wait)`).join(', ')}.`,
      });
    }
  }

  if (data.news && data.news.articles.length > 0) {
    const negativeArticles = data.news.articles.filter((a) => a.sentiment === 'negative');
    const negativeRatio = negativeArticles.length / data.news.articles.length;
    if (negativeRatio > 0.3) {
      topRisks.push({
        title: 'Negative News Sentiment',
        severity: negativeRatio > 0.5 ? ('High' as const) : ('Medium' as const),
        category: 'News',
        description: `${Math.round(negativeRatio * 100)}% of recent supply chain news carries negative sentiment, indicating potential disruption concerns.`,
      });
    }
  }

  if (data.currency && data.currency.rates.length > 0) {
    const volatileRates = data.currency.rates.filter(
      (r) => Math.abs(r.changePercent) > 1
    );
    if (volatileRates.length > 0) {
      topRisks.push({
        title: 'Currency Volatility',
        severity: volatileRates.some((r) => Math.abs(r.changePercent) > 2) ? ('High' as const) : ('Medium' as const),
        category: 'Currency',
        description: `Notable exchange rate movements: ${volatileRates.slice(0, 3).map((r) => `${r.from}/${r.to} (${r.changePercent > 0 ? '+' : ''}${r.changePercent.toFixed(2)}%)`).join(', ')}.`,
      });
    }
  }

  // Ensure we have exactly 5 top risks by padding with defaults
  const defaultRisks = [
    {
      title: 'Baseline Market Volatility',
      severity: 'Low' as const,
      category: 'Market',
      description: 'Normal market fluctuations across commodity and financial markets.',
    },
    {
      title: 'Seasonal Weather Patterns',
      severity: 'Low' as const,
      category: 'Weather',
      description: 'Standard seasonal weather may affect logistics schedules.',
    },
    {
      title: 'Trade Policy Monitoring',
      severity: 'Low' as const,
      category: 'Policy',
      description: 'Ongoing monitoring of trade policies across USMCA corridors.',
    },
    {
      title: 'Infrastructure Capacity',
      severity: 'Low' as const,
      category: 'Logistics',
      description: 'Continuous monitoring of transport and port infrastructure capacity.',
    },
    {
      title: 'Economic Cycle Monitoring',
      severity: 'Low' as const,
      category: 'Economic',
      description: 'Tracking economic indicators for potential downstream supply chain impacts.',
    },
  ];

  while (topRisks.length < 5) {
    const filler = defaultRisks[topRisks.length];
    if (filler) {
      topRisks.push(filler);
    } else {
      break;
    }
  }

  const regionalBreakdown = [
    {
      region: 'United States',
      riskLevel: { ...overallRisk },
      topConcern: data.weather && data.weather.alerts.length > 0
        ? `${data.weather.alerts.length} weather alerts may impact logistics operations.`
        : 'Standard operating conditions across major supply chain corridors.',
    },
    {
      region: 'Canada',
      riskLevel: {
        score: Math.max(1, overallRisk.score - 5),
        rating: scoreToRating(Math.max(1, overallRisk.score - 5)),
        color: scoreToColor(Math.max(1, overallRisk.score - 5)),
      },
      topConcern: 'Monitoring cross-border trade flows and seasonal impacts.',
    },
    {
      region: 'Mexico',
      riskLevel: {
        score: Math.min(100, overallRisk.score + 3),
        rating: scoreToRating(Math.min(100, overallRisk.score + 3)),
        color: scoreToColor(Math.min(100, overallRisk.score + 3)),
      },
      topConcern: 'Tracking manufacturing output and trade corridor stability.',
    },
  ];

  const keyTrends = [
    {
      indicator: 'Overall Supply Chain Health',
      direction: overallRisk.score <= 40 ? ('stable' as const) : ('worsening' as const),
      detail: `Current risk score is ${overallRisk.score}/100 (${overallRisk.rating}).`,
    },
    {
      indicator: 'Commodity Markets',
      direction: (data.commodities?.prices.some((p) => Math.abs(p.changePercent) > 3) ? 'worsening' : 'stable') as 'improving' | 'worsening' | 'stable',
      detail: data.commodities
        ? `Tracking ${data.commodities.prices.length} commodity prices.`
        : 'Awaiting commodity data collection.',
    },
    {
      indicator: 'Logistics Networks',
      direction: (data.logistics?.ports.some((p) => p.congestionLevel === 'High' || p.congestionLevel === 'Severe') ? 'worsening' : 'stable') as 'improving' | 'worsening' | 'stable',
      detail: data.logistics
        ? `Monitoring ${data.logistics.ports.length} ports.`
        : 'Awaiting logistics data collection.',
    },
  ];

  return {
    overallRisk,
    topRisks: topRisks.slice(0, 5),
    regionalBreakdown,
    keyTrends,
    watchItems: [
      'Weather system developments affecting major trade routes',
      'Commodity price trends in energy and agricultural sectors',
      'Port congestion levels at major North American ports',
      'Currency exchange rate movements for USD/CAD and USD/MXN',
    ],
    generatedAt: new Date().toISOString(),
    summary: `The North American supply chain risk level is currently rated as ${overallRisk.rating} with a score of ${overallRisk.score}/100. This assessment is based on automated analysis of ${data.weather?.alerts.length || 0} weather alerts, ${data.commodities?.prices.length || 0} commodity prices, ${data.news?.articles.length || 0} news articles, ${data.logistics?.ports.length || 0} port statuses, and ${data.currency?.rates.length || 0} exchange rates. A more detailed AI-powered assessment will be available when the OpenAI API key is configured.`,
  };
}

function scoreToRating(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score <= 25) return 'Low';
  if (score <= 50) return 'Medium';
  if (score <= 75) return 'High';
  return 'Critical';
}

function scoreToColor(score: number): string {
  if (score <= 25) return 'green';
  if (score <= 50) return 'yellow';
  if (score <= 75) return 'orange';
  return 'red';
}
