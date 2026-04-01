import React, { useState, useCallback, useEffect, useRef } from 'react';
import './styles.css';
import type { ShopperProfile, Vehicle, AffordabilityAnalysis } from './model/types';
import { analyzeAffordability } from './model/engine';
import { detectSegment } from './model/segmentation';
import { StepOne } from './components/steps/StepOne';
import { StepTwo } from './components/steps/StepTwo';
import { StepThree } from './components/steps/StepThree';
import { StepFour } from './components/steps/StepFour';
import { StepFive } from './components/steps/StepFive';
import { DealerView } from './components/DealerView';
import { Disclaimer } from './components/Disclaimer';

const STEP_LABELS = [
  'Your Preferences',
  'Payment Fit',
  'Structure Guidance',
  'Protection Guide',
  'Your Shopping Plan',
];

const DEFAULT_VEHICLE: Vehicle = {
  id: 'demo',
  year: 2022,
  make: 'Toyota',
  model: 'RAV4',
  mileage: 35000,
  price: 29500,
  condition: 'used',
  type: 'SUV',
  mpgCity: 27,
  mpgHighway: 35,
};

// Read dealer branding from widget container data attributes
function getDealerConfig() {
  const el = document.getElementById('affordability-widget');
  if (!el) return {};
  return {
    dealerName: el.dataset.dealerName,
    primaryColor: el.dataset.primaryColor,
    accentColor: el.dataset.accentColor,
    logoUrl: el.dataset.logoUrl,
  };
}

function StepWrapper({ children, step }: { children: React.ReactNode; step: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('aw-step-visible');
    el.classList.add('aw-step-enter');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add('aw-step-visible');
      });
    });
  }, [step]);

  return <div ref={ref} className="aw-step-enter">{children}</div>;
}

export function App() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ShopperProfile | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle>(DEFAULT_VEHICLE);
  const [analysis, setAnalysis] = useState<AffordabilityAnalysis | null>(null);
  const [showDealerView, setShowDealerView] = useState(false);

  // Apply dealer branding on mount
  useEffect(() => {
    const config = getDealerConfig();
    const root = document.documentElement;
    if (config.primaryColor) root.style.setProperty('--aw-primary', config.primaryColor);
    if (config.accentColor) root.style.setProperty('--aw-accent', config.accentColor);
  }, []);

  const dealerConfig = getDealerConfig();

  const handleStepOneComplete = useCallback((shopperProfile: ShopperProfile, vehicleData: Vehicle) => {
    setProfile(shopperProfile);
    setVehicle(vehicleData);
    const segment = detectSegment(shopperProfile);
    const result = analyzeAffordability(shopperProfile, vehicleData, segment);
    setAnalysis(result);
    setStep(1);
  }, []);

  const next = () => setStep(s => Math.min(s + 1, 4));
  const back = () => setStep(s => Math.max(s - 1, 0));
  const restart = () => { setStep(0); setProfile(null); setAnalysis(null); setShowDealerView(false); };

  if (showDealerView && analysis && profile) {
    return (
      <DealerView
        analysis={analysis}
        shopper={profile}
        vehicle={vehicle}
        onBack={() => setShowDealerView(false)}
      />
    );
  }

  return (
    <div className="aw-widget">
      <div className="aw-header">
        {dealerConfig.logoUrl && (
          <img src={dealerConfig.logoUrl} alt={dealerConfig.dealerName || 'Dealer'} style={{ maxHeight: 40, marginBottom: 8 }} />
        )}
        <h1>{dealerConfig.dealerName ? `${dealerConfig.dealerName} — ` : ''}Smart Payment &amp; Protection Guide</h1>
        <p>Shop with confidence. Understand your comfortable range and what matters for your situation.</p>
      </div>

      <div className="aw-progress">
        {STEP_LABELS.map((label, i) => (
          <div
            key={i}
            className={`aw-progress-step ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
            title={label}
          />
        ))}
      </div>

      <StepWrapper step={step}>
        {step === 0 && (
          <StepOne defaultVehicle={vehicle} onComplete={handleStepOneComplete} />
        )}

        {step === 1 && analysis && profile && (
          <StepTwo analysis={analysis} shopper={profile} vehicle={vehicle} onNext={next} onBack={back} />
        )}

        {step === 2 && analysis && (
          <StepThree suggestions={analysis.structureSuggestions} onNext={next} onBack={back} />
        )}

        {step === 3 && analysis && (
          <StepFour protections={analysis.protections} onNext={next} onBack={back} />
        )}

        {step === 4 && analysis && profile && (
          <StepFive
            analysis={analysis}
            shopper={profile}
            vehicle={vehicle}
            onRestart={restart}
            onBack={back}
            onShowDealerView={() => setShowDealerView(true)}
          />
        )}
      </StepWrapper>

      <Disclaimer />
    </div>
  );
}
