import React from 'react';
import { ShieldCheck, Phone } from 'lucide-react';
import { Card } from '../ui/Card';

interface Helpline {
  id: string;
  name: string;
  number: string;
  sub: string;
}

interface BenchTabProps {
  helplines: Helpline[];
}

export const BenchTab: React.FC<BenchTabProps> = (props) => {
  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-xl font-bold text-ink">The Bench</h2>
        <p className="text-sm text-muted mt-1">Peer chat coming soon. Direct helplines available now.</p>
      </div>

      <Card className="bg-purple-50 border-purple-200 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-purple-900">
          <ShieldCheck className="w-4 h-4" /> Isolated from your account
        </div>
        <p className="text-sm text-purple-900/70 leading-relaxed">
          No shared identifiers with Swap/Pool. Peer chat is launching soon — the helplines below are available today.
        </p>
      </Card>

      <Card className="space-y-3">
        <div className="text-xs font-semibold uppercase text-muted">Reach out directly</div>
        {props.helplines.map(h => (
          <div key={h.id} className="flex items-center justify-between py-3 border-b border-tile last:border-0">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted font-semibold">{h.name}</div>
              <div className="text-base font-bold text-ink mt-1">{h.number}</div>
              <div className="text-xs text-muted mt-0.5">{h.sub}</div>
            </div>
            <Phone className="w-5 h-5 text-purple-600" />
          </div>
        ))}
      </Card>
    </div>
  );
};