import React from 'react';
import { Users, AlertCircle, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface HouseholdSetupProps {
  householdMode: 'alone' | 'family' | null;
  setHouseholdMode: (mode: 'alone' | 'family' | null) => void;
  householdSize: number;
  setHouseholdSize: (size: number) => void;
  householdError: string | null;
  handleHouseholdComplete: (size: number) => Promise<void>;
}

export const HouseholdSetup: React.FC<HouseholdSetupProps> = (props) => {
  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 p-4">
      <div className="w-full max-w-[400px] bg-surface rounded-[22px] p-6 shadow-soft border border-tile">
        <div className="text-center space-y-3 mb-6">
          <div className="w-16 h-16 bg-lime text-pine rounded-2xl flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Who is this for?</h1>
            <p className="text-sm text-muted mt-1">This helps us prepare the right bundle size.</p>
          </div>
        </div>

        {props.householdMode === null && (
          <div className="space-y-3">
            <button
              onClick={() => props.handleHouseholdComplete(1)}
              className="w-full p-4 bg-canvas border-2 border-tile hover:border-pine rounded-[16px] text-left transition-colors"
            >
              <div className="text-sm font-bold text-ink">Just me</div>
              <div className="text-xs text-muted mt-1">A standard bundle for one person</div>
            </button>
            <button
              onClick={() => { props.setHouseholdMode('family'); props.setHouseholdSize(2); }}
              className="w-full p-4 bg-canvas border-2 border-tile hover:border-pine rounded-[16px] text-left transition-colors"
            >
              <div className="text-sm font-bold text-ink">My household</div>
              <div className="text-xs text-muted mt-1">Bundles sized for 2 or more people</div>
            </button>
          </div>
        )}

        {props.householdMode === 'family' && (
          <div className="space-y-4">
            <div className="text-center">
              <label className="text-xs font-semibold uppercase text-muted">
                How many people, including you?
              </label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button
                  key={n}
                  onClick={() => props.setHouseholdSize(n)}
                  className={`py-3 rounded-[12px] border-2 text-center text-sm font-bold transition-all ${
                    props.householdSize === n
                      ? 'bg-pine text-white border-pine'
                      : 'bg-canvas border-tile text-ink hover:border-pine'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={() => props.setHouseholdSize(10)}
                className={`px-4 py-2 rounded-[12px] border-2 text-sm font-bold transition-all ${
                  props.householdSize >= 10
                    ? 'bg-pine text-white border-pine'
                    : 'bg-canvas border-tile text-ink'
                }`}
              >
                10 or more
              </button>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" fullWidth onClick={() => { props.setHouseholdMode(null); }}>
                Back
              </Button>
              <Button variant="primary" fullWidth onClick={() => props.handleHouseholdComplete(props.householdSize)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {props.householdError && (
          <div className="text-xs text-rose-600 flex items-center gap-1 justify-center mt-3">
            <AlertCircle className="w-3 h-3" />
            {props.householdError}
          </div>
        )}

        <div className="pt-6 mt-6 text-center text-xs text-muted border-t border-tile">
          You can update this later in your profile
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <Card className="space-y-2">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-pine" />
            Why we ask
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            Your household size determines the bundle variant. A single person gets one week of staples. A family of five gets a larger bundle with more of the same items.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            We never share this information. It is used only to size your bundle correctly.
          </p>
        </Card>

        <Card variant="tile" className="space-y-2">
          <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Bundle sizes</h4>
          <div className="text-sm text-muted space-y-1">
            <div className="flex justify-between"><span>1 person</span><span className="font-semibold text-ink">Small</span></div>
            <div className="flex justify-between"><span>2-3 people</span><span className="font-semibold text-ink">Standard</span></div>
            <div className="flex justify-between"><span>4-6 people</span><span className="font-semibold text-ink">Large</span></div>
            <div className="flex justify-between"><span>7+ people</span><span className="font-semibold text-ink">Family</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
};