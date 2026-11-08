import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { BenchView } from '../components/Bench/BenchView';
import { MessageCircle } from 'lucide-react';

const NAV = [{ id: 'bench', label: 'The Bench', Icon: MessageCircle }];

export default function BenchApp() {
  return (
    <AppShell
      currentView="bench"
      onViewChange={() => {}}
      navItems={NAV}
      showDrawer={false}
      showBottomNav={false}
    >
      <BenchView />
    </AppShell>
  );
}