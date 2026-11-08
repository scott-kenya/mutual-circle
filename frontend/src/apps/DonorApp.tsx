import React from 'react';
import { AppProvider } from '../context/AppContext';
import { ToastProvider } from '../components/Shared/Toast';
import { AppShell } from '../components/layout/AppShell';
import { DonorView } from '../components/Donor/DonorView';
import { HeartHandshake } from 'lucide-react';

const NAV = [{ id: 'donor', label: 'Donor Portal', Icon: HeartHandshake }];

export default function DonorApp() {
  return (
      <AppProvider>
        <ToastProvider>
    <AppShell
      currentView="donor"
      onViewChange={() => {}}
      navItems={NAV}
      showDrawer={false}
    >
      <DonorView />
    </AppShell>
        </ToastProvider>
      </AppProvider>
  );
}