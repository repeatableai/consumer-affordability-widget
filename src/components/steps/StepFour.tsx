import React from 'react';
import type { ProtectionRecommendation } from '../../model/types';

interface Props {
  protections: ProtectionRecommendation[];
  onNext: () => void;
  onBack: () => void;
}

const PRODUCT_NAMES: Record<string, string> = {
  gap: 'GAP Coverage',
  'service-contract': 'Service Contract',
  'maintenance-plan': 'Prepaid Maintenance Plan',
};

const BADGE_LABELS: Record<string, string> = {
  recommended: 'Recommended',
  'worth-considering': 'Worth Considering',
  optional: 'Optional',
  'not-priority': 'Low Priority',
};

export function StepFour({ protections, onNext, onBack }: Props) {
  return (
    <>
      <div className="aw-card">
        <h2>Protection Recommendations</h2>
        <p style={{ fontSize: 13, color: 'var(--aw-text-light)', marginBottom: 18 }}>
          Based on your vehicle, deal structure, and priorities, here is which protections may genuinely matter for your situation — and which ones you can likely skip.
        </p>

        {protections.map(p => (
          <div key={p.product} className="aw-protection">
            <div className="aw-protection-header">
              <span className="aw-protection-name">{PRODUCT_NAMES[p.product]}</span>
              <span className={`aw-protection-badge aw-badge-${p.level}`}>
                {BADGE_LABELS[p.level]}
              </span>
            </div>
            <p>{p.reason}</p>
            <div className="aw-payment-impact">
              Estimated impact: ~${p.paymentImpact}/mo added to payment
            </div>
            {p.warningIfAdded && (
              <div className="aw-warning">{p.warningIfAdded}</div>
            )}
          </div>
        ))}
      </div>

      <div className="aw-actions">
        <button className="aw-btn aw-btn-secondary" onClick={onBack}>&larr; Back</button>
        <button className="aw-btn aw-btn-accent" onClick={onNext}>Build My Shopping Plan &rarr;</button>
      </div>
    </>
  );
}
