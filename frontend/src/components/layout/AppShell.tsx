import React, { useState, useEffect } from 'react';
import { type LucideIcon, Menu, X } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  Icon: LucideIcon;
}

interface AppShellProps {
  currentView: string;
  onViewChange: (id: string) => void;
  navItems: NavItem[];
  showDrawer?: boolean;
  showBottomNav?: boolean;
  children: React.ReactNode;
}

const PAGE_TITLES: Record<string, string> = {
  requester: 'Mutual Circle',
  donor: 'Donor Portal',
  console: 'Operations',
  sms: 'SMS Simulator',
  ussd: 'USSD Simulator',
  whatsapp: 'WhatsApp Simulator',
  architecture: 'Architecture',
  bench: 'The Bench',
};

export const AppShell: React.FC<AppShellProps> = ({ currentView, onViewChange, navItems, showDrawer = true, showBottomNav = true, children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [currentView]);

  const handleNav = (id: string) => {
    onViewChange(id);
    setDrawerOpen(false);
  };

  const pageTitle = PAGE_TITLES[currentView] || 'Mutual Circle';

  return (
    <div className="min-h-[100dvh] bg-canvas flex justify-center">
      <div className="w-full max-w-[420px] flex flex-col h-[100dvh] bg-canvas border-x border-tile relative overflow-hidden">

        {/* Header with hamburger */}
        <header className="h-14 bg-surface/90 backdrop-blur-md border-b border-tile flex items-center justify-between px-4 shrink-0 z-20">
          {showDrawer ? (<button onClick={() => setDrawerOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-tint transition-colors" aria-label="Open menu"><Menu className="w-5 h-5 text-ink" /></button>) : (<div className="w-9" />)}
          <span className="text-base font-semibold text-ink truncate">{pageTitle}</span>
          <div className="w-9" />
        </header>

        {/* Content — each page manages its own scroll + bottom nav */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Drawer backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer — full list with long labels, opens from ☰ */}
        <aside
          className={`absolute inset-y-0 left-0 w-72 max-w-[80%] bg-surface border-r border-tile z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-14 flex items-center justify-between px-4 border-b border-tile shrink-0">
            <span className="text-lg font-bold text-ink">Menu</span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 -mr-2 rounded-lg hover:bg-tint transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-ink" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.Icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
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
          <div className="border-t border-tile px-4 py-3 text-xs text-muted">
            <span className="font-mono">v1.0 · dev build</span>
          </div>
        </aside>
      </div>
    </div>
  );
};