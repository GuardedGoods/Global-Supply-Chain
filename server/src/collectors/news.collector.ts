import { BaseCollector } from './base.collector';
import type { NewsData, NewsArticle } from '../../../shared/types/news';

// ── GDELT API response shapes ──────────────────────────────────────────────
interface GdeltArticle {
  url: string;
  url_mobile?: string;
  title: string;
  seendate: string;
  socialimage?: string;
  domain: string;
  language: string;
  sourcecountry?: string;
  tone?: number;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

// ── NewsAPI response shapes ────────────────────────────────────────────────
interface NewsApiArticle {
  title: string;
  url: string;
  source: { id: string | null; name: string };
  publishedAt: string;
  description: string | null;
  urlToImage: string | null;
  content: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

// ── Supply-chain keyword categories ────────────────────────────────────────
// Keyword lookup order matters: more-specific categories should come first so
// that (e.g.) "FDA recall" is classified as Regulatory rather than Agriculture.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Regulatory': ['fda', 'epa', 'usda', 'recall', 'compliance', 'regulation', 'regulatory', 'food safety'],
  'Trade': ['tariff', 'trade war', 'trade policy', 'trade deal', 'usmca', 'nafta', 'sanction', 'embargo', 'customs'],
  'Logistics': ['port', 'shipping', 'container', 'vessel', 'maritime', 'freight', 'cargo', 'trucking', 'rail', 'intermodal', 'warehouse'],
  'Energy': ['oil', 'fuel', 'gasoline', 'diesel', 'petroleum', 'opec', 'pipeline', 'natural gas', 'energy'],
  'Weather': ['hurricane', 'storm', 'flood', 'drought', 'wildfire', 'weather', 'climate', 'frost', 'heatwave'],
  'Agriculture': ['harvest', 'crop', 'livestock', 'grain', 'wheat', 'corn', 'soy', 'dairy', 'farm', 'agricultural', 'agriculture'],
  'Geopolitical': ['war', 'conflict', 'geopolitical', 'military', 'tension', 'crisis', 'invasion'],
  'Economic': ['inflation', 'recession', 'pmi', 'jobs', 'unemployment', 'cpi', 'ppi', 'gdp', 'fed', 'interest rate'],
  'Labor': ['strike', 'labor', 'union', 'worker', 'employment', 'workforce', 'walkout'],
  'Technology': ['cyber', 'hack', 'ransomware', 'technology', 'automation', 'semiconductor', 'chip'],
  'Manufacturing': ['factory', 'manufacturing', 'production', 'plant closure'],
};

// ── Collector ──────────────────────────────────────────────────────────────
export class NewsCollector extends BaseCollector<NewsData> {
  readonly name = 'news';

  private get newsApiKey(): string {
    return process.env.NEWSAPI_KEY ?? '';
  }

  protected async fetchData(): Promise<NewsData> {
    const [gdeltResult, newsApiResult] = await Promise.allSettled([
      this.fetchGdelt(),
      this.newsApiKey ? this.fetchNewsApi() : Promise.resolve([]),
    ]);

    const gdeltArticles =
      gdeltResult.status === 'fulfilled' ? gdeltResult.value : [];
    const newsApiArticles =
      newsApiResult.status === 'fulfilled' ? newsApiResult.value : [];

    if (gdeltResult.status === 'rejected') {
      console.warn('[news] GDELT fetch failed:', gdeltResult.reason);
    }
    if (newsApiResult.status === 'rejected') {
      console.warn('[news] NewsAPI fetch failed:', newsApiResult.reason);
    }

    // Merge and deduplicate by URL
    const seen = new Set<string>();
    const merged: NewsArticle[] = [];
    for (const a of [...newsApiArticles, ...gdeltArticles]) {
      const normalizedUrl = a.url.toLowerCase().replace(/\/+$/, '');
      if (!seen.has(normalizedUrl)) {
        seen.add(normalizedUrl);
        merged.push(a);
      }
    }

    // Sort by date descending
    merged.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return {
      articles: merged.slice(0, 50),
      lastUpdated: new Date().toISOString(),
    };
  }

  // ── GDELT ──────────────────────────────────────────────────────────────
  private async fetchGdelt(): Promise<NewsArticle[]> {
    const query = encodeURIComponent(
      'supply chain OR logistics OR shipping OR port congestion OR tariff OR trade policy OR USMCA OR freight rates OR commodity prices OR food safety recall OR FDA OR retail inventory OR packaging shortage OR grain harvest OR food price inflation'
    );
    const url =
      `https://api.gdeltproject.org/api/v2/doc/doc` +
      `?query=${query}` +
      `&mode=artlist` +
      `&maxrecords=30` +
      `&format=json`;

    const resp = await this.httpGet<GdeltResponse>(url);
    const articles = resp?.articles ?? [];

    return articles
      .filter((a) => a.title && a.url)
      .map((a): NewsArticle => {
        // GDELT tone: negative values = negative tone, positive = positive
        const toneValue = a.tone ?? 0;
        const sentiment = this.toneToSentiment(toneValue);
        const category = this.categorize(a.title);

        // Parse GDELT date format: "20240115T120000Z" -> ISO
        const publishedAt = this.parseGdeltDate(a.seendate);

        return {
          title: a.title,
          url: a.url,
          source: a.domain ?? 'Unknown',
          publishedAt,
          tone: Math.round(toneValue * 100) / 100,
          sentiment,
          category,
          imageUrl: a.socialimage || undefined,
          country: a.sourcecountry || undefined,
        };
      });
  }

  private parseGdeltDate(raw: string): string {
    if (!raw) return new Date().toISOString();
    // Format: "20240115T120000Z" or similar
    try {
      const cleaned = raw.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/,
        '$1-$2-$3T$4:$5:$6Z');
      const d = new Date(cleaned);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch {
      // fall through
    }
    // Try direct parse
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch {
      // fall through
    }
    return new Date().toISOString();
  }

  // ── NewsAPI ────────────────────────────────────────────────────────────
  private async fetchNewsApi(): Promise<NewsArticle[]> {
    const url =
      `https://newsapi.org/v2/everything` +
      `?q=supply+chain+logistics` +
      `&sortBy=publishedAt` +
      `&pageSize=20` +
      `&apiKey=${this.newsApiKey}`;

    const resp = await this.httpGet<NewsApiResponse>(url);

    if (resp?.status !== 'ok') {
      console.warn('[news] NewsAPI returned non-ok status:', resp?.status);
      return [];
    }

    return (resp.articles ?? [])
      .filter((a) => a.title && a.url)
      .map((a): NewsArticle => {
        const category = this.categorize(a.title + ' ' + (a.description ?? ''));

        // Rough sentiment from description text
        const toneValue = this.estimateTone(
          a.title + ' ' + (a.description ?? '')
        );
        const sentiment = this.toneToSentiment(toneValue);

        return {
          title: a.title,
          url: a.url,
          source: a.source?.name ?? 'Unknown',
          publishedAt: a.publishedAt,
          tone: toneValue,
          sentiment,
          category,
          summary: a.description ?? undefined,
          imageUrl: a.urlToImage ?? undefined,
        };
      });
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  private toneToSentiment(
    tone: number
  ): 'positive' | 'negative' | 'neutral' {
    if (tone > 2) return 'positive';
    if (tone < -2) return 'negative';
    return 'neutral';
  }

  private categorize(text: string): string {
    const lower = text.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) return category;
      }
    }
    return 'Supply Chain';
  }

  /**
   * Very rough tone estimation from text using positive/negative keyword counts.
   * Returns a number roughly in the -10 to +10 range.
   */
  private estimateTone(text: string): number {
    const lower = text.toLowerCase();
    const positiveWords = [
      'growth', 'improve', 'gain', 'rise', 'boost', 'recover',
      'strong', 'surge', 'expand', 'opportunity', 'success',
      'innovation', 'agreement', 'deal', 'progress',
    ];
    const negativeWords = [
      'decline', 'drop', 'fall', 'loss', 'risk', 'threat',
      'crisis', 'disruption', 'shortage', 'delay', 'war',
      'crash', 'collapse', 'sanction', 'attack', 'strike',
      'shutdown', 'tariff', 'recession', 'inflation',
    ];

    let score = 0;
    for (const w of positiveWords) {
      if (lower.includes(w)) score += 1;
    }
    for (const w of negativeWords) {
      if (lower.includes(w)) score -= 1;
    }

    // Clamp to roughly GDELT-like range
    return Math.max(-10, Math.min(10, score * 1.5));
  }

  protected getDefault(): NewsData {
    return {
      articles: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const newsCollector = new NewsCollector();
