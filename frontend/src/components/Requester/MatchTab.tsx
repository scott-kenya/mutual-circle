import React from 'react';
import { CheckCircle, ShieldAlert, X, Eye, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../Shared/EmptyState';

interface Opportunity {
  id: string;
  title: string;
  locality: string;
  commit: string;
  desc: string;
  Icon: React.ElementType;
  accent: string;
}

interface MatchTabProps {
  opportunitiesWithIcons: Opportunity[];
  declined: Set<string>;
  setDeclined: React.Dispatch<React.SetStateAction<Set<string>>>;
  matchSent: string | null;
  setMatchSent: (id: string) => void;
  selectedOpp: Opportunity | null;
  setSelectedOpp: (opp: Opportunity | null) => void;
  matchConfirmed: boolean;
  setMatchConfirmed: (v: boolean) => void;
  expressInterest: (opportunityId: string, title: string) => void;
}

export const MatchTab: React.FC<MatchTabProps> = (props) => {
  const visible = props.opportunitiesWithIcons.filter(o => !props.declined.has(o.id));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-ink">The Match</h2>
        <p className="text-sm text-muted mt-1">Opportunities. Opt-in only.</p>
      </div>

      {props.matchSent && (
        <Card className="bg-emerald-50 border-emerald-200 flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Interest sent</p>
            <p className="text-xs text-emerald-900/70 mt-1">Provider will contact within 48h.</p>
          </div>
        </Card>
      )}

      <Card className="bg-amber-50 border-amber-200 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900 leading-relaxed">
          Requires opt-in disclosure. Your token history is never shared.
        </p>
      </Card>

      <div className="space-y-3">
        {visible.length === 0 && (
          <EmptyState Icon={Eye} title="No opportunities shown" body="Reset to view all declined opportunities." />
        )}

        {visible.map(opp => {
          const I = opp.Icon;
          const sent = props.matchSent === opp.id;
          return (
            <Card key={opp.id} className="space-y-3 hover:shadow-soft hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${opp.accent}`}>
                  <I className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-ink leading-tight">{opp.title}</div>
                  <div className="text-xs text-muted mt-1">{opp.locality} • {opp.commit}</div>
                </div>
                <button
                  onClick={() => props.setDeclined(s => new Set(s).add(opp.id))}
                  aria-label="Not interested"
                  className="p-2 rounded-full text-muted hover:text-rose-600 hover:bg-rose-50 shrink-0 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-ink/70 leading-relaxed">{opp.desc}</p>

              {sent ? (
                <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg text-center font-semibold">
                  Interest sent
                </div>
              ) : (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => { props.setSelectedOpp(opp); props.setMatchConfirmed(false); }}
                  className="text-pine"
                >
                  Express interest <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {props.selectedOpp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => props.setSelectedOpp(null)}>
          <div className="bg-surface rounded-[22px] max-w-sm w-full p-6 space-y-4 shadow-soft" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold">
                  <ShieldAlert className="w-3 h-3" /> Requires disclosure
                </div>
                <h3 className="text-lg font-bold text-ink mt-3">{props.selectedOpp.title}</h3>
              </div>
              <button onClick={() => props.setSelectedOpp(null)} aria-label="Close" className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <Card className="bg-amber-50 border-amber-200 space-y-2">
              <p className="text-sm font-semibold text-amber-900">What this means</p>
              <ul className="text-sm text-amber-900/80 leading-relaxed list-disc pl-4 space-y-1">
                <li>Provider receives your contact channel</li>
                <li>Your request history is <strong>not</strong> shared</li>
                <li>Withdraw anytime before contact</li>
              </ul>
            </Card>

            <label className="flex items-start gap-3 p-4 rounded-[16px] border border-tile cursor-pointer bg-canvas">
              <input
                type="checkbox"
                checked={props.matchConfirmed}
                onChange={e => props.setMatchConfirmed(e.target.checked)}
                className="mt-1 accent-pine w-4 h-4"
              />
              <span className="text-sm text-ink leading-relaxed">I consent to being contacted.</span>
            </label>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => props.setSelectedOpp(null)}>Cancel</Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  if (props.selectedOpp) {
                    props.setMatchSent(props.selectedOpp.id);
                    props.expressInterest(props.selectedOpp.id, props.selectedOpp.title);
                    props.setSelectedOpp(null);
                  }
                }}
                disabled={!props.matchConfirmed}
              >
                Send interest
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};