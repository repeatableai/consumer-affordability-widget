import React, { useState, useMemo } from 'react';
import type { AffordabilityAnalysis, ShopperProfile, Vehicle } from '../../model/types';
import { analyzeAffordability, calculateBiweeklySavings } from '../../model/engine';
import { detectSegment } from '../../model/segmentation';
import { VehicleCompare } from '../VehicleCompare';

interface Props {
  analysis: AffordabilityAnalysis;
  shopper: ShopperProfile;
  vehicle: Vehicle;
  onNext: () => void;
  onBack: () => void;
}

export function StepTwo({ analysis: initialAnalysis, shopper, vehicle, onNext, onBack }: Props) {
  // What-If sliders
  const [wfDownPayment, setWfDownPayment] = useState(shopper.downPayment);
  const [wfTerm, setWfTerm] = useState(initialAnalysis.paymentEstimate.termMonths);
  const [wfPrice, setWfPrice] = useState(vehicle.price);
  const [showCompare, setShowCompare] = useState(false);

  // Live recalculation
  const liveAnalysis = useMemo(() => {
    const adjShopper = { ...shopper, downPayment: wfDownPayment };
    const adjVehicle = { ...vehicle, price: wfPrice };
    const segment = detectSegment(adjShopper);
    return analyzeAffordability(adjShopper, adjVehicle, segment);
  }, [wfDownPayment, wfTerm, wfPrice, shopper, vehicle]);

  const { paymentFit, ownership, paymentEstimate } = liveAnalysis;

  // Biweekly savings
  const biweeklySavings = useMemo(() => {
    const adjShopper = { ...shopper, downPayment: wfDownPayment };
    const adjVehicle = { ...vehicle, price: wfPrice };
    return calculateBiweeklySavings(adjShopper, adjVehicle);
  }, [wfDownPayment, wfPrice, shopper, vehicle]);

  const segment = useMemo(() => detectSegment(shopper), [shopper]);

  const isModified = wfDownPayment !== shopper.downPayment || wfPrice !== vehicle.price;
  const markerPos = Math.max(2, Math.min(98, paymentFit.score));
  const fmt = (n: number) => '$' + n.toLocaleString();

  return (
    <>
      {/* Segment indicator */}
      <div className="aw-card" style={{ padding: '14px 20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 12, color: 'var(--aw-text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your profile</span>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{segment.label}</div>
          </div>
          <span className={`aw-fit-label aw-fit-${paymentFit.level}`} style={{ margin: 0 }}>
            {paymentFit.level === 'comfortable' && 'Comfortable'}
            {paymentFit.level === 'stretch' && 'Manageable Stretch'}
            {paymentFit.level === 'caution' && 'Risky'}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--aw-text-light)', marginTop: 6 }}>{segment.description}</p>
      </div>

      {/* Payment Fit Meter */}
      <div className="aw-card">
        <h2>Payment Fit</h2>

        <div className="aw-meter">
          <div className="aw-meter-bar">
            <div className="aw-meter-marker" style={{ left: `${markerPos}%` }} />
          </div>
          <div className="aw-meter-labels">
            <span>Risky</span>
            <span>Stretch</span>
            <span>Comfortable</span>
          </div>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.6 }}>
          {paymentFit.explanation}
        </p>

        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--aw-bg)', borderRadius: 8, fontSize: 14 }}>
          <strong>Estimated payment:</strong> {fmt(paymentEstimate.monthlyPayment)}/mo
          {paymentEstimate.biweeklyPayment > 0 && (
            <span style={{ color: 'var(--aw-text-light)', marginLeft: 10 }}>
              ({fmt(paymentEstimate.biweeklyPayment)} biweekly)
            </span>
          )}
          <br />
          <span style={{ color: 'var(--aw-text-light)', fontSize: 12 }}>
            {paymentEstimate.termMonths} months at {(paymentEstimate.apr * 100).toFixed(1)}% est. APR
            &nbsp;&middot;&nbsp; {fmt(paymentEstimate.totalInterest)} total interest
          </span>
        </div>
      </div>

      {/* Ownership Reality Snapshot */}
      <div className="aw-card">
        <h2>Ownership Reality Snapshot</h2>
        <p style={{ fontSize: 13, color: 'var(--aw-text-light)', marginBottom: 16 }}>
          Your real monthly cost of ownership — not just the loan payment.
        </p>

        <div className="aw-snapshot-grid">
          <div className="aw-snapshot-item">
            <div className="aw-amount">{fmt(ownership.estimatedPayment)}</div>
            <div className="aw-label">Loan Payment</div>
          </div>
          <div className="aw-snapshot-item">
            <div className="aw-amount">{fmt(ownership.estimatedInsurance)}</div>
            <div className="aw-label">Est. Insurance</div>
          </div>
          <div className="aw-snapshot-item">
            <div className="aw-amount">{fmt(ownership.estimatedMaintenance)}</div>
            <div className="aw-label">Est. Maintenance</div>
          </div>
          <div className="aw-snapshot-item">
            <div className="aw-amount">{fmt(ownership.estimatedFuel)}</div>
            <div className="aw-label">Est. Fuel</div>
          </div>
        </div>

        <div className="aw-snapshot-total">
          <div className="aw-amount">{fmt(ownership.totalMonthlyBurden)}</div>
          <div className="aw-label">Estimated Total Monthly Cost of Ownership</div>
        </div>
      </div>

      {/* Biweekly Savings Breakdown */}
      {(shopper.payFrequency === 'biweekly' || segment.showBiweeklySavings) && biweeklySavings.interestSaved > 0 && (
        <div className="aw-card">
          <h2>Biweekly Payment Savings</h2>
          <p style={{ fontSize: 13, color: 'var(--aw-text-light)', marginBottom: 16 }}>
            Switching from monthly to biweekly payments effectively makes one extra payment per year, reducing your total interest and loan duration.
          </p>

          <div className="aw-savings-highlight">
            <div className="aw-savings-item">
              <div className="aw-amount">{fmt(biweeklySavings.interestSaved)}</div>
              <div className="aw-label">Interest Saved</div>
            </div>
            <div className="aw-savings-item">
              <div className="aw-amount">{biweeklySavings.monthsShaved} mo</div>
              <div className="aw-label">Paid Off Sooner</div>
            </div>
            <div className="aw-savings-item">
              <div className="aw-amount">{fmt(biweeklySavings.biweeklyTotalCost)}</div>
              <div className="aw-label">Total Cost (Biweekly)</div>
            </div>
          </div>

          <div style={{ fontSize: 13, padding: '10px 14px', background: 'var(--aw-bg)', borderRadius: 6 }}>
            <strong>Monthly total cost:</strong> {fmt(biweeklySavings.monthlyTotalCost)}
            <span style={{ margin: '0 8px', color: 'var(--aw-text-light)' }}>vs.</span>
            <strong>Biweekly total cost:</strong> {fmt(biweeklySavings.biweeklyTotalCost)}
          </div>
        </div>
      )}

      {/* What-If Simulator */}
      <div className="aw-card">
        <h2>What If...?</h2>
        <p style={{ fontSize: 13, color: 'var(--aw-text-light)', marginBottom: 18 }}>
          Drag the sliders to see how changes affect your payment fit in real time.
        </p>

        <div className="aw-slider-group">
          <div className="aw-slider-header">
            <label>Down Payment</label>
            <span className="aw-slider-value">{fmt(wfDownPayment)}</span>
          </div>
          <input
            type="range"
            className="aw-slider"
            min={0}
            max={Math.round(vehicle.price * 0.5)}
            step={250}
            value={wfDownPayment}
            onChange={e => setWfDownPayment(+e.target.value)}
          />
        </div>

        <div className="aw-slider-group">
          <div className="aw-slider-header">
            <label>Vehicle Price</label>
            <span className="aw-slider-value">{fmt(wfPrice)}</span>
          </div>
          <input
            type="range"
            className="aw-slider"
            min={Math.round(vehicle.price * 0.5)}
            max={Math.round(vehicle.price * 1.5)}
            step={500}
            value={wfPrice}
            onChange={e => setWfPrice(+e.target.value)}
          />
        </div>

        {isModified && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <button
              className="aw-btn aw-btn-secondary"
              style={{ fontSize: 13, padding: '8px 16px' }}
              onClick={() => { setWfDownPayment(shopper.downPayment); setWfPrice(vehicle.price); }}
            >
              Reset to Original
            </button>
          </div>
        )}
      </div>

      {/* Vehicle Comparison */}
      {!showCompare ? (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <button
            className="aw-btn aw-btn-secondary"
            onClick={() => setShowCompare(true)}
          >
            Compare Up to 3 Vehicles
          </button>
        </div>
      ) : (
        <VehicleCompare shopper={shopper} baseVehicle={vehicle} onClose={() => setShowCompare(false)} />
      )}

      <div className="aw-actions">
        <button className="aw-btn aw-btn-secondary" onClick={onBack}>&larr; Back</button>
        <button className="aw-btn aw-btn-primary" onClick={onNext}>Structure Guidance &rarr;</button>
      </div>
    </>
  );
}
