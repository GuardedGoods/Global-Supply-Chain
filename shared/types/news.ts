export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  tone: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  summary?: string;
  imageUrl?: string;
  country?: string;
}

export interface NewsData {
  articles: NewsArticle[];
  lastUpdated: string;
}
