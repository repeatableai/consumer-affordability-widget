import React, { useState, useMemo } from 'react';
import type { ShopperProfile, Vehicle } from '../model/types';
import { analyzeAffordability } from '../model/engine';
import { detectSegment } from '../model/segmentation';

interface Props {
  shopper: ShopperProfile;
  baseVehicle: Vehicle;
  onClose: () => void;
}

interface CompareVehicle {
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
}

const EMPTY: CompareVehicle = { year: 2022, make: '', model: '', price: 0, mileage: 0 };

export function VehicleCompare({ shopper, baseVehicle, onClose }: Props) {
  const [vehicles, setVehicles] = useState<CompareVehicle[]>([
    { year: baseVehicle.year, make: baseVehicle.make, model: baseVehicle.model, price: baseVehicle.price, mileage: baseVehicle.mileage },
    { ...EMPTY },
  ]);

  const updateVehicle = (idx: number, field: keyof CompareVehicle, value: string | number) => {
    setVehicles(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const addVehicle = () => {
    if (vehicles.length < 3) setVehicles(prev => [...prev, { ...EMPTY }]);
  };

  const removeVehicle = (idx: number) => {
    if (vehicles.length > 2) setVehicles(prev => prev.filter((_, i) => i !== idx));
  };

  const segment = useMemo(() => detectSegment(shopper), [shopper]);

  const analyses = useMemo(() => {
    return vehicles.map((v, i) => {
      if (!v.make || !v.model || v.price <= 0) return null;
      const veh: Vehicle = {
        id: `compare-${i}`,
        year: v.year,
        make: v.make,
        model: v.model,
        mileage: v.mileage,
        price: v.price,
        condition: baseVehicle.condition,
        type: baseVehicle.type,
      };
      return analyzeAffordability(shopper, veh, segment);
    });
  }, [vehicles, shopper, baseVehicle, segment]);

  const bestIdx = useMemo(() => {
    let best = -1;
    let bestScore = -1;
    analyses.forEach((a, i) => {
      if (a && a.paymentFit.score > bestScore) {
        bestScore = a.paymentFit.score;
        best = i;
      }
    });
    return best;
  }, [analyses]);

  const fmt = (n: number) => '$' + n.toLocaleString();
  const validCount = analyses.filter(Boolean).length;

  return (
    <div className="aw-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Compare Vehicles</h2>
        <button className="aw-btn aw-btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={onClose}>Close</button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--aw-text-light)', marginBottom: 16 }}>
        Enter up to 3 vehicles to see which fits your budget best.
      </p>

      {/* Input cards */}
      {vehicles.map((v, i) => (
        <div key={i} style={{ padding: 14, background: 'var(--aw-bg)', borderRadius: 8, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 13 }}>Vehicle {i + 1}{i === 0 ? ' (your pick)' : ''}</strong>
            {vehicles.length > 2 && i > 0 && (
              <button onClick={() => removeVehicle(i)} style={{ background: 'none', border: 'none', color: 'var(--aw-danger)', cursor: 'pointer', fontSize: 12 }}>Remove</button>
            )}
          </div>
          <div className="aw-row">
            <div className="aw-field" style={{ marginBottom: 8 }}>
              <input type="number" placeholder="Year" value={v.year || ''} onChange={e => updateVehicle(i, 'year', +e.target.value)} />
            </div>
            <div className="aw-field" style={{ marginBottom: 8 }}>
              <input type="number" placeholder="Price" value={v.price || ''} onChange={e => updateVehicle(i, 'price', +e.target.value)} />
            </div>
          </div>
          <div className="aw-row">
            <div className="aw-field" style={{ marginBottom: 8 }}>
              <input type="text" placeholder="Make" value={v.make} onChange={e => updateVehicle(i, 'make', e.target.value)} />
            </div>
            <div className="aw-field" style={{ marginBottom: 8 }}>
              <input type="text" placeholder="Model" value={v.model} onChange={e => updateVehicle(i, 'model', e.target.value)} />
            </div>
          </div>
          <div className="aw-field" style={{ marginBottom: 0 }}>
            <input type="number" placeholder="Mileage" value={v.mileage || ''} onChange={e => updateVehicle(i, 'mileage', +e.target.value)} />
          </div>
        </div>
      ))}

      {vehicles.length < 3 && (
        <button className="aw-btn aw-btn-secondary" style={{ fontSize: 13, width: '100%', marginBottom: 16 }} onClick={addVehicle}>
          + Add Another Vehicle
        </button>
      )}

      {/* Comparison results */}
      {validCount >= 2 && (
        <div className={`aw-compare-grid cols-${validCount}`}>
          {analyses.map((a, i) => {
            if (!a) return null;
            const v = vehicles[i];
            return (
              <div key={i} className={`aw-compare-col ${i === bestIdx ? 'best' : ''}`}>
                {i === bestIdx && <span className="aw-best-badge">Best Fit</span>}
                <h4>{v.year} {v.make} {v.model}</h4>

                <div className="aw-compare-row-label">Payment</div>
                <div className="aw-compare-row-value">{fmt(a.paymentEstimate.monthlyPayment)}/mo</div>

                <div className="aw-compare-row-label">Total Ownership</div>
                <div className="aw-compare-row-value">{fmt(a.ownership.totalMonthlyBurden)}/mo</div>

                <div className="aw-compare-row-label">Fit Score</div>
                <div className="aw-compare-row-value" style={{
                  color: a.paymentFit.level === 'comfortable' ? 'var(--aw-accent)' :
                    a.paymentFit.level === 'stretch' ? 'var(--aw-warning)' : 'var(--aw-danger)'
                }}>
                  {a.paymentFit.score}/100
                </div>

                <div className="aw-compare-row-label">Fit Level</div>
                <span className={`aw-fit-label aw-fit-${a.paymentFit.level}`} style={{ fontSize: 11 }}>
                  {a.paymentFit.level === 'comfortable' ? 'Comfortable' :
                    a.paymentFit.level === 'stretch' ? 'Stretch' : 'Risky'}
                </span>

                <div className="aw-compare-row-label">Total Interest</div>
                <div className="aw-compare-row-value" style={{ fontSize: 14 }}>{fmt(a.paymentEstimate.totalInterest)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
