import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { UssdSimulator } from '../components/Requester/UssdSimulator';
import { PhoneCall } from 'lucide-react';

const NAV = [{ id: 'ussd', label: 'USSD', Icon: PhoneCall }];

export default function UssdSimulatorApp() {
  return (
    <AppShell
      currentView="ussd"
      onViewChange={() => {}}
      navItems={NAV}
      showDrawer={false}
      showBottomNav={false}
    >
      <UssdSimulator />
    </AppShell>
  );
}