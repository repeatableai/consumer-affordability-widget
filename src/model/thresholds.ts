// ── Configurable Thresholds ──────────────────────────────────────────────────
// These are industry-standard heuristics. Replace with data-derived values
// from your 500K borrower dataset when available.

import type { CreditBand } from './types';

// Payment-to-income ratio bands
// Source: standard personal finance guidance + auto lending norms
export const AFFORDABILITY_BANDS = {
  comfortable: { maxBurdenPct: 0.15 },  // total auto burden < 15% of income
  stretch:     { maxBurdenPct: 0.20 },  // 15-20%
  caution:     { maxBurdenPct: 1.00 },  // > 20%
};

// When income is not provided, use budget-relative thresholds
// "comfortable" = payment well within stated budget range
// "stretch" = near top of budget
// "caution" = exceeds stated budget
export const BUDGET_FIT = {
  comfortablePct: 0.85,   // payment < 85% of max budget = comfortable
  stretchPct: 1.00,       // payment 85-100% of max budget = stretch
  // above 100% = caution
};

// Estimated APR by credit band (used when no real rate available)
export const APR_BY_CREDIT: Record<CreditBand, number> = {
  excellent: 0.055,
  good: 0.072,
  fair: 0.099,
  rebuilding: 0.145,
};

// Recommended term ranges by vehicle condition
export const TERM_GUIDANCE = {
  new:                 { recommended: 60, acceptable: 72, risky: 84 },
  'certified-preowned': { recommended: 60, acceptable: 66, risky: 72 },
  used:                { recommended: 48, acceptable: 60, risky: 72 },
};

// Insurance estimates (monthly) by vehicle type
export const INSURANCE_ESTIMATES: Record<string, number> = {
  Sedan: 140,
  SUV: 165,
  Truck: 170,
  Coupe: 175,
  Minivan: 145,
  Hatchback: 135,
  Convertible: 190,
  Wagon: 145,
  default: 155,
};

// Maintenance cost proxy (monthly) by vehicle age bracket
export const MAINTENANCE_BY_AGE: { maxAge: number; monthly: number }[] = [
  { maxAge: 2, monthly: 30 },
  { maxAge: 5, monthly: 65 },
  { maxAge: 8, monthly: 110 },
  { maxAge: 12, monthly: 160 },
  { maxAge: 99, monthly: 210 },
];

// Fuel cost estimate (monthly) — rough by type
export const FUEL_ESTIMATES: Record<string, number> = {
  Sedan: 120,
  SUV: 165,
  Truck: 185,
  Coupe: 130,
  Minivan: 155,
  Hatchback: 105,
  Convertible: 140,
  Wagon: 130,
  default: 145,
};

// Negative equity danger threshold
export const NEGATIVE_EQUITY = {
  warningThreshold: 3000,   // rolling >$3K neg equity = warning
  dangerThreshold: 6000,    // rolling >$6K neg equity = strong warning
};

// Protection product cost estimates (monthly, spread over loan term)
export const PROTECTION_COSTS = {
  gap: { low: 15, mid: 25, high: 35 },
  'service-contract': { low: 35, mid: 55, high: 80 },
  'maintenance-plan': { low: 20, mid: 35, high: 50 },
};

// Backend burden threshold — if total protection adds push payment
// past this % above base payment, warn about payment strain
export const BACKEND_STRAIN_THRESHOLD = 0.12; // 12% above base payment

// LTV thresholds
export const LTV = {
  gapStronglyRecommended: 1.10,  // LTV > 110% = GAP strongly recommended
  gapWorthConsidering: 0.95,     // LTV > 95% = GAP worth considering
};

// Vehicle age thresholds for service contract value
export const SERVICE_CONTRACT = {
  highValue: { minAge: 4, minMileage: 50000 },
  moderate:  { minAge: 2, minMileage: 30000 },
};

// Down payment guidance
export const DOWN_PAYMENT = {
  idealPctNew: 0.20,         // 20% for new
  idealPctUsed: 0.15,        // 15% for used
  minimumRecommended: 0.10,  // at least 10%
};
