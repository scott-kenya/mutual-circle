import React from 'react';
import { type LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  Icon: LucideIcon;
}

interface AppShellProps {
  currentView: string;
  onViewChange: (id: string) => void;
  navItems: NavItem[];
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ currentView, onViewChange, navItems, children }) => {
  return (
    <div className="flex h-[100dvh] bg-canvas overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-tile shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-tile">
          <span className="text-xl font-bold text-ink tracking-tight">Mutual Circle</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.Icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-pine text-white shadow-soft' : 'text-muted hover:bg-tint hover:text-ink'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header (hidden on desktop) */}
        <header className="md:hidden h-14 bg-surface border-b border-tile flex items-center justify-between px-4 shrink-0">
          <span className="text-lg font-bold text-ink">Mutual Circle</span>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-canvas p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav (hidden on desktop) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-tile z-50">
          <div className="flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)]">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.Icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                    active ? 'text-pine' : 'text-muted'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};