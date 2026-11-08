import React from 'react';
import { CheckCircle, Copy, Check, MapPin, Package, ScanLine, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

// Assuming these are passed from the parent or defined in a shared constants file
const BUNDLES = [
  { id: 'Standard Pantry', name: 'Standard Pantry', desc: 'Maize flour, rice, oil, lentils.', Icon: Package, accent: 'text-pine bg-sage' },
  { id: 'Hygiene Kit', name: 'Hygiene & Dignity', desc: 'Soap, sanitary pads, toothpaste.', Icon: Package, accent: 'text-blue-700 bg-blue-50' },
];

const LOCATIONS = [
  { id: 'Kibera Hub', sub: '24/7 • 12 available' },
  { id: 'Mathare Central', sub: '6am-10pm • 18 available' },
  { id: 'Kawangware Station', sub: '24/7 • 4 available' },
];

interface SwapFlowProps {
  swapStep: 'bundle' | 'location' | 'success';
  setSwapStep: (step: 'bundle' | 'location') => void;
  swapBundle: string | null;
  setSwapBundle: (id: string) => void;
  swapLocation: string | null;
  setSwapLocation: (id: string) => void;
  swapResult: any | null;
  swapError: string | null;
  swapping: boolean;
  rateLimited: boolean;
  handleReserve: () => void;
  copyPin: () => void;
  pinCopied: boolean;
  goTab: (tab: 'home') => void;
}

export const SwapFlow: React.FC<SwapFlowProps> = (props) => {
  if (props.swapStep === 'success' && props.swapResult) {
    return (
      <div className="space-y-4 pb-20">
        <div className="text-center pt-6 space-y-2">
          <div className="w-16 h-16 bg-lime text-pine rounded-full flex items-center justify-center mx-auto border border-tile animate-in zoom-in-50 duration-500">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">Locker reserved</h2>
            <p className="text-sm text-muted mt-1">Collect anytime.</p>
          </div>
        </div>

        <Card>
          <div className="pb-3 border-b border-tile flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted">Reference</span>
            <span className="font-mono text-sm font-bold text-ink">REF-{props.swapResult.id.slice(0, 8).toUpperCase()}</span>
          </div>
          
          <div className="flex items-start justify-between gap-4 py-4 border-b border-tile">
            <div>
              <div className="text-xs font-semibold uppercase text-muted">Collection PIN</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-4xl font-bold tracking-widest text-pine animate-in fade-in duration-700">{props.swapResult.pin}</span>
                <button onClick={props.copyPin} className="p-2 rounded-full hover:bg-canvas text-muted transition-colors">
                  {props.pinCopied ? <Check className="w-4 h-4 text-pine" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {/* Placeholder for QR component */}
            <div className="w-16 h-16 bg-canvas rounded border border-tile flex items-center justify-center text-xs text-muted">QR</div>
          </div>

          <div className="pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Bundle</span><span className="font-semibold text-ink">{props.swapResult.bundleCategory}</span></div>
            <div className="flex justify-between"><span className="text-muted">Locker</span><span className="font-semibold text-ink">{props.swapResult.lockerLocation}</span></div>
          </div>
        </Card>

        <Card variant="tile" className="border border-blue-100">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-2">
            <ScanLine className="w-4 h-4" /> How to collect
          </div>
          <ol className="text-sm text-blue-900/80 leading-relaxed list-decimal pl-5 space-y-1">
            <li>Go to {props.swapResult.lockerLocation}</li>
            <li>Enter PIN at the terminal</li>
            <li>Take your bundle</li>
          </ol>
        </Card>

        <Button variant="primary" fullWidth onClick={() => props.goTab('home')}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-xl font-bold text-ink">The Swap</h2>
        <p className="text-sm text-muted mt-1">Reserve a bundle. Collect any time.</p>
      </div>

      {props.rateLimited && (
        <Card className="bg-rose-50 border-rose-200 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm text-rose-900">Daily limit reached. Try again tomorrow.</p>
        </Card>
      )}

      {props.swapError && (
        <Card className="bg-rose-50 border-rose-200 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm text-rose-900">{props.swapError}</p>
        </Card>
      )}

      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          Step {props.swapStep === 'bundle' ? '1' : '2'} of 2 — {props.swapStep === 'bundle' ? 'Choose bundle' : 'Choose location'}
        </div>
        <div className="flex items-center gap-2">
        {(['bundle', 'location'] as const).map((s, i) => {
          const active = props.swapStep === s || (s === 'bundle' && props.swapStep !== 'bundle');
          const done = s === 'bundle' && props.swapStep === 'location';
          return (
            <React.Fragment key={s}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-pine text-white' : 'bg-canvas text-muted border border-tile'}`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < 1 && <div className={`flex-1 h-1 rounded-full ${done ? 'bg-pine' : 'bg-tile'}`} />}
            </React.Fragment>
          );
        })}
        </div>
      </div>

      {props.swapStep === 'bundle' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink">1. Choose bundle</p>
          {BUNDLES.map(b => {
            const I = b.Icon;
            const selected = props.swapBundle === b.id;
            return (
              <button
                key={b.id}
                onClick={() => props.setSwapBundle(b.id)}
                className={`w-full p-4 rounded-[16px] border-2 text-left flex items-start gap-3 transition-all ${selected ? 'border-pine bg-surface shadow-soft' : 'border-tile bg-canvas hover:border-pine/50 hover:shadow-soft'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${b.accent}`}>
                  <I className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-ink">{b.name}</div>
                  <div className="text-sm text-muted mt-1 leading-relaxed">{b.desc}</div>
                </div>
                {selected && <CheckCircle className="w-5 h-5 text-pine shrink-0" />}
              </button>
            );
          })}
          <Button variant="primary" fullWidth onClick={() => props.setSwapStep('location')} disabled={!props.swapBundle}>
            Continue
          </Button>
        </div>
      )}

      {props.swapStep === 'location' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink">2. Choose location</p>
          {LOCATIONS.map(l => {
            const selected = props.swapLocation === l.id;
            return (
              <button
                key={l.id}
                onClick={() => props.setSwapLocation(l.id)}
                className={`w-full p-4 rounded-[16px] border-2 text-left flex items-center gap-3 transition-all ${selected ? 'border-pine bg-surface shadow-soft' : 'border-tile bg-canvas hover:border-pine/50 hover:shadow-soft'}`}
              >
                <MapPin className="w-5 h-5 text-pine shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-ink">{l.id}</div>
                  <div className="text-xs text-muted mt-1">{l.sub}</div>
                </div>
                {selected && <CheckCircle className="w-5 h-5 text-pine shrink-0" />}
              </button>
            );
          })}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => props.setSwapStep('bundle')}>
              Back
            </Button>
            <Button variant="primary" fullWidth onClick={props.handleReserve} disabled={!props.swapLocation || props.swapping || props.rateLimited}>
              {props.swapping ? 'Reserving...' : 'Reserve'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};