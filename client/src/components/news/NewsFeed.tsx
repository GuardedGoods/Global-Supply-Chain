import { useState, useMemo } from 'react';
import { Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NewsCard } from './NewsCard';
import type { NewsArticle } from '../../../../shared/types/news';

interface NewsFeedProps {
  articles: NewsArticle[];
  loading: boolean;
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border/50 p-3.5 space-y-2.5">
      <div className="h-4 w-full rounded bg-muted animate-pulse" />
      <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
      <div className="flex gap-2 mt-1">
        <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
        <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
    </div>
  );
}

export function NewsFeed({ articles, loading }: NewsFeedProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    articles.forEach((a) => cats.add(a.category));
    return ['all', ...Array.from(cats).sort()];
  }, [articles]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') return articles;
    return articles.filter((a) => a.category === activeCategory);
  }, [articles, activeCategory]);

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Newspaper className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">News Feed</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Category filter bar */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition-colors',
              cat === activeCategory
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles list */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Newspaper className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No articles found</p>
            {activeCategory !== 'all' && (
              <button
                onClick={() => setActiveCategory('all')}
                className="text-xs text-primary mt-1 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          filteredArticles.map((article, index) => (
            <NewsCard key={`${article.url}-${index}`} article={article} />
          ))
        )}
      </div>
    </div>
  );
}
