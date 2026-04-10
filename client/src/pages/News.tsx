import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { NewsFeed } from '@/components/news/NewsFeed';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { RefreshIndicator } from '@/components/common/RefreshIndicator';
import type { NewsData } from '../../../shared/types/news';

export function News() {
  const { data, loading, error, refetch } = useApi<NewsData>(() => api.news.getAll() as Promise<{ data: NewsData }>);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">News & Geopolitical</h2>
          <p className="text-sm text-muted-foreground mt-1">Supply chain news, trade updates, and geopolitical developments</p>
        </div>
        <RefreshIndicator loading={loading} error={error} lastUpdated={data?.lastUpdated} onRefresh={refetch} />
      </div>

      {/* Sentiment overview */}
      {data?.articles && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {data.articles.filter(a => a.sentiment === 'positive').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Positive</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-500">
              {data.articles.filter(a => a.sentiment === 'neutral').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Neutral</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-500">
              {data.articles.filter(a => a.sentiment === 'negative').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Negative</p>
          </div>
        </div>
      )}

      <NewsFeed articles={data?.articles || []} loading={loading} />
    </div>
  );
}
