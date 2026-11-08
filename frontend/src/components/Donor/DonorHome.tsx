import React from 'react';
import { HeartHandshake, ShieldCheck, Lock, TrendingUp, Package, Check, Wallet, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../Shared/EmptyState';

interface Campaign {
  id: string;
  title: string;
  pooledAmount: number;
  targetAmount: number;
  daysRemaining: number;
  cohortGoalText: string;
  coveredCount: number;
  targetCount: number;
  isClosed?: boolean;
}

interface ImpactStats {
  bundles_delivered: number;
  utility_meters_paid: number;
  student_terms_paid: number;
}

interface ImpactDelta {
  bundles: number;
  utilities: number;
  terms: number;
}

interface PublicPartner {
  id: string;
  name: string;
  region: string;
  type: string;
}

interface ActivityItem {
  id: string;
  kind: 'donation' | 'pledge' | 'campaign';
  title: string;
  subtitle: string;
  amountKes?: number;
  timestamp: string;
}

interface DonorContribution {
  id: string;
  amount: number;
  isAnonymous: boolean;
  optInLedger: boolean;
  timestamp: string;
}

interface DonorProfile {
  display_name: string;
  opt_in_ledger: boolean;
  has_profile: boolean;
}

interface DonorHomeProps {
  activityFeed: ActivityItem[];
  totalGivenKes: number;
  impactStats: ImpactStats | null;
  donorContributions: DonorContribution[];
  pledges: any[];
  myProfile: DonorProfile | null;
  impactDelta: ImpactDelta | null | undefined;
  activeClosures: Campaign[];
  dismissedClosures: Set<string>;
  setDismissedClosures: React.Dispatch<React.SetStateAction<Set<string>>>;
  campaigns: Campaign[];
  publicPartners: PublicPartner[];
  openLedgerModal: () => void;
  handleDownloadDonations: () => void;
  goTab: (t: any) => void;
  setSelectedActivity: (item: ActivityItem) => void;
  formatRelativeTime: (ts: string) => string;
}

export const DonorHome: React.FC<DonorHomeProps> = (props) => {
  const hasActivity = props.activityFeed.length > 0;

  return (
    <div className="space-y-4 pb-4">
      {/* Hero — impact summary or onboarding */}
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-pine to-pine-deep p-6 text-white shadow-soft space-y-3">
        {/* Glass decoration */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <HeartHandshake className="w-6 h-6 text-white/80" />
          <button
            onClick={props.openLedgerModal}
            className="text-xs font-semibold text-white/70 hover:text-white underline flex items-center gap-1"
          >
            <ShieldCheck className="w-3 h-3" /> Verify ledger
          </button>
        </div>
        {hasActivity ? (
          <>
            <h2 className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-white/60">KES</span>
              <span className="text-3xl font-bold tabular-nums">{props.totalGivenKes.toLocaleString()}</span>
              <span className="text-base text-white/70 font-normal">pooled</span>
            </h2>
            <p className="text-sm text-white/80 leading-relaxed">
              {props.impactStats
                ? `${props.impactStats.bundles_delivered} bundles delivered · ${props.impactStats.utility_meters_paid} bills paid · ${props.impactStats.student_terms_paid} school terms funded. You are one of the donors behind these.`
                : `Across ${props.donorContributions.length} gift${props.donorContributions.length !== 1 ? 's' : ''}. Blind-pooled. No recipient link.`}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold leading-tight">Fund a need.<br />Stay anonymous.</h2>
            <p className="text-sm text-white/80 leading-relaxed">Blind-pooled. No recipient profiles. No linkage.</p>
          </>
        )}
      </div>

      {/* Privacy card */}
      {hasActivity && (
        <Card className="space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-pine" />
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Privacy</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Ledger name</span>
              <span className="font-semibold text-ink">{props.myProfile?.display_name || 'Anonymous'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Public ledger</span>
              <span className={`font-semibold ${props.myProfile?.opt_in_ledger ? 'text-pine' : 'text-muted'}`}>
                {props.myProfile?.opt_in_ledger ? 'Listed' : 'Not listed'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Last gift</span>
              <span className={`font-semibold ${props.donorContributions[0]?.isAnonymous ? 'text-pine' : 'text-ink'}`}>
                {props.donorContributions[0] ? (props.donorContributions[0].isAnonymous ? 'Anonymous' : 'Named') : '—'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Impact delta since last visit */}
      {hasActivity && props.impactStats && (
        <Card className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pine" />
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Since your last visit</span>
          </div>
          {props.impactDelta === null ? (
            <p className="text-sm text-muted leading-relaxed">
              First visit — current totals: {props.impactStats.bundles_delivered} bundles delivered,{' '}
              {props.impactStats.utility_meters_paid} meters paid, {props.impactStats.student_terms_paid} terms funded.
            </p>
          ) : props.impactDelta === undefined ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Bundles delivered</span>
                <span className={`font-semibold ${props.impactDelta.bundles > 0 ? 'text-pine' : 'text-muted'}`}>
                  {props.impactDelta.bundles > 0 ? '+' + props.impactDelta.bundles : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Utility meters paid</span>
                <span className={`font-semibold ${props.impactDelta.utilities > 0 ? 'text-pine' : 'text-muted'}`}>
                  {props.impactDelta.utilities > 0 ? '+' + props.impactDelta.utilities : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Student terms paid</span>
                <span className={`font-semibold ${props.impactDelta.terms > 0 ? 'text-pine' : 'text-muted'}`}>
                  {props.impactDelta.terms > 0 ? '+' + props.impactDelta.terms : '—'}
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Download */}
      {hasActivity && (
        <Button variant="secondary" fullWidth onClick={props.handleDownloadDonations}>
          <Package className="w-4 h-4 mr-2" /> Download my donations ({props.donorContributions.length} gift{props.donorContributions.length !== 1 ? 's' : ''})
        </Button>
      )}

      {/* Stats */}
      {hasActivity && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider">Total given</div>
            <div className="text-base font-bold text-pine mt-1">KES {props.totalGivenKes.toLocaleString()}</div>
          </Card>
          <Card className="text-center">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider">Gifts</div>
            <div className="text-base font-bold text-ink mt-1">{props.donorContributions.length}</div>
          </Card>
          <Card className="text-center">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider">Pledges</div>
            <div className="text-base font-bold text-amber-700 mt-1">{props.pledges.length}</div>
          </Card>
        </div>
      )}

      {/* Campaign closures */}
      {props.activeClosures.length > 0 && (
        <div className="space-y-2">
          {props.activeClosures.map(c => (
            <Card key={c.id} className="bg-emerald-50 border-emerald-200 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-bold text-emerald-900 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Campaign closed
                </div>
                <button
                  onClick={() => {
                    const next = new Set(props.dismissedClosures);
                    next.add(c.id);
                    props.setDismissedClosures(next);
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-900"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-sm text-emerald-900/70 leading-relaxed">
                <strong>{c.title}</strong> · {c.coveredCount}/{c.targetCount} covered. Thank you.
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Quick action tiles */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => props.goTab('give')}
          className="p-4 bg-surface border border-tile rounded-[18px] text-left hover:border-pine transition-colors"
        >
          <Wallet className="w-5 h-5 text-pine mb-2" />
          <div className="text-sm font-bold text-ink">Give Cash</div>
          <div className="text-xs text-muted mt-1">Blind pool</div>
        </button>
        <button
          onClick={() => props.goTab('pledge')}
          className="p-4 bg-surface border border-tile rounded-[18px] text-left hover:border-pine transition-colors"
        >
          <Package className="w-5 h-5 text-amber-600 mb-2" />
          <div className="text-sm font-bold text-ink">Pledge</div>
          <div className="text-xs text-muted mt-1">Goods or credit</div>
        </button>
      </div>

      {/* Active campaigns */}
      {props.campaigns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pine" />
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Active campaigns</h3>
            </div>
            <span className="text-xs text-muted">{props.campaigns.length}</span>
          </div>
          {props.campaigns.map(c => {
            const pct = Math.round((c.pooledAmount / c.targetAmount) * 100);
            return (
              <Card key={c.id} className="space-y-3 hover:shadow-soft hover:-translate-y-1 transition-all duration-200">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-pine uppercase tracking-wider">Cohort</div>
                    <h3 className="text-base font-bold text-ink leading-snug mt-1">{c.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted shrink-0">
                    <Clock className="w-3 h-3" /> {c.daysRemaining}d
                  </div>
                </div>
                <p className="text-sm text-muted leading-relaxed">{c.cohortGoalText}</p>
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

      {/* Public partners */}
      {props.publicPartners.length > 0 && (
        <Card className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Who we work with</h3>
            <span className="text-xs font-semibold bg-lime text-pine px-2 py-0.5 rounded">Verified</span>
          </div>
          <div className="space-y-2">
            {props.publicPartners.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-tile last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center text-xs font-bold text-pine border border-tile">
                    {p.id.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">{p.name}</div>
                    <div className="text-xs text-muted truncate">{p.region}</div>
                  </div>
                </div>
                <span className="text-xs uppercase text-muted shrink-0">{p.type}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted leading-relaxed pt-2 border-t border-tile">
            We never share your contribution with these partners. They receive pooled settlement, never your identity or a specific recipient's.
          </p>
        </Card>
      )}

      {/* Activity feed */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Your activity</h3>
          {hasActivity && <span className="text-xs text-muted">{props.activityFeed.length}</span>}
        </div>
        {hasActivity ? (
          props.activityFeed.slice(0, 10).map(item => (
            <button
              key={item.id}
              onClick={() => props.setSelectedActivity(item)}
              className="w-full p-4 bg-surface border border-tile rounded-[16px] flex items-start gap-3 text-left hover:border-pine hover:shadow-soft transition-all duration-200"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.kind === 'donation' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {item.kind === 'donation' ? <Wallet className="w-4 h-4" /> : <Package className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{item.title}</div>
                <div className="text-xs text-muted mt-1 truncate">{item.subtitle}</div>
              </div>
              <div className="text-right shrink-0">
                {item.amountKes !== undefined && (
                  <div className="text-sm font-bold text-pine">KES {item.amountKes.toLocaleString()}</div>
                )}
                <div className="text-xs text-muted mt-1">{props.formatRelativeTime(item.timestamp)}</div>
              </div>
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