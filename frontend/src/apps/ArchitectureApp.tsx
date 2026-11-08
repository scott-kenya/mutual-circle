import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { ArchitectureView } from '../components/Architecture/ArchitectureView';
import { Workflow } from 'lucide-react';

const NAV = [{ id: 'architecture', label: 'Architecture', Icon: Workflow }];

export default function ArchitectureApp() {
  return (
    <AppShell
      currentView="architecture"
      onViewChange={() => {}}
      navItems={NAV}
      showDrawer={false}
      showBottomNav={false}
    >
      <ArchitectureView />
    </AppShell>
  );
}