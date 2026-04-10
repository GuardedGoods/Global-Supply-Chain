import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Eye,
  BarChart3,
  Globe,
  FileText,
} from 'lucide-react';
import { cn, getRiskBgColor, getRiskColor, formatDate } from '@/lib/utils';
import { RiskScoreGauge } from './RiskScoreGauge';
import type { RiskAssessment } from '../../../../shared/types/api';

interface RiskAssessmentPanelProps {
  assessment: RiskAssessment | null;
  loading: boolean;
}

function SectionHeader({ icon: Icon, title }: { icon: typeof AlertTriangle; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function SkeletonBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-muted animate-pulse"
          style={{ width: `${85 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

const directionIcon = {
  improving: TrendingUp,
  worsening: TrendingDown,
  stable: Minus,
};

const directionColor = {
  improving: 'text-green-500',
  worsening: 'text-red-500',
  stable: 'text-muted-foreground',
};

export function RiskAssessmentPanel({ assessment, loading }: RiskAssessmentPanelProps) {
  if (loading || !assessment) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-5">
            <SkeletonBlock rows={4} />
          </div>
        ))}
      </div>
    );
  }

  const { overallRisk, topRisks, regionalBreakdown, keyTrends, watchItems, summary, generatedAt } =
    assessment;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top row: Gauge + Top Risks + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Risk Score */}
        <div className="glass-card rounded-xl p-5 flex flex-col items-center justify-center">
          <SectionHeader icon={BarChart3} title="Overall Risk Score" />
          <RiskScoreGauge
            score={overallRisk.score}
            rating={overallRisk.rating}
            label={`Last assessed: ${formatDate(generatedAt)}`}
          />
        </div>

        {/* Top 5 Risks */}
        <div className="glass-card rounded-xl p-5">
          <SectionHeader icon={AlertTriangle} title="Top Risks" />
          <div className="space-y-2.5">
            {topRisks.slice(0, 5).map((risk, index) => (
              <div
                key={index}
                className="flex items-start gap-2.5 group"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-muted text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium truncate">{risk.title}</p>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        getRiskBgColor(risk.severity)
                      )}
                    >
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {risk.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="glass-card rounded-xl p-5">
          <SectionHeader icon={FileText} title="Executive Summary" />
          <p className="text-sm leading-relaxed text-foreground/80">
            {summary}
          </p>
        </div>
      </div>

      {/* Bottom row: Regional + Trends + Watch Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Regional Breakdown */}
        <div className="glass-card rounded-xl p-5">
          <SectionHeader icon={Globe} title="Regional Breakdown" />
          <div className="space-y-3">
            {regionalBreakdown.map((region, index) => {
              const color = getRiskColor(region.riskLevel.rating);
              return (
                <div
                  key={index}
                  className="rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold">{region.region}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span
                        className={cn(
                          'text-xs font-medium rounded-full px-2 py-0.5',
                          getRiskBgColor(region.riskLevel.rating)
                        )}
                      >
                        {region.riskLevel.score}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{region.topConcern}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Trends */}
        <div className="glass-card rounded-xl p-5">
          <SectionHeader icon={TrendingUp} title="Key Trends" />
          <div className="space-y-2.5">
            {keyTrends.map((trend, index) => {
              const DirIcon = directionIcon[trend.direction];
              return (
                <div key={index} className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded',
                      trend.direction === 'improving' && 'bg-green-500/10',
                      trend.direction === 'worsening' && 'bg-red-500/10',
                      trend.direction === 'stable' && 'bg-muted'
                    )}
                  >
                    <DirIcon
                      className={cn('h-3 w-3', directionColor[trend.direction])}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{trend.indicator}</p>
                    <p className="text-xs text-muted-foreground">{trend.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Watch Items */}
        <div className="glass-card rounded-xl p-5">
          <SectionHeader icon={Eye} title="Watch Items" />
          <ul className="space-y-2">
            {watchItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
