import { describe, it, expect, beforeEach } from 'vitest';
import { CacheService } from './cache.service';

// Force test DB path
process.env.NODE_ENV = 'test';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService();
    cache.invalidate('test-key');
  });

  it('returns null for missing key', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('stores and retrieves a value', () => {
    cache.set('test-key', { hello: 'world' }, 60);
    expect(cache.get<{ hello: string }>('test-key')).toEqual({ hello: 'world' });
  });

  it('expires data after TTL', async () => {
    cache.set('test-key', { hello: 'world' }, 0);
    await new Promise(resolve => setTimeout(resolve, 1100));
    expect(cache.get('test-key')).toBeNull();
  });

  it('invalidates a key', () => {
    cache.set('test-key', 'value', 60);
    cache.invalidate('test-key');
    expect(cache.get('test-key')).toBeNull();
  });

  it('overwrites existing key', () => {
    cache.set('test-key', 'v1', 60);
    cache.set('test-key', 'v2', 60);
    expect(cache.get('test-key')).toBe('v2');
  });
});
