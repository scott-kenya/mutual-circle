import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { peekRate, consumeRate, loadHistory, saveHistory, loadSeen, saveSeen } from '../../services/auth';
import { setHouseholdSize as apiSetHousehold, getHouseholdSize as apiGetHousehold, getOpportunities, getHelplines, getUnreadNotificationCount } from '../../lib/apiClient';
import {
  HeartHandshake, Shield, Package, CreditCard, Users, MessageCircle,
  Home, MapPin, Check, CheckCircle, Clock, Copy, ScanLine, ArrowRight,
  AlertTriangle, FileText, Zap, GraduationCap, Building2, Droplet, Briefcase,
  X, Phone, ShieldCheck, ShieldAlert, Eye, EyeOff, RotateCcw, LogOut, Bell, AlertCircle, Trash2,
  MessageSquare, ArrowLeft, Settings,
} from 'lucide-react';
import { StatusTimeline } from './StatusTimeline';
import { EmptyState } from '../Shared/EmptyState';
import { useToast } from '../Shared/Toast';
import { SwapRequest, PoolRequest } from '../../types';
import { RequesterMessages } from './Messages';
import { RequesterHome } from './RequesterHome';
import { SwapFlow } from './SwapFlow';
import { PoolFlow } from './PoolFlow';
import { MatchTab } from './MatchTab';
import { BenchTab } from './BenchTab';
import { HouseholdSetup } from './HouseholdSetup';
import { SettingsTab } from './SettingsTab';
import { MpesaModal } from './MpesaModal';

type Tab = 'home' | 'swap' | 'pool' | 'match' | 'bench' | 'messages' | 'settings';
type SwapStep = 'bundle' | 'location' | 'success';
type PoolStep = 'category' | 'details' | 'success';
type PoolCat = 'utility' | 'school_fee' | 'hospital_invoice';
type IntakeStep = 'phone' | 'otp';

const MAX_REQUESTS = 25;
const MAX_VALUE = 100000;
const MAX_OTP_ATTEMPTS = 3;
const OTP_RESEND_SECONDS = 30;

const BUNDLES = [
  { id: 'Standard Pantry', name: 'Standard Pantry', desc: 'Maize flour, rice, oil, lentils.', Icon: Package, accent: 'text-[#1F6B4A] bg-[#DCE8E0]' },
  { id: 'Hygiene Kit', name: 'Hygiene & Dignity', desc: 'Soap, sanitary pads, toothpaste.', Icon: Droplet, accent: 'text-blue-700 bg-blue-50' },
];

const LOCATIONS = [
  { id: 'Kibera Hub', sub: '24/7 * 12 available' },
  { id: 'Mathare Central', sub: '6am-10pm * 18 available' },
  { id: 'Kawangware Station', sub: '24/7 * 4 available' },
];

const POOL_CATS: { id: PoolCat; name: string; desc: string; Icon: any; accent: string; objLabel: string; placeholder: string }[] = [
  { id: 'utility', name: 'Utility Bill', desc: 'KPLC or Nairobi Water', Icon: Zap, accent: 'text-amber-700 bg-amber-50', objLabel: 'Meter number', placeholder: 'e.g. 541234567' },
  { id: 'school_fee', name: 'School Fees', desc: 'Secondary term fees', Icon: GraduationCap, accent: 'text-[#1F6B4A] bg-[#DCE8E0]', objLabel: 'Admission number', placeholder: 'e.g. 2024118' },
  { id: 'hospital_invoice', name: 'Hospital Invoice', desc: 'No clinical details', Icon: Building2, accent: 'text-blue-700 bg-blue-50', objLabel: 'Invoice number', placeholder: 'e.g. 78432' },
];

export const RequesterView: React.FC = () => {
  const { tokenHash, initializeSession, logout, swapRequests, poolRequests, executeSwap, executePool, withdrawRequest, expressInterest, vouchers, voucherRedemptions, collectRequest } = useApp();
  const [payingRequest, setPayingRequest] = useState<{ id: string; amount: number } | null>(null);

  const [intakeStep, setIntakeStep] = useState<IntakeStep>('phone');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [householdStep, setHouseholdStep] = useState<boolean>(false);
  const [householdSize, setHouseholdSize] = useState<number>(1);
  const [householdMode, setHouseholdMode] = useState<'alone' | 'family' | null>(null);
  const [householdError, setHouseholdError] = useState<string | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpProcessing, setOtpProcessing] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [tab, setTab] = useState<Tab>('home');
  const [showServer, setShowServer] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [rate, setRate] = useState({ count: 0, value: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [seen, setSeen] = useState<string[]>([]);

  const { push } = useToast();

  const [swapStep, setSwapStep] = useState<SwapStep>('bundle');
  const [swapBundle, setSwapBundle] = useState<string | null>(null);
  const [swapLocation, setSwapLocation] = useState<string | null>(null);
  const [swapResult, setSwapResult] = useState<SwapRequest | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);

  const [poolStep, setPoolStep] = useState<PoolStep>('category');
  const [poolCat, setPoolCat] = useState<PoolCat | null>(null);
  const [poolObject, setPoolObject] = useState('');
  const [poolAmount, setPoolAmount] = useState('');
  const [poolResult, setPoolResult] = useState<PoolRequest | null>(null);
  const [pooling, setPooling] = useState(false);
  const [poolError, setPoolError] = useState<string | null>(null);

  const [selectedOpp, setSelectedOpp] = useState<any | null>(null);
  const [matchConfirmed, setMatchConfirmed] = useState(false);
  const [matchSent, setMatchSent] = useState<string | null>(null);
  const [declined, setDeclined] = useState<Set<string>>(new Set());
  const [opportunities, setOpportunities] = useState<{ id: string; type: string; title: string; description: string; locality: string; commit: string; posted_at: string }[]>([]);
  const [helplines, setHelplines] = useState<{ id: string; name: string; number: string; sub: string; category: string }[]>([]);

  useEffect(() => {
    if (!tokenHash) return;
    const r = peekRate(tokenHash);
    setRate({ count: r.count, value: r.value });
    setHistory(loadHistory(tokenHash));
    setSeen(loadSeen(tokenHash));
  }, [tokenHash]);

  useEffect(() => {
    if (!tokenHash) return;
    const liveMap = new Map([...swapRequests, ...poolRequests].map(r => [r.id, r]));

    const patched = history.map(h => {
      const live = liveMap.get(h.id);
      return live ? { ...h, status: live.status, paymentStatus: (live as any).paymentStatus } : h;
    });

    const historyIds = new Set(history.map(h => h.id));
    const newEntries = [...swapRequests, ...poolRequests]
      .filter(r => !historyIds.has(r.id))
      .map(r => {
        const isSwap = 'bundleCategory' in r;
        return {
          id: r.id,
          type: isSwap ? 'swap' : 'pool',
          status: r.status,
          paymentStatus: (r as any).paymentStatus,
          bundleCategory: isSwap ? (r as any).bundleCategory : undefined,
          lockerLocation: isSwap ? (r as any).lockerLocation : undefined,
          pin: isSwap ? (r as any).pin : undefined,
          category: !isSwap ? (r as any).category : undefined,
          amount: !isSwap ? (r as any).amount : undefined,
          hashedObjectId: !isSwap ? (r as any).hashedObjectId : undefined,
          timestamp: (r as any).timestamp,
        };
      });

    const anyNew = newEntries.length > 0;
    const anyChanged = patched.some((m, i) => m.status !== history[i]?.status);

    if (anyNew || anyChanged) {
      const merged = [...newEntries, ...patched];
      saveHistory(tokenHash, merged);
      setHistory(merged);
      const nr = peekRate(tokenHash);
      setRate({ count: nr.count, value: nr.value });
    }
  }, [swapRequests, poolRequests, tokenHash, history]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedOpp(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!tokenHash) { setUnreadCount(0); return; }
    let cancelled = false;
    const fetchCount = async () => {
      const r = await getUnreadNotificationCount(tokenHash);
      if (!cancelled) setUnreadCount(r?.unread_count || 0);
    };
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, [tokenHash, tab]);

  useEffect(() => {
    (async () => {
      const [opps, helps] = await Promise.all([getOpportunities(), getHelplines()]);
      if (opps) setOpportunities(opps.opportunities);
      if (helps) setHelplines(helps.helplines);
    })();
  }, []);

  const OPP_ICONS: Record<string, any> = { job: Briefcase, housing: Home, training: GraduationCap, transport: Package };
  const OPP_COLORS: Record<string, string> = {
    job: 'text-blue-700 bg-blue-50',
    housing: 'text-[#1F6B4A] bg-[#DCE8E0]',
    training: 'text-amber-700 bg-amber-50',
    transport: 'text-purple-700 bg-purple-50',
  };
  const opportunitiesWithIcons = opportunities.map(o => ({
    ...o,
    Icon: OPP_ICONS[o.type] || Briefcase,
    accent: OPP_COLORS[o.type] || 'text-blue-700 bg-blue-50',
    desc: o.description,
  }));

  const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000));

  const maskPhone = (p: string): string => {
  const digits = p.replace(/\D/g, '');
  if (digits.length < 4) return p;
  const last3 = digits.slice(-3);
  const stars = '*'.repeat(Math.max(3, digits.length - 3));
  const prefix = p.trim().startsWith('+') ? '+' : '';
  return prefix + stars + last3;
};

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setPhoneError('Please enter a valid phone number (at least 10 digits).');
      return;
    }
    if (digits.length > 15) {
      setPhoneError('Phone number too long (max 15 digits).');
      return;
    }
    setPhoneError(null);
    setGeneratedOtp(generateOtp());
    setOtpInput('');
    setOtpError(null);
    setOtpAttempts(0);
    setResendCooldown(OTP_RESEND_SECONDS);
    setIntakeStep('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.length !== 4 || otpProcessing) return;
    if (otpAttempts >= MAX_OTP_ATTEMPTS) {
      setOtpError('Too many attempts. Resend a new code or use a different number.');
      return;
    }
    if (otpInput !== generatedOtp) {
      const remaining = MAX_OTP_ATTEMPTS - otpAttempts - 1;
      setOtpError(remaining > 0 ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : 'Too many attempts. Resend a new code.');
      setOtpAttempts(a => a + 1);
      setOtpInput('');
      return;
    }

    setOtpProcessing(true);
    try {
      const tok = await initializeSession(phone, 'web');
      const hh = await apiGetHousehold(tok);
      if (!hh?.declared) {
        setHouseholdStep(true);
        setHouseholdMode(null);
        setHouseholdError(null);
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setOtpProcessing(false);
    }
  };

  const handleResend = () => {
    setGeneratedOtp(generateOtp());
    setOtpInput('');
    setOtpError(null);
    setOtpAttempts(0);
    setResendCooldown(OTP_RESEND_SECONDS);
  };

  const handleBackToPhone = () => {
    setIntakeStep('phone');
    setOtpInput('');
    setGeneratedOtp('');
    setOtpError(null);
    setOtpAttempts(0);
    setResendCooldown(0);
  };

  const mergedHistory = history;
  const unseen = mergedHistory.filter(h => h.status === 'submitted_to_partner' && !seen.includes(h.id));
  const dismissUnseen = () => {
    if (!tokenHash) return;
    const next = [...seen, ...unseen.map(u => u.id)];
    setSeen(next);
    saveSeen(tokenHash, next);
  };

  const goTab = (t: Tab) => {
    setTab(t);
    if (t === 'swap') { setSwapStep('bundle'); setSwapBundle(null); setSwapLocation(null); setSwapResult(null); setSwapError(null); }
    if (t === 'pool') { setPoolStep('category'); setPoolCat(null); setPoolObject(''); setPoolAmount(''); setPoolResult(null); setPoolError(null); }
    if (t === 'match') { setSelectedOpp(null); setMatchSent(null); setMatchConfirmed(false); }
  };

  const handleReserve = async () => {
    if (!swapBundle || !swapLocation || rateLimited || swapping) return;
    setSwapping(true); setSwapError(null);
    try {
      const rateCheck = tokenHash ? consumeRate(tokenHash, 0) : { ok: true };
      if (!rateCheck.ok) { const msg = (rateCheck as any).reason || 'Daily limit reached.'; setSwapError(msg); push({ kind: 'error', message: msg }); setSwapping(false); return; }
      const res = await executeSwap(swapBundle, swapLocation);
      if (!res) { setSwapError('Could not reach the locker partner. Please retry.'); push({ kind: 'error', message: 'Locker partner unreachable — try again' }); setSwapping(false); return; }
      setSwapResult(res); setSwapStep('success'); push({ kind: 'success', message: 'Locker reserved' });
      const next = peekRate(tokenHash!);
      setRate({ count: next.count, value: next.value });
      if (tokenHash) setHistory(loadHistory(tokenHash));
    } catch { setSwapError('Unexpected error. Try again.'); push({ kind: 'error', message: 'Swap failed — try again' }); }
    setSwapping(false);
  };

  const handleSubmitPool = async () => {
    if (!poolCat || !poolObject || !numAmount || !objectValid || rateLimited || pooling) return;
    if (numAmount > valueRemaining) { setPoolError(`Remaining session allowance is KES ${valueRemaining.toLocaleString()}.`); return; }
    setPooling(true); setPoolError(null);
    try {
      const rateCheck = tokenHash ? consumeRate(tokenHash, numAmount) : { ok: true };
      if (!rateCheck.ok) { const msg = (rateCheck as any).reason || 'Daily limit reached.'; setPoolError(msg); push({ kind: 'error', message: msg }); setPooling(false); return; }
      const res = await executePool(poolCat, poolObject, numAmount);
      if (!res) { setPoolError('Object not found in institutional records. Check the number and try again.'); push({ kind: 'error', message: 'Object not found in records' }); setPooling(false); return; }
      setPoolResult(res); setPoolStep('success'); push({ kind: 'success', message: res.status === 'pending_check' ? 'Submitted for review' : 'Request queued' });
      const next = peekRate(tokenHash!);
      setRate({ count: next.count, value: next.value });
      if (tokenHash) setHistory(loadHistory(tokenHash));
    } catch { setPoolError('Unexpected error. Try again.'); push({ kind: 'error', message: 'Submit failed — try again' }); }
    setPooling(false);
  };

  const handleWithdraw = (id: string, type: 'swap' | 'pool') => {
    withdrawRequest(id, type);
    if (tokenHash) {
      const h = loadHistory(tokenHash);
      const updated = h.map((x: any) => x.id === id ? { ...x, status: 'withdrawn' } : x);
      saveHistory(tokenHash, updated);
      setHistory(updated);
    }
  };

  const copyPin = () => {
    if (!swapResult) return;
    navigator.clipboard?.writeText(swapResult.pin);
    setPinCopied(true); setTimeout(() => setPinCopied(false), 1800);
  };

  const QrPlaceholder = ({ seed }: { seed: string }) => {
    const cells = Array.from({ length: 121 }, (_, i) => {
      const code = seed.charCodeAt(i % seed.length) || 1;
      return (code * (i + 1)) % 3 === 0;
    });
    return (<div className="w-20 h-20 grid grid-cols-11 gap-[1px] p-1 bg-white border-2 border-[#111111] rounded">{cells.map((on, i) => <div key={i} className={on ? 'bg-[#111111]' : 'bg-white'} />)}</div>);
  };

  const numAmount = Number(poolAmount);
  const willEscalate = numAmount > 5000;
  const objectDigits = poolObject.replace(/\D/g, '').length;
  const objectValid = objectDigits >= 4;
  const rateLimited = rate.count >= MAX_REQUESTS || rate.value >= MAX_VALUE;
  const valueRemaining = Math.max(0, MAX_VALUE - rate.value);
  const objectError = poolObject.length > 0 && !objectValid ? 'Object number must contain at least 4 digits.' : null;

  const myVouchers = vouchers.filter(v => v.issuedToken === tokenHash);
  const myVoucherRedemptions = voucherRedemptions
    .map(r => ({ redemption: r, voucher: vouchers.find(v => v.id === r.voucherId) }))
    .filter(x => x.voucher && x.voucher.issuedToken === tokenHash);
  const unseenRedemptions = myVoucherRedemptions.filter(x => x.redemption.status === 'success' && !seen.includes('R-' + x.redemption.id));
  const dismissRedemptions = () => {
    if (!tokenHash) return;
    const next = [...seen, ...unseenRedemptions.map(x => 'R-' + x.redemption.id)];
    setSeen(next);
    saveSeen(tokenHash, next);
  };
  const sessionStats = (() => {
    const total = mergedHistory.length;
    const dispatched = mergedHistory.filter(h => h.status === 'submitted_to_partner').length;
    const pending = mergedHistory.filter(h => h.status === 'pending_check' || h.status === 'verified').length;
    const totalValue = mergedHistory.reduce((a, h) => a + (h.amount || 0), 0);
    return { total, dispatched, pending, totalValue };
  })();

  if (!tokenHash) {
    const renderPhoneStep = () => (
      <>
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-[#DCE8E0] text-[#1F6B4A] rounded-2xl flex items-center justify-center mx-auto"><HeartHandshake className="w-7 h-7" /></div>
          <div><h1 className="font-serif text-2xl font-bold text-[#111111]">Mutual Circle</h1><p className="text-[10px] font-mono text-[#1F6B4A] uppercase tracking-widest mt-1">Web Portal</p></div>
          <p className="text-xs text-[#111111]/60 leading-relaxed">Food, bills, tuition. Anonymous from the first tap.</p>
        </div>
        <form onSubmit={handleSendOtp} className="space-y-3">
          <div>
            <label className="text-[10px] font-mono uppercase text-[#111111]/50">Phone number</label>
            <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setPhoneError(null); }} placeholder="+254 7XX XXX XXX" autoFocus required className="w-full bg-white border border-[#111111]/15 rounded-xl px-3 py-3 text-sm font-mono focus:ring-2 focus:ring-[#1F6B4A] focus:outline-none mt-1" />
          </div>
          {phoneError && (
            <div className="text-[10px] text-rose-600 flex items-center gap-1 -mt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{phoneError}</span>
            </div>
          )}
          <button type="submit" disabled={!phone} className="w-full py-3 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-xl text-sm font-medium disabled:opacity-50">Send verification code</button>
        </form>
        <div className="p-3 bg-white border border-[#111111]/10 rounded-xl flex items-start gap-2"><Shield className="w-3 h-3 text-[#1F6B4A] shrink-0 mt-0.5" /><p className="text-[10px] text-[#111111]/60 leading-relaxed">Phone is hashed immediately after verification. Staff see only a token.</p></div>
      </>
    );

    const renderOtpStep = () => (
      <>
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#DCE8E0] text-[#1F6B4A] rounded-2xl flex items-center justify-center mx-auto"><MessageSquare className="w-7 h-7" /></div>
          <div>
            <h1 className="font-serif text-xl font-bold text-[#111111]">Verify your number</h1>
            <p className="text-[11px] text-[#111111]/60 mt-1">We sent a 4-digit code to <strong className="font-mono text-[#111111]">{maskPhone(phone)}</strong></p>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border-2 border-dashed border-amber-400 rounded-xl text-center">
          <div className="text-[9px] font-mono uppercase text-amber-700 tracking-wider font-bold">Demo code</div>
          <div className="font-mono text-2xl font-bold text-amber-900 tracking-[0.4em] mt-0.5">{generatedOtp}</div>
          <div className="text-[8px] text-amber-700/70 mt-1">In production this arrives via SMS</div>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-2">
          <input
            value={otpInput}
            onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setOtpError(null); }}
            placeholder=""
            inputMode="numeric"
            maxLength={4}
            autoFocus
            disabled={otpAttempts >= MAX_OTP_ATTEMPTS || otpProcessing}
            className={'w-full text-center font-mono text-2xl tracking-[0.5em] py-3 bg-white border-2 rounded-xl outline-none transition-colors ' + (otpError ? 'border-rose-300 focus:border-rose-500' : 'border-[#111111]/20 focus:border-[#1F6B4A]') + ' disabled:opacity-50'}
          />
          {otpError && (
            <div className="text-[10px] text-rose-600 flex items-center gap-1 justify-center">
              <AlertCircle className="w-3 h-3" />{otpError}
            </div>
          )}
          <button type="submit" disabled={otpInput.length !== 4 || otpProcessing || otpAttempts >= MAX_OTP_ATTEMPTS} className="w-full py-3 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {otpProcessing ? 'Verifying...' : 'Verify & continue'}
          </button>
        </form>

        <div className="text-center text-[10px] text-[#111111]/50">
          {resendCooldown > 0 ? (
            <span>Resend code in {resendCooldown}s</span>
          ) : (
            <button type="button" onClick={handleResend} className="text-[#1F6B4A] hover:underline font-medium">Resend code</button>
          )}
        </div>

        <button type="button" onClick={handleBackToPhone} className="w-full text-center text-[10px] text-[#111111]/40 hover:text-[#111111] flex items-center justify-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Use a different number
        </button>
      </>
    );

    return (
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        <div className="w-full max-w-[340px] bg-[#1a1a1a] rounded-[2.5rem] p-3 shadow-2xl border-[10px] border-black shrink-0">
          <div className="bg-[#FAF8F4] rounded-[2rem] overflow-hidden flex flex-col h-[620px]">
            <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[10px] font-medium text-[#111111]/60">
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-[8px] font-mono bg-[#DCE8E0] text-[#1F6B4A] px-1.5 py-0.5 rounded uppercase font-bold">Anonymous</span>
            </div>
            <div className="flex-1 flex flex-col justify-center px-6 space-y-5 overflow-y-auto">
              {intakeStep === 'phone' ? renderPhoneStep() : renderOtpStep()}
            </div>
            <div className="p-3 text-center text-[9px] text-[#111111]/40 font-mono border-t border-[#111111]/10">Prefer SMS, USSD, or WhatsApp? Use the top navigation.</div>
          </div>
        </div>
        <div className="w-full max-w-sm space-y-3">
          <div className="p-4 bg-white border border-[#111111]/5 shadow-sm rounded-xl space-y-2">
            <h3 className="text-sm font-bold text-[#111111] flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#1F6B4A]" /> How it works</h3>
            <div className="space-y-1.5 text-[10px] text-[#111111]/70">
              {[
                'Enter any phone number',
                'Receive a 4-digit verification code (simulated)',
                'Token is generated on verification (HMAC)',
                'Raw phone is never stored - only the token',
                'Your history persists per token, even after refresh',
              ].map((s, i) => (
                <div key={s} className="flex gap-2"><span className="font-mono text-[#1F6B4A] font-bold shrink-0">{i + 1}.</span><span>{s}</span></div>
              ))}
            </div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 leading-relaxed">
            <strong>Demo note:</strong> the verification code is displayed on screen. In production it arrives via SMS.
          </div>
        </div>
      </div>
    );
  }

  const renderHome = () => (
    <RequesterHome
      tokenHash={tokenHash}
      unseenRedemptions={unseenRedemptions}
      dismissRedemptions={dismissRedemptions}
      unseen={unseen}
      dismissUnseen={dismissUnseen}
      rate={rate}
      MAX_REQUESTS={MAX_REQUESTS}
      rateLimited={rateLimited}
      goTab={goTab}
      myVouchers={myVouchers}
      mergedHistory={mergedHistory}
      swapRequests={swapRequests}
      handleWithdraw={handleWithdraw}
      collectError={collectError}
      setCollectError={setCollectError}
      collectRequest={collectRequest}
      setPayingRequest={setPayingRequest}
      sessionStats={sessionStats}
    />
  );

  const renderSwap = () => (
    <SwapFlow
      swapStep={swapStep}
      setSwapStep={setSwapStep}
      swapBundle={swapBundle}
      setSwapBundle={setSwapBundle}
      swapLocation={swapLocation}
      setSwapLocation={setSwapLocation}
      swapResult={swapResult}
      swapError={swapError}
      swapping={swapping}
      rateLimited={rateLimited}
      handleReserve={handleReserve}
      copyPin={copyPin}
      pinCopied={pinCopied}
      goTab={goTab}
    />
  );

  const renderPool = () => (
    <PoolFlow
      poolStep={poolStep}
      setPoolStep={setPoolStep}
      poolResult={poolResult}
      poolCat={poolCat}
      setPoolCat={setPoolCat}
      poolObject={poolObject}
      setPoolObject={setPoolObject}
      poolAmount={poolAmount}
      setPoolAmount={setPoolAmount}
      poolError={poolError}
      setPoolError={setPoolError}
      objectError={objectError}
      objectValid={objectValid}
      willEscalate={willEscalate}
      numAmount={numAmount}
      valueRemaining={valueRemaining}
      pooling={pooling}
      rateLimited={rateLimited}
      handleSubmitPool={handleSubmitPool}
      goTab={goTab}
    />
  );

  const renderMatch = () => (
    <MatchTab
      opportunitiesWithIcons={opportunitiesWithIcons}
      declined={declined}
      setDeclined={setDeclined}
      matchSent={matchSent}
      setMatchSent={setMatchSent}
      selectedOpp={selectedOpp}
      setSelectedOpp={setSelectedOpp}
      matchConfirmed={matchConfirmed}
      setMatchConfirmed={setMatchConfirmed}
      expressInterest={expressInterest}
    />
  );

  const renderBench = () => (
    <BenchTab helplines={helplines} />
  );

  const renderContent = () => {
    if (tab === 'home') return renderHome();
    if (tab === 'swap') return renderSwap();
    if (tab === 'pool') return renderPool();
    if (tab === 'match') return renderMatch();
    if (tab === 'messages') return <RequesterMessages />;
    if (tab === 'settings') return renderSettings();
    return renderBench();
  };

  const handleHouseholdComplete = async (size: number) => {
    if (!tokenHash) return;
    try {
      await apiSetHousehold(tokenHash, size);
      setHouseholdStep(false);
      setHouseholdMode(null);
      setHouseholdError(null);
    } catch {
      setHouseholdError('Could not save. Please try again.');
    }
  };

  const renderHouseholdStep = () => (
    <HouseholdSetup
      householdMode={householdMode}
      setHouseholdMode={setHouseholdMode}
      householdSize={householdSize}
      setHouseholdSize={setHouseholdSize}
      householdError={householdError}
      handleHouseholdComplete={handleHouseholdComplete}
    />
  );

  if (householdStep) {
    return renderHouseholdStep();
  }
  const renderSettings = () => (
    <SettingsTab
      tokenHash={tokenHash}
      rate={rate}
      MAX_REQUESTS={MAX_REQUESTS}
      MAX_VALUE={MAX_VALUE}
      historyCount={mergedHistory.length}
      showServer={showServer}
      setShowServer={setShowServer}
      onBack={() => setTab('home')}
      onReset={() => {
        setTab('home');
        setShowServer(false);
        logout();
        setIntakeStep('phone');
        setPhone('');
        setOtpInput('');
        setGeneratedOtp('');
        setOtpAttempts(0);
        setResendCooldown(0);
      }}
      logout={logout}
    />
  );


  const TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
    { id: 'home', label: 'Home', Icon: Home }, { id: 'swap', label: 'Swap', Icon: Package }, { id: 'pool', label: 'Pool', Icon: CreditCard }, { id: 'match', label: 'Match', Icon: Users }, { id: 'bench', label: 'Bench', Icon: MessageCircle },
  ];

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-[420px] bg-[#1a1a1a] rounded-[2.5rem] p-3 shadow-2xl border-[10px] border-black shrink-0">
        <div className="bg-[#FAF8F4] rounded-[2rem] overflow-hidden flex flex-col h-[640px]">
          <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[10px] font-medium text-[#111111]/60"><span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span className="text-[8px] font-mono bg-[#DCE8E0] text-[#1F6B4A] px-1.5 py-0.5 rounded uppercase font-bold">Anonymous</span></div>
          <div className="px-5 pb-2 border-b border-[#111111]/10 flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#1F6B4A] rounded-xl flex items-center justify-center"><HeartHandshake className="w-4 h-4 text-white" /></div><div><div className="text-xs font-bold text-[#111111] leading-tight">Mutual Circle</div><div className="text-[9px] text-[#111111]/40 font-mono truncate max-w-[150px]">{tokenHash}</div></div></div><div className="flex items-center gap-1">
      <button onClick={() => setTab('messages')} className={'relative p-1 rounded ' + (tab === 'messages' ? 'text-[#1F6B4A]' : 'text-[#111111]/40 hover:text-[#1F6B4A]')} aria-label="Messages" title="Messages">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-rose-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>
      <button onClick={() => setTab('settings')} className={'relative p-1 rounded ' + (tab === 'settings' ? 'text-[#1F6B4A]' : 'text-[#111111]/40 hover:text-[#1F6B4A]')} aria-label="Settings" title="Settings"><Settings className="w-4 h-4" /></button>
      <button onClick={logout} className="text-[#111111]/40 hover:text-rose-600 p-1 rounded" aria-label="End session" title="End session"><LogOut className="w-4 h-4" /></button>
    </div></div>
          <div key={tab} className="flex-1 overflow-y-auto animate-in fade-in duration-200">{renderContent()}</div>
          <div className="border-t border-[#111111]/10 bg-white"><div className="grid grid-cols-5">{TABS.map(t => { const I = t.Icon; const active = tab === t.id; return (<button key={t.id} onClick={() => goTab(t.id)} className={'py-2.5 flex flex-col items-center gap-1 ' + (active ? 'text-[#1F6B4A]' : 'text-[#111111]/40')}><div className={'px-3 py-1 rounded-full transition-colors ' + (active ? 'bg-[#DCE8E0]' : '')}><I className="w-4 h-4" /></div><span className="text-[9px] font-medium">{t.label}</span></button>); })}</div></div>
        </div>
      </div>


      
      {payingRequest && (
        <MpesaModal mode="request" targetId={payingRequest.id} amount={payingRequest.amount} onClose={() => setPayingRequest(null)} />
      )}
    </div>
  );
};
