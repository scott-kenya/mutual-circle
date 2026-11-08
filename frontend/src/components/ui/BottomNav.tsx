import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  Icon: LucideIcon;
}

interface BottomNavProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  /** When true, renders as a shrink-0 flex child (for use inside a phone frame).
   *  When false, renders fixed to the viewport (for full-screen pages). */
  contained?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  items,
  activeId,
  onSelect,
  contained = false,
}) => {
  const containerClass = contained
    ? 'shrink-0 backdrop-blur-md bg-surface/95 border-t border-tile'
    : 'fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md bg-surface/85 border-t border-tile pb-[env(safe-area-inset-bottom)]';

  return (
    <nav className={containerClass}>
      <div
        className="grid px-2"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(item => {
          const I = item.Icon;
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex flex-col items-center justify-center py-2 gap-1 transition-colors ${
                active ? 'text-pine' : 'text-muted'
              }`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div
                className={`px-3 py-1 rounded-full transition-colors ${
                  active ? 'bg-tint' : ''
                }`}
              >
                <I className="w-5 h-5" />
              </div>
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};