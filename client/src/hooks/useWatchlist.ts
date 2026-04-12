import { useState, useEffect, useCallback } from 'react';

export interface WatchlistItem {
  id: string;
  name: string;
  category: 'commodity' | 'currency' | 'economic' | 'port';
  threshold?: {
    operator: 'gt' | 'lt' | 'change_gt' | 'change_lt';
    value: number;
  };
  addedAt: string;
}

const STORAGE_KEY = 'supply-chain-watchlist';

function load(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WatchlistItem[];
  } catch {
    return [];
  }
}

function save(items: WatchlistItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>(load);

  useEffect(() => {
    save(items);
  }, [items]);

  const add = useCallback((item: Omit<WatchlistItem, 'addedAt'>) => {
    setItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, { ...item, addedAt: new Date().toISOString() }];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const setThreshold = useCallback((id: string, threshold: WatchlistItem['threshold']) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, threshold } : i));
  }, []);

  const has = useCallback((id: string) => {
    return items.some(i => i.id === id);
  }, [items]);

  return { items, add, remove, setThreshold, has };
}
