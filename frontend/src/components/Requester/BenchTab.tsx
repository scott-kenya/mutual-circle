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
    <div className="space-y-4">
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
          <a
            key={h.id}
            href={`tel:${h.number.replace(/\s/g, '')}`}
            className="flex items-center justify-between py-3 border-b border-tile last:border-0 hover:bg-tint/30 -mx-4 px-4 transition-colors rounded-lg"
          >
            <div>
              <div className="text-xs uppercase tracking-wider text-muted font-semibold">{h.name}</div>
              <div className="text-base font-bold text-ink mt-1">{h.number}</div>
              <div className="text-xs text-muted mt-0.5">{h.sub}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
          </a>
        ))}
      </Card>
    </div>
  );
};