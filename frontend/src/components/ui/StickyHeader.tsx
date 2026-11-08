import React from 'react';

interface StickyHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  scrolled?: boolean;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  scrolled = false,
}) => {
  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md bg-surface/85 border-b border-tile transition-shadow duration-200 ${
        scrolled ? 'shadow-soft' : ''
      }`}
    >
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {icon}
          <div className="min-w-0">
            <div className="text-sm font-bold text-ink truncate">{title}</div>
            {subtitle && (
              <div className="text-[11px] text-muted font-mono truncate">{subtitle}</div>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
      </div>
    </header>
  );
};