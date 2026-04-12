import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cache.service';
import { CommoditiesData } from '../../../shared/types/commodities';
import { EconomicData } from '../../../shared/types/economic';
import { WeatherData } from '../../../shared/types/weather';
import { NewsData } from '../../../shared/types/news';
import { LogisticsData } from '../../../shared/types/logistics';
import { CurrencyData } from '../../../shared/types/currency';
import { RiskAssessment } from '../../../shared/types/api';

// ── Simple CSV helper ──────────────────────────────────────────────────────
function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number): string => {
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }
  return lines.join('\n');
}

// ── Helpers ────────────────────────────────────────────────────────────────
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function sendCsv(res: Response, filenameBase: string, body: string): Response {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filenameBase}-${today()}.csv"`
  );
  return res.send(body);
}

function sendCsvNotFound(res: Response, resource: string): Response {
  res.status(404);
  res.setHeader('Content-Type', 'text/csv');
  return res.send(`# No ${resource} data available`);
}

export const exportRouter = Router();

// ── Commodities ────────────────────────────────────────────────────────────
exportRouter.get('/commodities.csv', (_req: Request, res: Response) => {
  try {
    const data = cacheService.get<CommoditiesData>('commodities');
    if (!data || !data.prices || data.prices.length === 0) {
      return sendCsvNotFound(res, 'commodities');
    }

    const headers = [
      'seriesId',
      'name',
      'category',
      'value',
      'unit',
      'date',
      'change',
      'changePercent',
    ];
    const rows: (string | number)[][] = data.prices.map((p) => [
      p.seriesId,
      p.name,
      p.category,
      p.value,
      p.unit,
      p.date,
      p.change,
      p.changePercent,
    ]);
    return sendCsv(res, 'commodities', toCsv(headers, rows));
  } catch (error) {
    console.error('Error exporting commodities CSV:', error);
    res.status(500);
    res.setHeader('Content-Type', 'text/csv');
    return res.send('# Failed to export commodities data');
  }
});

// ── Economic ───────────────────────────────────────────────────────────────
exportRouter.get('/economic.csv', (_req: Request, res: Response) => {
  try {
    const data = cacheService.get<EconomicData>('economic');
    if (!data || !data.indicators || data.indicators.length === 0) {
      return sendCsvNotFound(res, 'economic');
    }

    const headers = [
      'id',
      'name',
      'value',
      'unit',
      'date',
      'change',
      'changePercent',
      'frequency',
    ];
    const rows: (string | number)[][] = data.indicators.map((i) => [
      i.id,
      i.name,
      i.value,
      i.unit,
      i.date,
      i.change,
      i.changePercent,
      i.frequency,
    ]);
    return sendCsv(res, 'economic', toCsv(headers, rows));
  } catch (error) {
    console.error('Error exporting economic CSV:', error);
    res.status(500);
    res.setHeader('Content-Type', 'text/csv');
    return res.send('# Failed to export economic data');
  }
});

// ── Weather ────────────────────────────────────────────────────────────────
exportRouter.get('/weather.csv', (_req: Request, res: Response) => {
  try {
    const data = cacheService.get<WeatherData>('weather');
    if (!data || !data.alerts || data.alerts.length === 0) {
      return sendCsvNotFound(res, 'weather');
    }

    const headers = [
      'id',
      'event',
      'severity',
      'headline',
      'description',
      'areaDesc',
      'onset',
      'expires',
    ];
    const rows: (string | number)[][] = data.alerts.map((a) => [
      a.id,
      a.event,
      a.severity,
      a.headline,
      a.description,
      a.areaDesc,
      a.onset,
      a.expires,
    ]);
    return sendCsv(res, 'weather', toCsv(headers, rows));
  } catch (error) {
    console.error('Error exporting weather CSV:', error);
    res.status(500);
    res.setHeader('Content-Type', 'text/csv');
    return res.send('# Failed to export weather data');
  }
});

// ── News ───────────────────────────────────────────────────────────────────
exportRouter.get('/news.csv', (_req: Request, res: Response) => {
  try {
    const data = cacheService.get<NewsData>('news');
    if (!data || !data.articles || data.articles.length === 0) {
      return sendCsvNotFound(res, 'news');
    }

    const headers = [
      'title',
      'url',
      'source',
      'publishedAt',
      'tone',
      'sentiment',
      'category',
      'summary',
      'country',
    ];
    const rows: (string | number)[][] = data.articles.map((a) => [
      a.title,
      a.url,
      a.source,
      a.publishedAt,
      a.tone,
      a.sentiment,
      a.category,
      a.summary ?? '',
      a.country ?? '',
    ]);
    return sendCsv(res, 'news', toCsv(headers, rows));
  } catch (error) {
    console.error('Error exporting news CSV:', error);
    res.status(500);
    res.setHeader('Content-Type', 'text/csv');
    return res.send('# Failed to export news data');
  }
});

// ── Logistics ──────────────────────────────────────────────────────────────
exportRouter.get('/logistics.csv', (_req: Request, res: Response) => {
  try {
    const data = cacheService.get<LogisticsData>('logistics');
    if (!data || !data.ports || data.ports.length === 0) {
      return sendCsvNotFound(res, 'logistics');
    }

    const headers = [
      'name',
      'location',
      'lat',
      'lon',
      'congestionLevel',
      'avgWaitDays',
      'vesselCount',
    ];
    const rows: (string | number)[][] = data.ports.map((p) => [
      p.name,
      p.location,
      p.lat,
      p.lon,
      p.congestionLevel,
      p.avgWaitDays,
      p.vesselCount,
    ]);
    return sendCsv(res, 'logistics', toCsv(headers, rows));
  } catch (error) {
    console.error('Error exporting logistics CSV:', error);
    res.status(500);
    res.setHeader('Content-Type', 'text/csv');
    return res.send('# Failed to export logistics data');
  }
});

// ── Currency ───────────────────────────────────────────────────────────────
exportRouter.get('/currency.csv', (_req: Request, res: Response) => {
  try {
    const data = cacheService.get<CurrencyData>('currency');
    if (!data || !data.rates || data.rates.length === 0) {
      return sendCsvNotFound(res, 'currency');
    }

    const headers = [
      'from',
      'to',
      'rate',
      'date',
      'change',
      'changePercent',
    ];
    const rows: (string | number)[][] = data.rates.map((r) => [
      r.from,
      r.to,
      r.rate,
      r.date,
      r.change,
      r.changePercent,
    ]);
    return sendCsv(res, 'currency', toCsv(headers, rows));
  } catch (error) {
    console.error('Error exporting currency CSV:', error);
    res.status(500);
    res.setHeader('Content-Type', 'text/csv');
    return res.send('# Failed to export currency data');
  }
});

// ── Risk Assessment ────────────────────────────────────────────────────────
exportRouter.get('/risk-assessment.csv', (_req: Request, res: Response) => {
  try {
    const data = cacheService.get<RiskAssessment>('risk-assessment');
    if (!data) {
      return sendCsvNotFound(res, 'risk-assessment');
    }

    const headers = [
      'section',
      'key',
      'value',
      'severity',
      'category',
      'detail',
    ];
    const rows: (string | number)[][] = [];

    // Overall risk summary
    rows.push([
      'overall',
      'score',
      data.overallRisk?.score ?? '',
      data.overallRisk?.rating ?? '',
      '',
      data.summary ?? '',
    ]);

    // Top risks
    for (const risk of data.topRisks ?? []) {
      rows.push([
        'topRisk',
        risk.title,
        '',
        risk.severity,
        risk.category,
        risk.description,
      ]);
    }

    // Regional breakdown
    for (const region of data.regionalBreakdown ?? []) {
      rows.push([
        'region',
        region.region,
        region.riskLevel?.score ?? '',
        region.riskLevel?.rating ?? '',
        '',
        region.topConcern,
      ]);
    }

    // Key trends
    for (const trend of data.keyTrends ?? []) {
      rows.push([
        'trend',
        trend.indicator,
        '',
        trend.direction,
        '',
        trend.detail,
      ]);
    }

    // Watch items
    for (const watch of data.watchItems ?? []) {
      rows.push(['watchItem', '', '', '', '', watch]);
    }

    return sendCsv(res, 'risk-assessment', toCsv(headers, rows));
  } catch (error) {
    console.error('Error exporting risk assessment CSV:', error);
    res.status(500);
    res.setHeader('Content-Type', 'text/csv');
    return res.send('# Failed to export risk assessment data');
  }
});
