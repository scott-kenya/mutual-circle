import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, FileText, Check, Zap, GraduationCap, Building2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusChip } from '../ui/StatusChip';
import { StatusTimeline } from './StatusTimeline';

const POOL_CATS = [
  { id: 'utility' as const, name: 'Utility Bill', desc: 'KPLC or Nairobi Water', Icon: Zap, accent: 'text-amber-700 bg-amber-50', objLabel: 'Meter number', placeholder: 'e.g. 541234567' },
  { id: 'school_fee' as const, name: 'School Fees', desc: 'Secondary term fees', Icon: GraduationCap, accent: 'text-pine bg-sage', objLabel: 'Admission number', placeholder: 'e.g. 2024118' },
  { id: 'hospital_invoice' as const, name: 'Hospital Invoice', desc: 'No clinical details', Icon: Building2, accent: 'text-blue-700 bg-blue-50', objLabel: 'Invoice number', placeholder: 'e.g. 78432' },
] as const;

type PoolCat = typeof POOL_CATS[number]['id'];
type PoolStep = 'category' | 'details' | 'success';

interface PoolFlowProps {
  poolStep: PoolStep;
  setPoolStep: (step: PoolStep) => void;
  poolResult: any | null;
  poolCat: PoolCat | null;
  setPoolCat: (id: PoolCat) => void;
  poolObject: string;
  setPoolObject: (val: string) => void;
  poolAmount: string;
  setPoolAmount: (val: string) => void;
  poolError: string | null;
  setPoolError: (err: string | null) => void;
  objectError: string | null;
  objectValid: boolean;
  willEscalate: boolean;
  numAmount: number;
  valueRemaining: number;
  pooling: boolean;
  rateLimited: boolean;
  handleSubmitPool: () => void;
  goTab: (tab: 'home') => void;
}

const mapStatus = (s: string): any => {
  if (s === 'pending_check') return 'Under Review';
  if (s === 'verified') return 'Ready';
  if (s === 'fulfilled') return 'Fulfilled';
  if (s === 'collected') return 'Collected';
  return 'Reserved';
};

export const PoolFlow: React.FC<PoolFlowProps> = (props) => {
  if (props.poolStep === 'success' && props.poolResult) {
    const cat = POOL_CATS.find(c => c.id === props.poolResult.category);
    const isPending = props.poolResult.status === 'pending_check';
    return (
      <div className="space-y-4 pb-20">
        <div className="text-center pt-6 space-y-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border-2 ${isPending ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-lime text-pine border-tile'}`}>
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">{isPending ? 'Under review' : 'Request queued'}</h2>
            <p className="text-sm text-muted mt-1 max-w-xs mx-auto">
              {isPending ? 'OCR verification required before dispatch.' : 'Queued for the payment partner.'}
            </p>
          </div>
        </div>

        <Card>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">Category</span><span className="font-semibold text-ink">{cat?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted">Reference</span><span className="font-mono font-bold text-pine">{props.poolResult.hashedObjectId}</span></div>
            <div className="flex justify-between items-baseline">
              <span className="text-muted">Amount</span>
              <span className="font-mono font-bold text-ink">
                <span className="text-xs text-muted mr-1">KES</span>
                <span className="text-lg tabular-nums">{props.poolResult.amount.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex justify-between items-center"><span className="text-muted">Status</span><StatusChip status={mapStatus(props.poolResult.status)} /></div>
          </div>
        </Card>

        <Card>
          <div className="text-xs font-semibold uppercase text-muted mb-3">What happens next</div>
          <StatusTimeline steps={[
            { key: 'submitted', label: 'Submitted', time: (props.poolResult as any).timestamp, state: 'done' },
            { key: 'review', label: isPending ? 'OCR verification' : 'Queued for partner', state: 'current' },
            { key: 'paid', label: 'Paid to institution', state: 'pending' },
          ]} />
        </Card>

        <Button variant="primary" fullWidth onClick={() => props.goTab('home')}>Done</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-xl font-bold text-ink">The Pool</h2>
        <p className="text-sm text-muted mt-1">Funds go directly to the institution.</p>
      </div>

      {props.rateLimited && (
        <Card className="bg-rose-50 border-rose-200 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm text-rose-900">Daily limit reached.</p>
        </Card>
      )}
      {props.poolError && (
        <Card className="bg-rose-50 border-rose-200 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm text-rose-900">{props.poolError}</p>
        </Card>
      )}

      <div className="flex items-center gap-2 mb-6">
        {(['category', 'details'] as const).map((s, i) => {
          const active = props.poolStep === s || (s === 'category' && props.poolStep !== 'category');
          const done = s === 'category' && props.poolStep === 'details';
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

      {props.poolStep === 'category' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink">1. What are you paying?</p>
          {POOL_CATS.map(c => {
            const I = c.Icon;
            const selected = props.poolCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => props.setPoolCat(c.id)}
                className={`w-full p-4 rounded-[16px] border-2 text-left flex items-start gap-3 transition-all ${selected ? 'border-pine bg-surface' : 'border-tile bg-canvas'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.accent}`}>
                  <I className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-ink">{c.name}</div>
                  <div className="text-sm text-muted mt-1">{c.desc}</div>
                </div>
                {selected && <CheckCircle className="w-5 h-5 text-pine shrink-0" />}
              </button>
            );
          })}

          {props.poolCat === 'hospital_invoice' && (
            <Card className="bg-rose-50 border-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-900 leading-relaxed">Only invoice number and amount. <strong>No clinical details</strong> are collected.</p>
            </Card>
          )}

          <Button variant="primary" fullWidth onClick={() => props.setPoolStep('details')} disabled={!props.poolCat}>
            Continue
          </Button>
        </div>
      )}

      {props.poolStep === 'details' && (() => {
        const cat = POOL_CATS.find(c => c.id === props.poolCat)!;
        return (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-ink">2. Bill details</p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted flex items-center gap-1">
                <FileText className="w-3 h-3" /> {cat.objLabel}
              </label>
              <input
                type="text"
                value={props.poolObject}
                onChange={e => { props.setPoolObject(e.target.value); props.setPoolError(null); }}
                placeholder={cat.placeholder}
                className={`w-full bg-surface border rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-pine outline-none ${props.objectError ? 'border-rose-300' : 'border-tile'}`}
              />
              {props.objectError && (
                <div className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{props.objectError}
                </div>
              )}
              {!props.objectError && props.objectValid && (
                <div className="text-xs text-pine flex items-center gap-1">
                  <Check className="w-3 h-3" />Valid format
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted">Amount (KES)</label>
              <input
                type="number"
                value={props.poolAmount}
                onChange={e => { props.setPoolAmount(e.target.value); props.setPoolError(null); }}
                placeholder="e.g. 3500"
                className="w-full bg-surface border border-tile rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-pine outline-none"
              />
              {props.numAmount > 0 && props.numAmount > props.valueRemaining && (
                <div className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Exceeds session allowance (KES {props.valueRemaining.toLocaleString()} left)
                </div>
              )}
            </div>

            {props.willEscalate && (
              <Card className="bg-amber-50 border-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 leading-relaxed">Over KES 5,000 triggers <strong>Tier 3 OCR</strong>.</p>
              </Card>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" fullWidth onClick={() => props.setPoolStep('category')}>Back</Button>
              <Button
                variant="primary"
                fullWidth
                onClick={props.handleSubmitPool}
                disabled={!props.objectValid || !props.numAmount || props.pooling || props.rateLimited || props.numAmount > props.valueRemaining}
              >
                {props.pooling ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};