import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { RequesterView } from './components/Requester/RequesterView';
import { AppShell } from './components/layout/AppShell';
const ConsoleView = React.lazy(() => import('./components/Console/ConsoleView').then(m => ({ default: m.ConsoleView })));
import { DonorView } from './components/Donor/DonorView';
const ArchitectureView = React.lazy(() => import('./components/Architecture/ArchitectureView').then(m => ({ default: m.ArchitectureView })));
const BenchView = React.lazy(() => import('./components/Bench/BenchView').then(m => ({ default: m.BenchView })));
const SmsSimulator = React.lazy(() => import('./components/Requester/SmsSimulator').then(m => ({ default: m.SmsSimulator })));
const UssdSimulator = React.lazy(() => import('./components/Requester/UssdSimulator').then(m => ({ default: m.UssdSimulator })));
const WhatsAppSimulator = React.lazy(() => import('./components/Requester/WhatsAppSimulator').then(m => ({ default: m.WhatsAppSimulator })));
import { ErrorBoundary } from './components/ErrorBoundary';
import { BackendBanner } from './components/Shared/BackendBanner';
import { ToastProvider } from './components/Shared/Toast';
import { LayoutDashboard, User, HeartHandshake, Workflow, MessageCircle, Smartphone, PhoneCall, MessageSquare, RotateCcw , Heart , Bell  , Building2 } from 'lucide-react';

type View = 'requester' | 'sms' | 'ussd' | 'whatsapp' | 'console' | 'donor' | 'architecture' | 'bench';

function App() {
  const [currentView, setCurrentView] = useState<View>('requester');

  const navItems = [
    { id: 'requester', label: 'Mutual Circle', Icon: User },
    { id: 'donor', label: 'Donor Portal', Icon: HeartHandshake },
    { id: 'console', label: 'Operations', Icon: LayoutDashboard },
    { id: 'sms', label: 'SMS', Icon: Smartphone },
    { id: 'ussd', label: 'USSD', Icon: PhoneCall },
    { id: 'whatsapp', label: 'WhatsApp', Icon: MessageSquare },
    { id: 'architecture', label: 'Architecture', Icon: Workflow },
    { id: 'bench', label: 'The Bench', Icon: MessageCircle },
  ];

  const handleReset = () => {
    if (!window.confirm('Reset the entire demo? All state (requests, vouchers, audit log, sessions) will be cleared.')) return;
    try { localStorage.clear(); sessionStorage.clear(); } catch (e) { console.error('[reset] storage clear failed', e); }
    window.location.reload();
  };

  return (
    <ErrorBoundary>
      <AppProvider>
        <ToastProvider>
          <AppShell 
            currentView={currentView} 
            onViewChange={(id) => setCurrentView(id as View)} 
            navItems={navItems}
          >
            <React.Suspense fallback={<div className="p-8 text-center text-sm text-muted">Loading...</div>}>
              {currentView === 'requester' && <RequesterView />}
              {currentView === 'sms' && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-ink">SMS Simulator</h1>
                  <React.Suspense fallback={<div>Loading...</div>}><SmsSimulator /></React.Suspense>
                </div>
              )}
              {currentView === 'ussd' && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-ink">USSD Simulator</h1>
                  <React.Suspense fallback={<div>Loading...</div>}><UssdSimulator /></React.Suspense>
                </div>
              )}
              {currentView === 'whatsapp' && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-ink">WhatsApp Simulator</h1>
                  <React.Suspense fallback={<div>Loading...</div>}><WhatsAppSimulator /></React.Suspense>
                </div>
              )}
              {currentView === 'console' && <React.Suspense fallback={<div>Loading...</div>}><ConsoleView /></React.Suspense>}
              {currentView === 'donor' && <DonorView />}
              {currentView === 'architecture' && <React.Suspense fallback={<div>Loading...</div>}><ArchitectureView /></React.Suspense>}
              {currentView === 'bench' && <React.Suspense fallback={<div>Loading...</div>}><BenchView /></React.Suspense>}
            </React.Suspense>
          </AppShell>
        </ToastProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
