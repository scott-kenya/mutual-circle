import React from 'react';
import { ShieldCheck, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Card } from '../ui/Card';

interface SettingsTabProps {
  tokenHash: string | null;
  rate: { count: number; value: number };
  MAX_REQUESTS: number;
  MAX_VALUE: number;
  historyCount: number;
  showServer: boolean;
  setShowServer: (v: boolean) => void;
  onBack: () => void;
  onReset: () => void;
  logout: () => void;
}

const SPEC_COVERAGE = [
  'HMAC token (4.1)',
  'Simulated OTP verification',
  'Per-token rate limits (4.1)',
  'Persistent history',
  'Withdraw flow',
  'The Swap (4.2)',
  'The Pool (4.3)',
  'Hospital ban on clinical data (4.5)',
  'Tier 2/3 escalation (4.8)',
  'The Match + decline (4.4)',
  'The Bench referral (4.9)',
];

export const SettingsTab: React.FC<SettingsTabProps> = (props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Settings</h2>
          <p className="text-sm text-muted mt-1">Account and privacy</p>
        </div>
        <button onClick={props.onBack} className="text-sm font-semibold text-pine hover:underline">
          Back
        </button>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-pine" /> Server View
          </h3>
          <button
            onClick={() => props.setShowServer(!props.showServer)}
            className="text-xs font-semibold text-pine hover:underline flex items-center gap-1"
          >
            {props.showServer ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {props.showServer ? 'Hide' : 'Reveal'}
          </button>
        </div>
        <div className="space-y-2 pt-3 border-t border-tile text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Token (HMAC)</span>
            <span className="text-pine font-semibold truncate ml-2">{props.tokenHash}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Raw phone</span>
            <span className="text-rose-600 font-semibold">{props.showServer ? 'NOT STORED' : '••••••'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Name</span>
            <span className="text-rose-600 font-semibold">NONE</span>
          </div>
          <div className="flex justify-between border-t border-tile pt-2 mt-2">
            <span className="text-muted">Rate (per token)</span>
            <span className="text-ink">{props.rate.count} / {props.MAX_REQUESTS}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Value (per token)</span>
            <span className="text-ink">KES {props.rate.value.toLocaleString()} / {props.MAX_VALUE.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Persisted history</span>
            <span className="text-ink">{props.historyCount} records</span>
          </div>
        </div>
        {props.showServer && (
          <Card className="bg-rose-50 border-rose-200 text-xs text-rose-800 leading-relaxed mt-2">
            <strong>Invariant:</strong> phone number is hashed on verification and immediately discarded. Rate limits and history are keyed to the HMAC token, not the session.
          </Card>
        )}
      </Card>

      <Card variant="tile" className="space-y-2">
        <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Spec Coverage</h4>
        {SPEC_COVERAGE.map(f => (
          <div key={f} className="flex items-center gap-2 text-sm text-muted">
            <div className="w-1.5 h-1.5 rounded-full bg-pine" />
            {f}
          </div>
        ))}
      </Card>

      <button
        onClick={props.onReset}
        className="w-full py-3 text-sm text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-[16px] bg-surface flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-4 h-4" /> Reset session
      </button>
    </div>
  );
};