import React from 'react';
import { type LucideIcon } from 'lucide-react';

export interface AppBottomNavProps<T extends string = string> {
  tabs: { id: T; label: string; Icon: LucideIcon; badge?: number }[];
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
              className={`relative flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                isActive ? 'text-pine' : 'text-muted hover:text-ink'
              }`}
              aria-label={t.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold">{t.label}</span>
              {t.badge !== undefined && t.badge > 0 && (
                <span className="absolute top-1 right-3 min-w-[14px] h-[14px] bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {t.badge > 9 ? '9+' : t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};