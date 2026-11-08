import React from 'react';
import { HeartHandshake, CheckCircle, X, Package, CreditCard, Users, MessageCircle, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusChip } from '../ui/StatusChip';

interface RequesterHomeProps {
  tokenHash: string | null;
  unseenRedemptions: any[];
  dismissRedemptions: () => void;
  unseen: any[];
  dismissUnseen: () => void;
  rate: { count: number };
  MAX_REQUESTS: number;
  rateLimited: boolean;
  goTab: (tab: 'swap' | 'pool' | 'match' | 'bench') => void;
  myVouchers: any[];
  mergedHistory: any[];
  swapRequests: any[];
  handleWithdraw: (id: string, type: 'swap' | 'pool') => void;
  collectError: string | null;
  setCollectError: (err: string | null) => void;
  collectRequest: (id: string, pin: string) => Promise<boolean>;
  setPayingRequest: (req: { id: string, amount: number } | null) => void;
  sessionStats: { total: number, dispatched: number, pending: number };
}

const mapStatus = (s: string, type: string): any => {
  if (s === 'collected') return 'Collected';
  if (s === 'fulfilled') return 'Fulfilled';
  if (s === 'pending_check') return 'Under Review';
  if (type === 'swap') return 'Reserved';
  return 'Ready';
};

export const RequesterHome: React.FC<RequesterHomeProps> = (props) => {
  const [showAll, setShowAll] = React.useState(false);

  return (
    <div className="space-y-6 pb-20">
      <div className="relative overflow-hidden rounded-[22px] bg-pine p-6 text-white shadow-soft">
        {/* Glass decoration */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <HeartHandshake className="w-6 h-6 text-lime mb-2 relative z-10" />
        <h2 className="text-2xl font-bold leading-tight relative z-10">Welcome back</h2>
        <p className="text-sm text-white/80 mt-1 relative z-10">Your private token:</p>
        <p className="text-xs font-mono text-lime mt-1 truncate relative z-10">{props.tokenHash}</p>
      </div>

      {props.unseenRedemptions.length > 0 && (
        <Card variant="tile" className="border border-lime">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-sm font-semibold text-pine-deep">
              <CheckCircle className="w-4 h-4" /> Voucher Redeemed
            </div>
            <button onClick={props.dismissRedemptions}><X className="w-4 h-4 text-muted" /></button>
          </div>
          {props.unseenRedemptions.slice(0, 2).map(({ redemption, voucher }) => (
            <p key={redemption.id} className="text-sm text-ink mt-2">
              <span className="font-semibold">{voucher!.partnerName}</span> • {redemption.timestamp}
            </p>
          ))}
        </Card>
      )}

      <Card>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Weekly Allowance</span>
          <span className="text-xs font-semibold text-pine">{props.MAX_REQUESTS - props.rate.count} left</span>
        </div>
        <div className="h-2 bg-canvas rounded-full overflow-hidden">
          <div
            className="h-full bg-pine transition-all"
            style={{ width: `${(props.rate.count / props.MAX_REQUESTS) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted mt-2">Resets Monday. {props.rate.count}/{props.MAX_REQUESTS} used.</p>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {([
          { id: 'swap' as const, Icon: Package, l: 'Reserve', s: 'Food bundle' },
          { id: 'pool' as const, Icon: CreditCard, l: 'Pool', s: 'Bills & fees' },
          { id: 'match' as const, Icon: Users, l: 'Match', s: 'Opportunities' },
          { id: 'bench' as const, Icon: MessageCircle, l: 'Bench', s: 'Peer support' }
        ]).map(item => {
          const I = item.Icon;
          return (
            <button
              key={item.id}
              onClick={() => props.goTab(item.id)}
              disabled={props.rateLimited && (item.id === 'swap' || item.id === 'pool')}
              className="group bg-surface p-4 rounded-[16px] border border-tile text-left hover:border-pine hover:shadow-soft hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:hover:transform-none"
            >
              <I className="w-5 h-5 text-pine mb-2" />
              <div className="text-sm font-semibold text-ink">{item.l}</div>
              <div className="text-xs text-muted mt-0.5">{item.s}</div>
            </button>
          );
        })}
      </div>

      {props.myVouchers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">My Vouchers</h3>
          <div className="space-y-3">
            {props.myVouchers.map(v => (
              <Card key={v.id} className="border-l-4 border-l-pine">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-semibold text-ink">{v.partnerName}</div>
                    <div className="text-xs text-muted">{v.description}</div>
                  </div>
                  <StatusChip status={v.status === 'active' ? 'Ready' : 'Collected'} />
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-tile">
                  <div className="text-sm font-semibold text-ink">PIN <span className="text-pine">{v.pin}</span></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {props.mergedHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Recent Activity</h3>
            {props.mergedHistory.length > 5 && (
              <button onClick={() => setShowAll(!showAll)} className="text-xs font-semibold text-pine hover:underline">
                {showAll ? 'Show less' : 'See all'}
              </button>
            )}
          </div>
          <Card className="p-0 overflow-hidden">
            {(showAll ? props.mergedHistory : props.mergedHistory.slice(0, 5)).map((r: any) => {
              const isWithdrawn = r.status === 'withdrawn';
              const canWithdraw = r.type === 'swap' ? r.status === 'reserved' : (r.status === 'verified' || r.status === 'pending_check');
              const liveSwap: any = r.type === 'swap' ? props.swapRequests.find((s: any) => s.id === r.id) : null;
              const resolvedPin: string | null = (liveSwap?.pin && String(liveSwap.pin) !== '----' && String(liveSwap.pin).length >= 3)
                ? String(liveSwap.pin)
                : (r.pin && String(r.pin) !== '----' && String(r.pin).length >= 3 ? String(r.pin) : null);
              const canCollect = r.type === 'swap' && !isWithdrawn && !!resolvedPin && ['reserved', 'verified', 'submitted_to_partner', 'voucher_issued'].includes(r.status);
              const canSettle = r.type === 'pool' && r.status === 'fulfilled' && r.paymentStatus !== 'paid';
              
              return (
                <div key={r.id} className="p-4 border-b border-tile last:border-0 space-y-3 hover:bg-tint/30 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center text-pine shrink-0">
                        {r.type === 'swap' ? <Package className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink truncate">
                          {r.type === 'swap' ? r.bundleCategory : r.category?.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-muted truncate mt-0.5">
                          {r.type === 'swap' ? r.lockerLocation : 'Bill Payment'}
                        </div>
                      </div>
                    </div>
                    <StatusChip status={mapStatus(r.status, r.type)} />
                  </div>
                  
                  {(canWithdraw || canCollect || canSettle || (r.type === 'swap' && !resolvedPin && ['reserved', 'verified', 'submitted_to_partner', 'voucher_issued'].includes(r.status))) && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-tile/50">
                      {canWithdraw && (
                        <Button variant="ghost" className="text-rose-600 px-2 py-1 text-xs h-8" onClick={() => props.handleWithdraw(r.id, r.type)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Withdraw
                        </Button>
                      )}
                      {canCollect && (
                        <Button variant="ghost" className="text-pine px-2 py-1 text-xs h-8" onClick={async () => {
                          if (!resolvedPin) return;
                          await props.collectRequest(r.id, resolvedPin);
                        }}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Confirm Pickup
                        </Button>
                      )}
                      {canSettle && (
                        <Button variant="primary" className="px-2 py-1 text-xs h-8" onClick={() => props.setPayingRequest({ id: r.id, amount: r.amount * 100 })}>
                          Settle
                        </Button>
                      )}
                      {r.type === 'swap' && !resolvedPin && ['reserved', 'verified', 'submitted_to_partner', 'voucher_issued'].includes(r.status) && (
                        <p className="text-xs text-muted italic">PIN sent via SMS</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {props.mergedHistory.length > 0 && (
        <Card variant="tile">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Session Summary</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="text-xl font-bold text-ink">{props.sessionStats.total}</div><div className="text-xs text-muted">Requests</div></div>
            <div className="border-l border-r border-tile"><div className="text-xl font-bold text-pine">{props.sessionStats.dispatched}</div><div className="text-xs text-muted">Ready</div></div>
            <div><div className="text-xl font-bold text-ink">{props.sessionStats.pending}</div><div className="text-xs text-muted">Pending</div></div>
          </div>
        </Card>
      )}
    </div>
  );
};