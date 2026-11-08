import React from 'react';

interface Segment {
  label: string;
  value: number;
  color: string; // Tailwind class like 'stroke-pine' or hex
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  minGroupSizePct?: number; // Hide segments smaller than this (privacy)
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  size = 180,
  strokeWidth = 22,
  minGroupSizePct = 5,
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Filter out tiny segments to prevent re-identification
  const visibleSegments = segments.filter(s => (s.value / total) * 100 >= minGroupSizePct);
  
  // Track how much of the circle we've drawn so far
  let accumulatedAngle = 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-tile opacity-20"
          />
          {visibleSegments.map((segment, i) => {
            const pct = segment.value / total;
            const strokeDasharray = `${circumference * pct} ${circumference}`;
            const strokeDashoffset = -1 * (circumference * accumulatedAngle);
            accumulatedAngle += pct;

            return (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out ${segment.color}`}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            );
          })}
        </svg>
        {/* Inner text (Total) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total</span>
          <span className="text-2xl font-bold text-ink">{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {segments.map(segment => {
          const pct = ((segment.value / total) * 100).toFixed(0);
          const isHidden = (segment.value / total) * 100 < minGroupSizePct;
          
          return (
            <div key={segment.label} className={`flex items-center gap-2 ${isHidden ? 'opacity-40' : ''}`}>
              <div className={`w-3 h-3 rounded-full shrink-0 ${segment.color.replace('stroke-', 'bg-')}`} />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-ink truncate">{segment.label}</div>
                <div className="text-xs text-muted">{isHidden ? '<5%' : `${pct}%`}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};