import React from 'react';

interface BarDatum {
  month: string;     // e.g. "May"
  value: number;     // arbitrary numeric value
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  barColor?: string;
  highlightColor?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 160,
  barColor = 'bg-tile',
  highlightColor = 'bg-pine',
}) => {
  if (data.length === 0) {
    return (
      <div className="text-sm text-muted text-center py-8">
        No trend data yet — check back after 2+ months of giving.
      </div>
    );
  }

  const max = Math.max(...data.map(d => d.value), 1);
  const lastIdx = data.length - 1;

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const isCurrent = i === lastIdx;
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center justify-end h-full relative group">
              <div
                className={`w-full rounded-t-lg transition-all duration-300 ${isCurrent ? highlightColor : barColor}`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
              {isCurrent && d.value > 0 && (
                <div className="absolute -top-8 bg-ink text-white text-xs font-semibold px-2 py-1 rounded shadow-soft whitespace-nowrap opacity-100 pointer-events-none">
                  {d.value.toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-2">
        {data.map((d, i) => (
          <div key={d.month} className={`flex-1 text-center text-xs ${i === lastIdx ? 'font-semibold text-ink' : 'text-muted'}`}>
            {d.month}
          </div>
        ))}
      </div>
    </div>
  );
};