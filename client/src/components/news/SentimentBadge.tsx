import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SentimentBadgeProps {
  sentiment: 'positive' | 'negative' | 'neutral';
  tone?: number;
}

const sentimentConfig = {
  positive: {
    icon: ThumbsUp,
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    label: 'Positive',
  },
  negative: {
    icon: ThumbsDown,
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    label: 'Negative',
  },
  neutral: {
    icon: Minus,
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    label: 'Neutral',
  },
};

export function SentimentBadge({ sentiment, tone }: SentimentBadgeProps) {
  const config = sentimentConfig[sentiment];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
        config.bg,
        config.text
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
      {tone != null && (
        <span className="opacity-70 ml-0.5">
          {tone > 0 ? '+' : ''}{tone.toFixed(1)}
        </span>
      )}
    </span>
  );
}
