const API_BASE = '/api';

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  commodities: {
    getAll: () => fetchApi('/commodities'),
    getHistory: (seriesId: string) => fetchApi(`/commodities/history/${seriesId}`),
  },
  economic: {
    getAll: () => fetchApi('/economic'),
  },
  weather: {
    getAll: () => fetchApi('/weather'),
    getAlerts: () => fetchApi('/weather/alerts'),
  },
  news: {
    getAll: () => fetchApi('/news'),
    search: (query: string) => fetchApi(`/news/search?q=${encodeURIComponent(query)}`),
  },
  logistics: {
    getAll: () => fetchApi('/logistics'),
    getPorts: () => fetchApi('/logistics/ports'),
  },
  currency: {
    getAll: () => fetchApi('/currency'),
    getHistory: (pair: string) => fetchApi(`/currency/history/${pair}`),
  },
  summary: {
    get: () => fetchApi('/summary'),
  },
  riskAssessment: {
    get: () => fetchApi('/risk-assessment'),
    refresh: () => fetch(`${API_BASE}/risk-assessment/refresh`, { method: 'POST' }).then(r => r.json()),
  },
  health: {
    check: () => fetchApi('/health'),
  },
};
