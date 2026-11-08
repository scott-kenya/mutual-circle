import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { RequesterView } from '../components/Requester/RequesterView';
import { User } from 'lucide-react';

const NAV = [{ id: 'requester', label: 'Mutual Circle', Icon: User }];

export default function RequesterApp() {
  return (
    <AppShell
      currentView="requester"
      onViewChange={() => {}}
      navItems={NAV}
      showDrawer={false}
    >
      <RequesterView />
    </AppShell>
  );
}