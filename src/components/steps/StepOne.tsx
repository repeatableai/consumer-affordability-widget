import React, { useState } from 'react';
import type { ShopperProfile, Vehicle, CreditBand, PayFrequency, Priority, VehicleCondition } from '../../model/types';

interface Props {
  defaultVehicle: Vehicle;
  onComplete: (profile: ShopperProfile, vehicle: Vehicle) => void;
}

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Minivan', 'Hatchback', 'Wagon'];
const CREDIT_BANDS: { value: CreditBand; label: string }[] = [
  { value: 'excellent', label: 'Excellent (720+)' },
  { value: 'good', label: 'Good (680-719)' },
  { value: 'fair', label: 'Fair (620-679)' },
  { value: 'rebuilding', label: 'Rebuilding (<620)' },
];

export function StepOne({ defaultVehicle, onComplete }: Props) {
  const [budgetMin, setBudgetMin] = useState(350);
  const [budgetMax, setBudgetMax] = useState(500);
  const [downPayment, setDownPayment] = useState(3000);
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [tradeValue, setTradeValue] = useState(0);
  const [tradeOwed, setTradeOwed] = useState(0);
  const [vehicleType, setVehicleType] = useState('SUV');
  const [vehicleCondition, setVehicleCondition] = useState<VehicleCondition>('used');
  const [creditBand, setCreditBand] = useState<CreditBand>('good');
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('biweekly');
  const [ownershipYears, setOwnershipYears] = useState(5);
  const [priority, setPriority] = useState<Priority>('balanced');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');

  // Vehicle fields
  const [vYear, setVYear] = useState(defaultVehicle.year);
  const [vMake, setVMake] = useState(defaultVehicle.make);
  const [vModel, setVModel] = useState(defaultVehicle.model);
  const [vMileage, setVMileage] = useState(defaultVehicle.mileage);
  const [vPrice, setVPrice] = useState(defaultVehicle.price);

  const handleSubmit = () => {
    const profile: ShopperProfile = {
      monthlyBudgetMin: budgetMin,
      monthlyBudgetMax: budgetMax,
      downPayment,
      hasTradeIn,
      tradeInValue: hasTradeIn ? tradeValue : 0,
      tradeInOwed: hasTradeIn ? tradeOwed : 0,
      vehicleType,
      vehicleCondition,
      creditBand,
      payFrequency,
      ownershipYears,
      priority,
      monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
    };
    const vehicle: Vehicle = {
      id: 'user-selected',
      year: vYear,
      make: vMake,
      model: vModel,
      mileage: vMileage,
      price: vPrice,
      condition: vehicleCondition,
      type: vehicleType,
    };
    onComplete(profile, vehicle);
  };

  return (
    <>
      <div className="aw-card">
        <h2>Tell us about your shopping goals</h2>
        <p style={{ fontSize: 13, color: 'var(--aw-text-light)', marginBottom: 18 }}>
          This helps us show you vehicles and payment structures that fit your real budget — not just what you might get approved for.
        </p>

        <div className="aw-row">
          <div className="aw-field">
            <label>Comfortable monthly payment (low end)</label>
            <input type="number" value={budgetMin} onChange={e => setBudgetMin(+e.target.value)} min={0} step={25} />
          </div>
          <div className="aw-field">
            <label>Maximum you'd consider</label>
            <input type="number" value={budgetMax} onChange={e => setBudgetMax(+e.target.value)} min={0} step={25} />
          </div>
        </div>

        <div className="aw-field">
          <label>Estimated down payment</label>
          <input type="number" value={downPayment} onChange={e => setDownPayment(+e.target.value)} min={0} step={500} />
        </div>

        <div className="aw-field">
          <label>Do you have a trade-in?</label>
          <div className="aw-toggle-group">
            <button className={`aw-toggle ${!hasTradeIn ? 'selected' : ''}`} onClick={() => setHasTradeIn(false)}>No</button>
            <button className={`aw-toggle ${hasTradeIn ? 'selected' : ''}`} onClick={() => setHasTradeIn(true)}>Yes</button>
          </div>
        </div>

        {hasTradeIn && (
          <div className="aw-row">
            <div className="aw-field">
              <label>Estimated trade-in value</label>
              <input type="number" value={tradeValue} onChange={e => setTradeValue(+e.target.value)} min={0} step={500} />
            </div>
            <div className="aw-field">
              <label>Amount still owed on trade</label>
              <input type="number" value={tradeOwed} onChange={e => setTradeOwed(+e.target.value)} min={0} step={500} />
            </div>
          </div>
        )}

        <div className="aw-row">
          <div className="aw-field">
            <label>Vehicle type you're looking for</label>
            <select value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="aw-field">
            <label>Condition</label>
            <select value={vehicleCondition} onChange={e => setVehicleCondition(e.target.value as VehicleCondition)}>
              <option value="new">New</option>
              <option value="certified-preowned">Certified Pre-Owned</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>

        <div className="aw-field">
          <label>Where does your credit fall? (optional — broad range is fine)</label>
          <div className="aw-toggle-group">
            {CREDIT_BANDS.map(cb => (
              <button
                key={cb.value}
                className={`aw-toggle ${creditBand === cb.value ? 'selected' : ''}`}
                onClick={() => setCreditBand(cb.value)}
              >
                {cb.label}
              </button>
            ))}
          </div>
        </div>

        <div className="aw-row">
          <div className="aw-field">
            <label>How are you paid?</label>
            <div className="aw-toggle-group">
              <button className={`aw-toggle ${payFrequency === 'biweekly' ? 'selected' : ''}`} onClick={() => setPayFrequency('biweekly')}>Every two weeks</button>
              <button className={`aw-toggle ${payFrequency === 'monthly' ? 'selected' : ''}`} onClick={() => setPayFrequency('monthly')}>Monthly</button>
            </div>
          </div>
          <div className="aw-field">
            <label>How long do you plan to keep it?</label>
            <select value={ownershipYears} onChange={e => setOwnershipYears(+e.target.value)}>
              <option value={2}>1-2 years</option>
              <option value={3}>3 years</option>
              <option value={5}>4-5 years</option>
              <option value={7}>6+ years</option>
            </select>
          </div>
        </div>

        <div className="aw-field">
          <label>What matters most to you?</label>
          <div className="aw-toggle-group">
            <button className={`aw-toggle ${priority === 'lowest-payment' ? 'selected' : ''}`} onClick={() => setPriority('lowest-payment')}>Lowest payment</button>
            <button className={`aw-toggle ${priority === 'balanced' ? 'selected' : ''}`} onClick={() => setPriority('balanced')}>Balanced</button>
            <button className={`aw-toggle ${priority === 'reliability' ? 'selected' : ''}`} onClick={() => setPriority('reliability')}>Reliability first</button>
          </div>
        </div>

        <div className="aw-field">
          <label>Monthly household income (optional — improves accuracy)</label>
          <div className="aw-hint">This stays private and is only used to refine your payment comfort range.</div>
          <input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} placeholder="Optional" min={0} step={500} />
        </div>
      </div>

      <div className="aw-card">
        <h2>Vehicle you're considering</h2>
        <p style={{ fontSize: 13, color: 'var(--aw-text-light)', marginBottom: 18 }}>
          Enter details for a specific vehicle, or use our defaults to explore.
        </p>

        <div className="aw-row">
          <div className="aw-field">
            <label>Year</label>
            <input type="number" value={vYear} onChange={e => setVYear(+e.target.value)} min={2000} max={2026} />
          </div>
          <div className="aw-field">
            <label>Price</label>
            <input type="number" value={vPrice} onChange={e => setVPrice(+e.target.value)} min={0} step={500} />
          </div>
        </div>
        <div className="aw-row">
          <div className="aw-field">
            <label>Make</label>
            <input type="text" value={vMake} onChange={e => setVMake(e.target.value)} />
          </div>
          <div className="aw-field">
            <label>Model</label>
            <input type="text" value={vModel} onChange={e => setVModel(e.target.value)} />
          </div>
        </div>
        <div className="aw-field">
          <label>Mileage</label>
          <input type="number" value={vMileage} onChange={e => setVMileage(+e.target.value)} min={0} step={1000} />
        </div>
      </div>

      <div className="aw-actions">
        <div />
        <button className="aw-btn aw-btn-primary" onClick={handleSubmit}>
          See My Payment Fit &rarr;
        </button>
      </div>
    </>
  );
}
