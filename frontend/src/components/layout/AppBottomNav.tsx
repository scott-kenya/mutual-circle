import React from 'react';
import { type LucideIcon } from 'lucide-react';

export interface AppBottomNavProps<T extends string = string> {
  tabs: { id: T; label: string; Icon: LucideIcon }[];
  active: T;
  onChange: (id: T) => void;
}

export const AppBottomNav = <T extends string>({ tabs, active, onChange }: AppBottomNavProps<T>) => {
  return (
    <nav className="bg-surface/90 backdrop-blur-md border-t border-tile shrink-0 z-20">
      <div className="flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(t => {
          const Icon = t.Icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                isActive ? 'text-pine' : 'text-muted hover:text-ink'
              }`}
              aria-label={t.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};