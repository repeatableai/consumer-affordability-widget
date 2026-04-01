import React, { useState, useRef } from 'react';
import type { AffordabilityAnalysis, ShopperProfile, Vehicle } from '../../model/types';
import { detectSegment } from '../../model/segmentation';

interface Props {
  analysis: AffordabilityAnalysis;
  shopper: ShopperProfile;
  vehicle: Vehicle;
  onRestart: () => void;
  onBack: () => void;
  onShowDealerView: () => void;
}

export function StepFive({ analysis, shopper, vehicle, onRestart, onBack, onShowDealerView }: Props) {
  const { leadSummary, paymentFit, paymentEstimate } = analysis;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const segment = detectSegment(shopper);
  const fmt = (n: number) => '$' + n.toLocaleString();

  const handleSubmit = () => {
    // In production, POST to dealer CRM endpoint
    console.log('Lead submitted:', {
      contact: { name, email, phone },
      segment: segment.segment,
      summary: leadSummary,
      analysis: {
        fitScore: paymentFit.score,
        fitLevel: paymentFit.level,
        monthlyPayment: paymentEstimate.monthlyPayment,
      },
    });
    setSubmitted(true);
  };

  const handlePrint = () => window.print();

  const handleEmail = () => {
    const subject = encodeURIComponent('My Vehicle Shopping Plan');
    const body = encodeURIComponent(
      `My Shopping Plan Summary\n\n` +
      `Vehicle: ${leadSummary.preferredVehicles.join(', ')}\n` +
      `Comfortable Payment Range: $${leadSummary.comfortPaymentRange.min} - $${leadSummary.comfortPaymentRange.max}/mo\n` +
      `Estimated Payment: $${paymentEstimate.monthlyPayment}/mo\n` +
      `Suggested Down Payment: $${leadSummary.suggestedDownPayment}\n` +
      `Trade Status: ${leadSummary.tradeStatus}\n` +
      `${leadSummary.protectionPriorities.length > 0 ? `Protection Priorities: ${leadSummary.protectionPriorities.join(', ')}\n` : ''}` +
      `\nVisit Checklist:\n${leadSummary.visitChecklist.map(i => `- ${i}`).join('\n')}\n` +
      `\n${leadSummary.appointmentFraming}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  if (submitted) {
    return (
      <div className="aw-card" style={{ textAlign: 'center', padding: 40 }}>
        <h2 style={{ color: 'var(--aw-accent)', marginBottom: 12 }}>You're All Set</h2>
        <p style={{ fontSize: 15, marginBottom: 20 }}>
          Your personalized shopping plan has been sent to our team. A specialist will reach out to help you find the best fit — no pressure, just honest guidance.
        </p>
        <p style={{ fontSize: 13, color: 'var(--aw-text-light)', marginBottom: 24 }}>
          Tip: Print or email your shopping plan so you have your checklist handy for your visit.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="aw-btn aw-btn-primary" onClick={handlePrint}>Print My Plan</button>
          <button className="aw-btn aw-btn-secondary" onClick={handleEmail}>Email to Myself</button>
          <button className="aw-btn aw-btn-secondary" onClick={onRestart}>Start Over</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={summaryRef}>
      <div className="aw-card">
        <h2>Your Personalized Shopping Plan</h2>

        {/* Segment note */}
        <div style={{ fontSize: 13, color: 'var(--aw-text-light)', marginBottom: 14, fontStyle: 'italic' }}>
          Tailored for: {segment.label}
        </div>

        <div className="aw-summary-quote">
          {leadSummary.appointmentFraming}
        </div>

        <div className="aw-summary-section">
          <h3>Comfortable Payment Range</h3>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--aw-primary)' }}>
            {fmt(leadSummary.comfortPaymentRange.min)} – {fmt(leadSummary.comfortPaymentRange.max)}/mo
          </p>
          <p style={{ fontSize: 13, color: 'var(--aw-text-light)', marginTop: 4 }}>
            Estimated payment for this vehicle: {fmt(paymentEstimate.monthlyPayment)}/mo
            {shopper.payFrequency === 'biweekly' && ` (${fmt(paymentEstimate.biweeklyPayment)} biweekly)`}
          </p>
        </div>

        <div className="aw-summary-section">
          <h3>Suggested Down Payment</h3>
          <p style={{ fontSize: 16, fontWeight: 600 }}>
            {fmt(leadSummary.suggestedDownPayment)}
          </p>
        </div>

        <div className="aw-summary-section">
          <h3>Vehicle of Interest</h3>
          <div className="aw-tag-list">
            {leadSummary.preferredVehicles.map((v, i) => (
              <span key={i} className="aw-tag">{v}</span>
            ))}
          </div>
        </div>

        <div className="aw-summary-section">
          <h3>Trade-in Status</h3>
          <p style={{ fontSize: 14 }}>{leadSummary.tradeStatus}</p>
        </div>

        {leadSummary.protectionPriorities.length > 0 && (
          <div className="aw-summary-section">
            <h3>Protection Priorities</h3>
            <div className="aw-tag-list">
              {leadSummary.protectionPriorities.map((p, i) => (
                <span key={i} className="aw-tag">{p}</span>
              ))}
            </div>
          </div>
        )}

        {leadSummary.likelyConcerns.length > 0 && (
          <div className="aw-summary-section">
            <h3>Key Concerns</h3>
            <div className="aw-tag-list">
              {leadSummary.likelyConcerns.map((c, i) => (
                <span key={i} className="aw-tag">{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="aw-card">
        <h2>Visit Preparation Checklist</h2>
        <ul className="aw-checklist">
          {leadSummary.visitChecklist.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button className="aw-btn aw-btn-secondary" style={{ fontSize: 13 }} onClick={handlePrint}>Print My Plan</button>
          <button className="aw-btn aw-btn-secondary" style={{ fontSize: 13 }} onClick={handleEmail}>Email to Myself</button>
        </div>
      </div>

      <div className="aw-card">
        <div className="aw-lead-form">
          <h3>Ready to take the next step?</h3>
          <p style={{ fontSize: 13, color: 'var(--aw-text-light)', textAlign: 'center', marginBottom: 16 }}>
            Share your info and we'll connect you with a specialist who has your shopping plan ready — so you can skip the runaround.
          </p>

          <div className="aw-field">
            <label>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="aw-row">
            <div className="aw-field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div className="aw-field">
              <label>Phone (optional)</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 555-5555" />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              className="aw-btn aw-btn-accent"
              onClick={handleSubmit}
              disabled={!name || !email}
              style={{ opacity: (!name || !email) ? 0.5 : 1 }}
            >
              Send My Shopping Plan to the Dealership
            </button>
          </div>

          <p style={{ fontSize: 11, color: 'var(--aw-text-light)', textAlign: 'center', marginTop: 12 }}>
            Your information is shared only with this dealership to help prepare for your visit.
          </p>
        </div>
      </div>

      <div className="aw-actions">
        <button className="aw-btn aw-btn-secondary" onClick={onBack}>&larr; Back</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="aw-btn aw-btn-secondary" onClick={onShowDealerView} style={{ fontSize: 13 }}>
            Dealer View
          </button>
          <button className="aw-btn aw-btn-secondary" onClick={onRestart}>Start Over</button>
        </div>
      </div>
    </div>
  );
}
