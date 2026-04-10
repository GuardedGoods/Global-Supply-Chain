import { ExternalLink, Clock } from 'lucide-react';
import { formatRelativeTime, cn } from '@/lib/utils';
import { SentimentBadge } from './SentimentBadge';
import type { NewsArticle } from '../../../../shared/types/news';

interface NewsCardProps {
  article: NewsArticle;
}

const categoryColors: Record<string, string> = {
  trade: 'bg-blue-500/10 text-blue-500',
  tariff: 'bg-amber-500/10 text-amber-500',
  logistics: 'bg-purple-500/10 text-purple-500',
  energy: 'bg-orange-500/10 text-orange-500',
  agriculture: 'bg-green-500/10 text-green-500',
  economic: 'bg-cyan-500/10 text-cyan-500',
  political: 'bg-red-500/10 text-red-500',
  weather: 'bg-sky-500/10 text-sky-500',
};

function getCategoryStyle(category: string): string {
  const key = category.toLowerCase();
  return categoryColors[key] ?? 'bg-muted text-muted-foreground';
}

export function NewsCard({ article }: NewsCardProps) {
  const { title, source, publishedAt, sentiment, tone, category, url } = article;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group block rounded-lg border border-border/50 p-3.5 transition-all duration-200',
        'hover:bg-muted/30 hover:border-border hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h4>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
      </div>

      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <SentimentBadge sentiment={sentiment} tone={tone} />
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', getCategoryStyle(category))}>
          {category}
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="font-medium">{source}</span>
        <span className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {formatRelativeTime(publishedAt)}
        </span>
      </div>
    </a>
  );
}
