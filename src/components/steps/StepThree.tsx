import React from 'react';
import type { StructureSuggestion } from '../../model/types';

interface Props {
  suggestions: StructureSuggestion[];
  onNext: () => void;
  onBack: () => void;
}

export function StepThree({ suggestions, onNext, onBack }: Props) {
  return (
    <>
      <div className="aw-card">
        <h2>Smart Structure Suggestions</h2>
        <p style={{ fontSize: 13, color: 'var(--aw-text-light)', marginBottom: 18 }}>
          Based on your profile, here are changes that could improve your payment comfort and long-term outcome.
        </p>

        {suggestions.length === 0 ? (
          <div className="aw-suggestion low">
            <p>Your current deal structure looks solid. No major adjustments needed.</p>
          </div>
        ) : (
          suggestions.map(s => (
            <div key={s.id} className={`aw-suggestion ${s.priority}`}>
              <p>{s.message}</p>
              <span className="aw-impact">{s.impact}</span>
            </div>
          ))
        )}
      </div>

      <div className="aw-actions">
        <button className="aw-btn aw-btn-secondary" onClick={onBack}>&larr; Back</button>
        <button className="aw-btn aw-btn-primary" onClick={onNext}>Protection Guide &rarr;</button>
      </div>
    </>
  );
}
