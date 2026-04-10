import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Alert {
  message: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
}

interface AlertBannerProps {
  alerts: Alert[];
}

const severityStyles: Record<string, string> = {
  Critical: 'bg-red-600/95 text-white border-red-500',
  High: 'bg-red-500/90 text-white border-red-400',
  Medium: 'bg-amber-500/90 text-white border-amber-400',
  Low: 'bg-amber-400/90 text-amber-950 border-amber-300',
};

const severityIcon: Record<string, string> = {
  Critical: 'bg-white/20',
  High: 'bg-white/15',
  Medium: 'bg-white/15',
  Low: 'bg-amber-900/15',
};

export function AlertBanner({ alerts }: AlertBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [isVisible, setIsVisible] = useState(true);

  const visibleAlerts = alerts.filter((_, i) => !dismissed.has(i));

  const goToNext = useCallback(() => {
    if (visibleAlerts.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % visibleAlerts.length);
  }, [visibleAlerts.length]);

  const goToPrev = useCallback(() => {
    if (visibleAlerts.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + visibleAlerts.length) % visibleAlerts.length);
  }, [visibleAlerts.length]);

  // Auto-scroll through alerts
  useEffect(() => {
    if (visibleAlerts.length <= 1) return;
    const interval = setInterval(goToNext, 5000);
    return () => clearInterval(interval);
  }, [visibleAlerts.length, goToNext]);

  // Keep index in bounds when alerts are dismissed
  useEffect(() => {
    if (currentIndex >= visibleAlerts.length && visibleAlerts.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, visibleAlerts.length]);

  if (visibleAlerts.length === 0 || !isVisible) return null;

  const safeIndex = Math.min(currentIndex, visibleAlerts.length - 1);
  const current = visibleAlerts[safeIndex];
  const isCritical = current.severity === 'Critical';

  const handleDismiss = () => {
    // Find the original index in the alerts array
    const originalIndex = alerts.indexOf(current);
    const next = new Set(dismissed);
    next.add(originalIndex);
    setDismissed(next);

    if (next.size === alerts.length) {
      setIsVisible(false);
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300',
        severityStyles[current.severity],
        isCritical && 'risk-pulse'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          severityIcon[current.severity]
        )}
      >
        <AlertTriangle className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {current.severity}
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
            {current.category}
          </span>
        </div>
        <p className="text-sm font-medium truncate">{current.message}</p>
      </div>

      {/* Navigation */}
      {visibleAlerts.length > 1 && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={goToPrev}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Previous alert"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-medium tabular-nums px-1">
            {safeIndex + 1}/{visibleAlerts.length}
          </span>
          <button
            onClick={goToNext}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Next alert"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
