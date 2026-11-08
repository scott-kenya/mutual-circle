import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { ConsoleView } from '../components/Console/ConsoleView';
import { LayoutDashboard } from 'lucide-react';

const NAV = [{ id: 'console', label: 'Operations', Icon: LayoutDashboard }];

export default function ConsoleApp() {
  return (
    <AppShell
      currentView="console"
      onViewChange={() => {}}
      navItems={NAV}
      showDrawer={false}
    >
      <ConsoleView />
    </AppShell>
  );
}