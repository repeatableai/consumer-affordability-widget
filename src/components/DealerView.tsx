import React from 'react';
import type { AffordabilityAnalysis, ShopperProfile, Vehicle } from '../model/types';
import { detectSegment } from '../model/segmentation';

interface Props {
  analysis: AffordabilityAnalysis;
  shopper: ShopperProfile;
  vehicle: Vehicle;
  onBack: () => void;
}

export function DealerView({ analysis, shopper, vehicle, onBack }: Props) {
  const { paymentFit, paymentEstimate, ownership, leadSummary, protections, structureSuggestions } = analysis;
  const segment = detectSegment(shopper);
  const fmt = (n: number) => '$' + n.toLocaleString();
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const scoreColor = paymentFit.level === 'comfortable' ? 'var(--aw-accent)'
    : paymentFit.level === 'stretch' ? 'var(--aw-warning)' : 'var(--aw-danger)';

  return (
    <div className="aw-dealer-view">
      <div className="aw-dealer-header">
        <div>
          <h1>Lead Intelligence Summary</h1>
          <span style={{ fontSize: 12, color: 'var(--aw-text-light)' }}>Generated {now}</span>
        </div>
        <div className="aw-dealer-score">
          <div>
            <div className="aw-dealer-score-num" style={{ color: scoreColor }}>{paymentFit.score}</div>
            <div className="aw-dealer-score-label">Fit Score</div>
          </div>
        </div>
      </div>

      {/* Appointment Framing */}
      <div className="aw-summary-quote" style={{ marginBottom: 20 }}>
        {leadSummary.appointmentFraming}
      </div>

      {/* Customer Profile */}
      <div className="aw-dealer-section">
        <h3>Customer Profile</h3>
        <div className="aw-dealer-grid">
          <div className="aw-dealer-item">
            <label>Segment</label>
            <p>{segment.label}</p>
          </div>
          <div className="aw-dealer-item">
            <label>Credit Band</label>
            <p style={{ textTransform: 'capitalize' }}>{shopper.creditBand}</p>
          </div>
          <div className="aw-dealer-item">
            <label>Payment Frequency</label>
            <p style={{ textTransform: 'capitalize' }}>{shopper.payFrequency}</p>
          </div>
          <div className="aw-dealer-item">
            <label>Priority</label>
            <p style={{ textTransform: 'capitalize' }}>{shopper.priority.replace('-', ' ')}</p>
          </div>
          <div className="aw-dealer-item">
            <label>Ownership Horizon</label>
            <p>{shopper.ownershipYears} years</p>
          </div>
          <div className="aw-dealer-item">
            <label>Tone Guidance</label>
            <p style={{ textTransform: 'capitalize' }}>{segment.toneAdjustment}</p>
          </div>
        </div>
      </div>

      {/* Deal Structure */}
      <div className="aw-dealer-section">
        <h3>Deal Structure</h3>
        <div className="aw-dealer-grid">
          <div className="aw-dealer-item">
            <label>Vehicle</label>
            <p>{vehicle.year} {vehicle.make} {vehicle.model}</p>
          </div>
          <div className="aw-dealer-item">
            <label>Vehicle Price</label>
            <p>{fmt(vehicle.price)}</p>
          </div>
          <div className="aw-dealer-item">
            <label>Down Payment</label>
            <p>{fmt(shopper.downPayment)}</p>
          </div>
          <div className="aw-dealer-item">
            <label>Suggested Down Payment</label>
            <p>{fmt(leadSummary.suggestedDownPayment)}</p>
          </div>
          <div className="aw-dealer-item">
            <label>Comfort Payment Range</label>
            <p>{fmt(leadSummary.comfortPaymentRange.min)} – {fmt(leadSummary.comfortPaymentRange.max)}/mo</p>
          </div>
          <div className="aw-dealer-item">
            <label>Estimated Payment</label>
            <p>{fmt(paymentEstimate.monthlyPayment)}/mo</p>
          </div>
          <div className="aw-dealer-item">
            <label>Est. APR</label>
            <p>{(paymentEstimate.apr * 100).toFixed(1)}%</p>
          </div>
          <div className="aw-dealer-item">
            <label>Term</label>
            <p>{paymentEstimate.termMonths} months</p>
          </div>
          <div className="aw-dealer-item">
            <label>Trade Status</label>
            <p>{leadSummary.tradeStatus}</p>
          </div>
          <div className="aw-dealer-item">
            <label>Total Monthly Burden</label>
            <p>{fmt(ownership.totalMonthlyBurden)}/mo</p>
          </div>
        </div>
      </div>

      {/* Fit Assessment */}
      <div className="aw-dealer-section">
        <h3>Fit Assessment</h3>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 14,
          background: paymentFit.level === 'comfortable' ? '#d5f5e3' :
            paymentFit.level === 'stretch' ? '#fdebd0' : '#fadbd8',
          color: paymentFit.level === 'comfortable' ? '#1e8449' :
            paymentFit.level === 'stretch' ? '#b9770e' : '#a93226',
          marginBottom: 10,
        }}>
          {paymentFit.level === 'comfortable' ? 'Comfortable' :
            paymentFit.level === 'stretch' ? 'Manageable Stretch' : 'Risky'} — Score: {paymentFit.score}/100
        </div>
        <p style={{ fontSize: 14 }}>{paymentFit.explanation}</p>
      </div>

      {/* Structure Suggestions for Desking */}
      {structureSuggestions.length > 0 && (
        <div className="aw-dealer-section">
          <h3>Desking Suggestions</h3>
          {structureSuggestions.map(s => (
            <div key={s.id} className={`aw-suggestion ${s.priority}`} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 13 }}>{s.message}</p>
              <span className="aw-impact">{s.impact}</span>
            </div>
          ))}
        </div>
      )}

      {/* Protection Priorities */}
      <div className="aw-dealer-section">
        <h3>F&I Guidance</h3>
        <p style={{ fontSize: 13, color: 'var(--aw-text-light)', marginBottom: 10 }}>
          Customer-indicated protection interest. Products marked "Recommended" or "Worth Considering" align with the customer's profile. Use selective presentation.
        </p>
        {protections.map(p => (
          <div key={p.product} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: '1px solid var(--aw-border)', fontSize: 14,
          }}>
            <span style={{ fontWeight: 600 }}>
              {p.product === 'gap' ? 'GAP' : p.product === 'service-contract' ? 'Service Contract' : 'Maintenance'}
            </span>
            <span className={`aw-protection-badge aw-badge-${p.level}`}>
              {p.level === 'recommended' ? 'Recommended' :
                p.level === 'worth-considering' ? 'Worth Considering' :
                  p.level === 'optional' ? 'Optional' : 'Low Priority'}
            </span>
          </div>
        ))}
        {protections.some(p => p.warningIfAdded) && (
          <div className="aw-warning" style={{ marginTop: 10 }}>
            {protections.find(p => p.warningIfAdded)?.warningIfAdded}
          </div>
        )}
      </div>

      {/* Likely Concerns */}
      {leadSummary.likelyConcerns.length > 0 && (
        <div className="aw-dealer-section">
          <h3>Likely Concerns</h3>
          <div className="aw-tag-list">
            {leadSummary.likelyConcerns.map((c, i) => (
              <span key={i} className="aw-tag">{c}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button className="aw-btn aw-btn-secondary" onClick={onBack}>&larr; Back to Customer View</button>
        <button className="aw-btn aw-btn-primary" onClick={() => window.print()}>Print This Summary</button>
      </div>
    </div>
  );
}
