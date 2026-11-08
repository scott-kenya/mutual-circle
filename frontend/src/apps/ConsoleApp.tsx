import React from 'react';
import { AppProvider } from '../context/AppContext';
import { ToastProvider } from '../components/Shared/Toast';
import { AppShell } from '../components/layout/AppShell';
import { ConsoleView } from '../components/Console/ConsoleView';
import { LayoutDashboard } from 'lucide-react';

const NAV = [{ id: 'console', label: 'Operations', Icon: LayoutDashboard }];

export default function ConsoleApp() {
  return (
      <AppProvider>
        <ToastProvider>
    <AppShell
      currentView="console"
      onViewChange={() => {}}
      navItems={NAV}
      showDrawer={false}
    >
      <ConsoleView />
    </AppShell>
        </ToastProvider>
      </AppProvider>
  );
}