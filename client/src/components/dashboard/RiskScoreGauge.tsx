import { cn, getRiskColor } from '@/lib/utils';

interface RiskScoreGaugeProps {
  score: number;
  rating: 'Low' | 'Medium' | 'High' | 'Critical';
  label?: string;
}

export function RiskScoreGauge({ score, rating, label }: RiskScoreGaugeProps) {
  const color = getRiskColor(rating);
  const clampedScore = Math.max(0, Math.min(100, score));

  // SVG circle math
  const size = 200;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth;

  // We draw a 270-degree arc (3/4 of a circle), starting from 135 degrees
  const startAngle = 135;
  const totalArcDeg = 270;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalArcDeg / 360) * circumference;
  const filledLength = (clampedScore / 100) * arcLength;
  const dashOffset = arcLength - filledLength;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform"
        >
          <defs>
            <linearGradient id="gauge-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={0.6} />
              <stop offset="100%" stopColor={color} stopOpacity={0.2} />
            </linearGradient>
            <filter id="gauge-shadow">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={color} floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            className="text-muted/30"
            transform={`rotate(${startAngle} ${center} ${center})`}
          />

          {/* Filled arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(${startAngle} ${center} ${center})`}
            filter="url(#gauge-shadow)"
            className="transition-all duration-1000 ease-out"
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
            }}
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = startAngle + (tick / 100) * totalArcDeg;
            const rad = (angle * Math.PI) / 180;
            const innerR = radius - strokeWidth / 2 - 6;
            const outerR = radius - strokeWidth / 2 - 2;
            return (
              <line
                key={tick}
                x1={center + innerR * Math.cos(rad)}
                y1={center + innerR * Math.sin(rad)}
                x2={center + outerR * Math.cos(rad)}
                y2={center + outerR * Math.sin(rad)}
                stroke="currentColor"
                strokeWidth={1.5}
                className="text-muted-foreground/30"
              />
            );
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-bold tabular-nums transition-colors duration-500"
            style={{ color }}
          >
            {clampedScore}
          </span>
          <span
            className={cn(
              'mt-0.5 text-sm font-semibold rounded-full px-3 py-0.5',
              rating === 'Low' && 'bg-green-500/10 text-green-500',
              rating === 'Medium' && 'bg-amber-500/10 text-amber-500',
              rating === 'High' && 'bg-red-500/10 text-red-500',
              rating === 'Critical' && 'bg-red-700/10 text-red-700'
            )}
          >
            {rating}
          </span>
        </div>
      </div>
      {label && (
        <p className="mt-2 text-xs text-muted-foreground text-center">{label}</p>
      )}
    </div>
  );
}
