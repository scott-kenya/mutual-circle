import React from 'react';
import { HeartHandshake, ShieldCheck, TrendingUp, Package, Wallet, Clock, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../Shared/EmptyState';

interface DonorHomeProps {
  activityFeed: any[];
  totalGivenKes: number;
  impactStats: any;
  campaigns: any[];
  openLedgerModal: () => void;
  goTab: (t: any) => void;
  setSelectedActivity: (item: any) => void;
  formatRelativeTime: (ts: string) => string;
}

export const DonorHome: React.FC<DonorHomeProps> = (props) => {
  const hasActivity = props.activityFeed.length > 0;
  const activeCampaigns = props.campaigns.slice(0, 2); // Only show top 2

  return (
    <div className="space-y-6 pb-4">
      {/* 1. Hero — impact summary */}
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-pine to-pine-deep p-6 text-white shadow-soft space-y-3">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <HeartHandshake className="w-6 h-6 text-lime" />
          <button
            onClick={props.openLedgerModal}
            className="text-xs font-semibold text-white/70 hover:text-white underline flex items-center gap-1"
          >
            <ShieldCheck className="w-3 h-3" /> Verify ledger
          </button>
        </div>

        {hasActivity ? (
          <>
            <h2 className="flex items-baseline gap-1.5 flex-wrap relative z-10">
              <span className="text-sm font-semibold text-white/60">KES</span>
              <span className="text-3xl font-bold tabular-nums">{props.totalGivenKes.toLocaleString()}</span>
              <span className="text-base text-white/70 font-normal">pooled</span>
            </h2>
            <p className="text-sm text-white/80 leading-relaxed relative z-10">
              {props.impactStats
                ? `${props.impactStats.bundles_delivered} bundles delivered · ${props.impactStats.utility_meters_paid} bills paid · ${props.impactStats.student_terms_paid} school terms funded.`
                : `Across ${props.activityFeed.length} gifts. Blind-pooled.`}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold leading-tight relative z-10">Fund a need.<br />Stay anonymous.</h2>
            <p className="text-sm text-white/80 leading-relaxed relative z-10">Blind-pooled. No recipient profiles. No linkage.</p>
          </>
        )}
      </div>

      {/* 2. Quick Action Tiles */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => props.goTab('give')}
          className="group bg-surface p-5 rounded-[16px] border border-tile text-left hover:border-pine hover:shadow-soft hover:-translate-y-1 transition-all duration-200"
        >
          <Wallet className="w-6 h-6 text-pine mb-3" />
          <div className="text-sm font-bold text-ink">Give Cash</div>
          <div className="text-xs text-muted mt-1">Blind pool</div>
        </button>
        <button
          onClick={() => props.goTab('pledge')}
          className="group bg-surface p-5 rounded-[16px] border border-tile text-left hover:border-pine hover:shadow-soft hover:-translate-y-1 transition-all duration-200"
        >
          <Package className="w-6 h-6 text-amber-600 mb-3" />
          <div className="text-sm font-bold text-ink">Pledge</div>
          <div className="text-xs text-muted mt-1">Goods or credit</div>
        </button>
      </div>

      {/* 3. Active Campaigns (Top 2 only) */}
      {activeCampaigns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pine" />
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Active campaigns</h3>
            </div>
            <button onClick={() => props.goTab('impact')} className="text-xs font-semibold text-pine hover:underline">
              See all
            </button>
          </div>
          {activeCampaigns.map(c => {
            const pct = Math.round((c.pooledAmount / c.targetAmount) * 100);
            return (
              <Card key={c.id} className="space-y-3 hover:shadow-soft transition-all">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-pine uppercase tracking-wider">Cohort</div>
                    <h3 className="text-base font-bold text-ink leading-snug mt-1">{c.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted shrink-0">
                    <Clock className="w-3 h-3" /> {c.daysRemaining}d
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-tile rounded-full overflow-hidden">
                    <div className="h-full bg-pine rounded-full" style={{ width: Math.min(100, pct) + '%' }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-pine">{pct}%</span>
                    <span className="text-muted">{c.coveredCount}/{c.targetCount}</span>
                  </div>
                </div>
                <Button variant="primary" fullWidth onClick={() => props.goTab('give')}>
                  Contribute
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* 4. Recent Activity (Top 3 only) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Recent activity</h3>
          <button onClick={() => props.goTab('impact')} className="text-xs font-semibold text-pine hover:underline">
            See all
          </button>
        </div>
        
        {hasActivity ? (
          props.activityFeed.slice(0, 3).map(item => (
            <button
              key={item.id}
              onClick={() => props.setSelectedActivity(item)}
              className="w-full p-4 bg-surface border border-tile rounded-[16px] flex items-center gap-3 text-left hover:border-pine hover:shadow-soft transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.kind === 'donation' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {item.kind === 'donation' ? <Wallet className="w-5 h-5" /> : <Package className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{item.title}</div>
                <div className="text-xs text-muted mt-0.5 truncate">{props.formatRelativeTime(item.timestamp)}</div>
              </div>
              {item.amountKes !== undefined && (
                <div className="text-sm font-bold text-pine shrink-0">KES {item.amountKes.toLocaleString()}</div>
              )}
              <ChevronRight className="w-4 h-4 text-muted shrink-0" />
            </button>
          ))
        ) : (
          <EmptyState
            Icon={HeartHandshake}
            title="No activity yet"
            body="Your gifts, pledges, and campaign closures will appear here."
            cta={{ label: 'Give your first gift', onClick: () => props.goTab('give') }}
          />
        )}
      </div>
    </div>
  );
};