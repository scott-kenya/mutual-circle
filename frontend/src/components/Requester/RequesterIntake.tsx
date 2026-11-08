import React from 'react';
import { ShieldCheck, Smartphone, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface RequesterIntakeProps {
  intakeStep: 'phone' | 'otp';
  phone: string;
  setPhone: (v: string) => void;
  phoneError: string | null;
  otpInput: string;
  setOtpInput: (v: string) => void;
  otpError: string | null;
  otpProcessing: boolean;
  resendCooldown: number;
  generatedOtp: string;
  handleSendOtp: (e: React.FormEvent) => void;
  handleVerifyOtp: (e: React.FormEvent) => void;
  handleResend: () => void;
  handleBackToPhone: () => void;
}

export const RequesterIntake: React.FC<RequesterIntakeProps> = (props) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center w-full animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-md space-y-8">
        
        {/* Branding / Hero */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-pine text-white rounded-2xl flex items-center justify-center mx-auto shadow-soft mb-6 rotate-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-ink tracking-tight">
            {props.intakeStep === 'phone' ? 'Welcome to Mutual Circle' : 'Verify your phone'}
          </h1>
          <p className="text-sm text-muted leading-relaxed max-w-[280px] mx-auto">
            {props.intakeStep === 'phone' 
              ? 'Enter your phone number to receive an anonymous token. No names, no addresses.' 
              : `We sent a 4-digit code to ${props.phone}.`}
          </p>
        </div>

        {/* Form */}
        {props.intakeStep === 'phone' ? (
          <form onSubmit={props.handleSendOtp} className="space-y-4">
            <Card className="p-2 border-tile shadow-soft">
              <div className="relative flex items-center">
                <Smartphone className="w-5 h-5 text-muted ml-3 shrink-0" />
                <input
                  type="tel"
                  value={props.phone}
                  onChange={e => props.setPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                  className="w-full bg-transparent border-none px-4 py-4 text-lg font-semibold text-ink focus:ring-0 outline-none placeholder:text-muted/50"
                  autoFocus
                />
              </div>
            </Card>
            {props.phoneError && <p className="text-sm text-rose-600 text-center">{props.phoneError}</p>}
            
            <Button type="submit" variant="primary" fullWidth className="py-4 text-base">
              Get my token <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        ) : (
          <form onSubmit={props.handleVerifyOtp} className="space-y-4">
            <Card className="p-2 border-tile shadow-soft">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={props.otpInput}
                onChange={e => props.setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="w-full bg-transparent border-none px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] font-bold text-ink focus:ring-0 outline-none placeholder:text-muted/20"
                autoFocus
              />
            </Card>
            {props.otpError && <p className="text-sm text-rose-600 text-center">{props.otpError}</p>}
            
            {/* DEV MODE: show the generated OTP so we can test locally */}
            <div className="text-center">
              <p className="text-xs text-muted">
                Dev mode — your OTP is:{' '}
                <span className="font-mono font-bold text-pine text-base tracking-widest">{props.generatedOtp}</span>
              </p>
            </div>

            <Button type="submit" variant="primary" fullWidth className="py-4 text-base" disabled={props.otpInput.length < 4 || props.otpProcessing}>
              {props.otpProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
            </Button>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={props.handleBackToPhone} className="text-sm font-semibold text-muted hover:text-ink">
                Change number
              </button>
              <button 
                type="button" 
                onClick={props.handleResend} 
                disabled={props.resendCooldown > 0}
                className="text-sm font-semibold text-pine hover:underline disabled:opacity-50"
              >
                {props.resendCooldown > 0 ? `Resend in ${props.resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {/* Privacy Note */}
        <p className="text-center text-xs text-muted leading-relaxed px-4">
          Your phone number is hashed into a secure token and immediately discarded. We never store your raw number, name, or location.
        </p>

      </div>
    </div>
  );
};