import { getDb } from '../db/schema';

export class CacheService {
  get<T>(key: string): T | null {
    const db = getDb();
    const row = db.prepare(
      'SELECT data, created_at, ttl_seconds FROM cache WHERE key = ?'
    ).get(key) as { data: string; created_at: number; ttl_seconds: number } | undefined;

    if (!row) return null;

    const now = Math.floor(Date.now() / 1000);
    if (now - row.created_at > row.ttl_seconds) {
      db.prepare('DELETE FROM cache WHERE key = ?').run(key);
      return null;
    }

    return JSON.parse(row.data) as T;
  }

  set(key: string, data: unknown, ttlSeconds: number = 900): void {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      'INSERT OR REPLACE INTO cache (key, data, created_at, ttl_seconds) VALUES (?, ?, ?, ?)'
    ).run(key, JSON.stringify(data), now, ttlSeconds);
  }

  invalidate(key: string): void {
    const db = getDb();
    db.prepare('DELETE FROM cache WHERE key = ?').run(key);
  }

  clearExpired(): void {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      'DELETE FROM cache WHERE (? - created_at) > ttl_seconds'
    ).run(now);
  }
}

export const cacheService = new CacheService();
