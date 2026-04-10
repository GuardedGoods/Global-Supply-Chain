import { cacheService } from '../services/cache.service';

export abstract class BaseCollector<T> {
  abstract readonly name: string;
  readonly ttlSeconds: number = 900; // 15 minutes

  /**
   * Collect data: checks cache first, falls back to fetchData(), caches result.
   */
  async collect(): Promise<T> {
    const cacheKey = `collector:${this.name}`;

    // Check cache first
    try {
      const cached = cacheService.get<T>(cacheKey);
      if (cached !== null) {
        console.log(`[${this.name}] Returning cached data`);
        return cached;
      }
    } catch (err) {
      console.warn(`[${this.name}] Cache read error:`, err);
    }

    // Cache miss — fetch fresh data
    try {
      console.log(`[${this.name}] Cache miss, fetching fresh data...`);
      const data = await this.fetchData();
      // Store in cache
      try {
        cacheService.set(cacheKey, data, this.ttlSeconds);
      } catch (err) {
        console.warn(`[${this.name}] Cache write error:`, err);
      }
      return data;
    } catch (err) {
      console.error(`[${this.name}] Fetch error:`, err);
      // Try stale cache as last resort (re-read without TTL check is not possible,
      // so return a default)
      return this.getDefault();
    }
  }

  /**
   * Subclasses implement this to fetch real data from APIs.
   */
  protected abstract fetchData(): Promise<T>;

  /**
   * Subclasses should return a safe empty default when all else fails.
   */
  protected abstract getDefault(): T;

  /**
   * Helper: perform an HTTP GET using native fetch (Node 20+).
   */
  protected async httpGet<R = unknown>(
    url: string,
    headers?: Record<string, string>,
    timeoutMs: number = 30000
  ): Promise<R> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers ?? {},
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(
          `HTTP ${response.status} ${response.statusText} for ${url}: ${body.slice(0, 200)}`
        );
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as R;
      }
      return (await response.text()) as unknown as R;
    } finally {
      clearTimeout(timer);
    }
  }
}
