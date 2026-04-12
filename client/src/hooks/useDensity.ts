import { useState, useEffect, useCallback } from 'react';

export type Density = 'comfortable' | 'compact';

export function useDensity() {
  const [density, setDensityState] = useState<Density>(() => {
    if (typeof window === 'undefined') return 'comfortable';
    return (localStorage.getItem('density') as Density) || 'comfortable';
  });

  useEffect(() => {
    document.body.setAttribute('data-density', density);
    localStorage.setItem('density', density);
  }, [density]);

  const toggleDensity = useCallback(() => {
    setDensityState(prev => prev === 'comfortable' ? 'compact' : 'comfortable');
  }, []);

  return { density, toggleDensity };
}
