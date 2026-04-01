// ── Affordability Engine ─────────────────────────────────────────────────────
// Rule-based logic using configurable thresholds.
// Designed for clean swap to API/ML models when data-derived thresholds are ready.

import type {
  ShopperProfile, Vehicle, AffordabilityAnalysis, PaymentEstimate,
  PaymentFitResult, OwnershipSnapshot, StructureSuggestion,
  ProtectionRecommendation, LeadSummary, FitLevel, ProtectionLevel,
} from './types';

import {
  APR_BY_CREDIT, BUDGET_FIT, AFFORDABILITY_BANDS, TERM_GUIDANCE,
  INSURANCE_ESTIMATES, MAINTENANCE_BY_AGE, FUEL_ESTIMATES,
  NEGATIVE_EQUITY, PROTECTION_COSTS, BACKEND_STRAIN_THRESHOLD,
  LTV, SERVICE_CONTRACT, DOWN_PAYMENT,
} from './thresholds';

import type { SegmentProfile } from './segmentation';

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return principal / termMonths;
  const r = annualRate / 12;
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

function vehicleAge(year: number): number {
  return new Date().getFullYear() - year;
}

function getInsuranceEstimate(vehicleType: string): number {
  return INSURANCE_ESTIMATES[vehicleType] ?? INSURANCE_ESTIMATES.default;
}

function getMaintenanceEstimate(year: number): number {
  const age = vehicleAge(year);
  const bracket = MAINTENANCE_BY_AGE.find(b => age <= b.maxAge) ?? MAINTENANCE_BY_AGE[MAINTENANCE_BY_AGE.length - 1];
  return bracket.monthly;
}

function getFuelEstimate(vehicleType: string): number {
  return FUEL_ESTIMATES[vehicleType] ?? FUEL_ESTIMATES.default;
}

// ── Payment Estimate ─────────────────────────────────────────────────────────

export function estimatePayment(shopper: ShopperProfile, vehicle: Vehicle): PaymentEstimate {
  const apr = APR_BY_CREDIT[shopper.creditBand];
  const termConfig = TERM_GUIDANCE[vehicle.condition];
  const termMonths = termConfig.recommended;

  const tradeEquity = shopper.hasTradeIn ? shopper.tradeInValue - shopper.tradeInOwed : 0;
  const principal = Math.max(0, vehicle.price - shopper.downPayment - tradeEquity);

  const monthlyPayment = calcMonthlyPayment(principal, apr, termMonths);
  const totalCost = monthlyPayment * termMonths;
  const totalInterest = totalCost - principal;

  return {
    monthlyPayment: Math.round(monthlyPayment),
    biweeklyPayment: Math.round(monthlyPayment * 12 / 26),
    totalInterest: Math.round(totalInterest),
    totalCost: Math.round(totalCost),
    termMonths,
    apr,
  };
}

// ── Payment Fit ──────────────────────────────────────────────────────────────

export function assessPaymentFit(
  shopper: ShopperProfile,
  vehicle: Vehicle,
  payment: PaymentEstimate,
  ownership: OwnershipSnapshot,
): PaymentFitResult {
  const totalBurden = ownership.totalMonthlyBurden;
  let level: FitLevel;
  let score: number;

  // If income is provided, use income-based bands
  if (shopper.monthlyIncome && shopper.monthlyIncome > 0) {
    const ratio = totalBurden / shopper.monthlyIncome;
    if (ratio <= AFFORDABILITY_BANDS.comfortable.maxBurdenPct) {
      level = 'comfortable';
      score = Math.round(90 - (ratio / AFFORDABILITY_BANDS.comfortable.maxBurdenPct) * 20);
    } else if (ratio <= AFFORDABILITY_BANDS.stretch.maxBurdenPct) {
      level = 'stretch';
      score = Math.round(65 - ((ratio - AFFORDABILITY_BANDS.comfortable.maxBurdenPct) /
        (AFFORDABILITY_BANDS.stretch.maxBurdenPct - AFFORDABILITY_BANDS.comfortable.maxBurdenPct)) * 20);
    } else {
      level = 'caution';
      score = Math.max(10, Math.round(40 - (ratio - AFFORDABILITY_BANDS.stretch.maxBurdenPct) * 100));
    }
  } else {
    // Fall back to budget-relative assessment (segment-adjusted)
    const budgetMax = shopper.monthlyBudgetMax;
    const paymentRatio = payment.monthlyPayment / budgetMax;

    if (paymentRatio <= BUDGET_FIT.comfortablePct) {
      level = 'comfortable';
      score = Math.round(90 - paymentRatio * 20);
    } else if (paymentRatio <= BUDGET_FIT.stretchPct) {
      level = 'stretch';
      score = Math.round(65 - (paymentRatio - BUDGET_FIT.comfortablePct) * 150);
    } else {
      level = 'caution';
      score = Math.max(10, Math.round(42 - (paymentRatio - 1) * 80));
    }
  }

  score = Math.max(5, Math.min(98, score));

  const explanations: Record<FitLevel, string> = {
    comfortable: 'This payment appears comfortably within the range shoppers like you typically sustain. You should have room for unexpected expenses.',
    stretch: 'This deal may work, but small changes in down payment or term could improve your flexibility. Consider building a buffer for repairs or income changes.',
    caution: 'This setup may leave little room for repairs, insurance changes, or income volatility. We recommend reviewing the structure suggestions below.',
  };

  return {
    level,
    score,
    monthlyPayment: payment.monthlyPayment,
    totalMonthlyBurden: totalBurden,
    explanation: explanations[level],
  };
}

// ── Ownership Snapshot ───────────────────────────────────────────────────────

export function buildOwnershipSnapshot(
  shopper: ShopperProfile,
  vehicle: Vehicle,
  payment: PaymentEstimate,
): OwnershipSnapshot {
  const estimatedPayment = payment.monthlyPayment;
  const estimatedInsurance = getInsuranceEstimate(vehicle.type);
  const estimatedMaintenance = getMaintenanceEstimate(vehicle.year);
  const estimatedFuel = getFuelEstimate(vehicle.type);
  const totalMonthlyBurden = estimatedPayment + estimatedInsurance + estimatedMaintenance + estimatedFuel;

  const budgetRef = shopper.monthlyIncome
    ? shopper.monthlyIncome
    : shopper.monthlyBudgetMax * 5; // rough proxy if no income

  return {
    estimatedPayment,
    estimatedInsurance,
    estimatedMaintenance,
    estimatedFuel,
    totalMonthlyBurden,
    burdenAsPercentOfBudget: totalMonthlyBurden / budgetRef,
  };
}

// ── Structure Suggestions ────────────────────────────────────────────────────

export function generateStructureSuggestions(
  shopper: ShopperProfile,
  vehicle: Vehicle,
  payment: PaymentEstimate,
  fit: PaymentFitResult,
): StructureSuggestion[] {
  const suggestions: StructureSuggestion[] = [];
  const termConfig = TERM_GUIDANCE[vehicle.condition];

  // Down payment suggestion
  const idealPct = vehicle.condition === 'new' ? DOWN_PAYMENT.idealPctNew : DOWN_PAYMENT.idealPctUsed;
  const currentPct = shopper.downPayment / vehicle.price;
  if (currentPct < idealPct) {
    const targetDown = Math.round(vehicle.price * idealPct);
    const increase = targetDown - shopper.downPayment;
    const paymentReduction = Math.round(increase / payment.termMonths);
    suggestions.push({
      id: 'down-payment',
      type: 'down-payment',
      message: `A $${increase.toLocaleString()} larger down payment would meaningfully improve payment comfort and reduce total interest.`,
      impact: `Could reduce payment by ~$${paymentReduction}/mo`,
      priority: currentPct < DOWN_PAYMENT.minimumRecommended ? 'high' : 'medium',
    });
  }

  // Term suggestion
  if (payment.termMonths > termConfig.recommended) {
    suggestions.push({
      id: 'term',
      type: 'term',
      message: `A ${termConfig.recommended}-month term may be safer than ${payment.termMonths} months for this vehicle. Longer terms increase total interest and negative equity risk.`,
      impact: 'Builds equity faster, less total interest paid',
      priority: payment.termMonths >= termConfig.risky ? 'high' : 'medium',
    });
  }

  // Negative equity warning
  if (shopper.hasTradeIn) {
    const negEquity = shopper.tradeInOwed - shopper.tradeInValue;
    if (negEquity > NEGATIVE_EQUITY.dangerThreshold) {
      suggestions.push({
        id: 'neg-equity-danger',
        type: 'equity-warning',
        message: `Rolling $${negEquity.toLocaleString()} in negative equity significantly increases financial risk. This makes the loan much larger than the vehicle's value.`,
        impact: 'Higher payments, greater GAP need, slower equity build',
        priority: 'high',
      });
    } else if (negEquity > NEGATIVE_EQUITY.warningThreshold) {
      suggestions.push({
        id: 'neg-equity-warning',
        type: 'equity-warning',
        message: `Rolling $${negEquity.toLocaleString()} in negative equity adds risk. A larger down payment or slightly less expensive vehicle could offset this.`,
        impact: 'Reduces risk of being significantly upside-down',
        priority: 'medium',
      });
    }
  }

  // Vehicle fit suggestion
  const age = vehicleAge(vehicle.year);
  if (age > 8 && shopper.priority === 'reliability') {
    suggestions.push({
      id: 'vehicle-age',
      type: 'vehicle-switch',
      message: `This vehicle is ${age} years old. A slightly newer vehicle with lower repair risk may reduce financial strain even if the price is somewhat higher.`,
      impact: 'Lower maintenance costs, better long-term reliability',
      priority: 'medium',
    });
  }

  // Biweekly cadence recommendation
  if (shopper.payFrequency === 'biweekly') {
    suggestions.push({
      id: 'biweekly',
      type: 'general',
      message: 'Since you are paid biweekly, aligning your auto payment to your pay schedule can improve budgeting and effectively makes one extra payment per year.',
      impact: 'Could shave months off the loan and save on interest',
      priority: 'low',
    });
  }

  return suggestions.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

// ── Protection Guidance ──────────────────────────────────────────────────────

export function generateProtectionGuidance(
  shopper: ShopperProfile,
  vehicle: Vehicle,
  payment: PaymentEstimate,
  fit: PaymentFitResult,
): ProtectionRecommendation[] {
  const protections: ProtectionRecommendation[] = [];
  const age = vehicleAge(vehicle.year);

  // Calculate LTV
  const tradeEquity = shopper.hasTradeIn ? shopper.tradeInValue - shopper.tradeInOwed : 0;
  const financed = vehicle.price - shopper.downPayment - tradeEquity;
  const ltv = financed / vehicle.price;

  // Running payment burden tracker
  let addedBurden = 0;

  // ── GAP ────────────────────────────────────────────────────────────────
  const gapCost = PROTECTION_COSTS.gap.mid;
  let gapLevel: ProtectionLevel;
  let gapReason: string;

  if (ltv >= LTV.gapStronglyRecommended) {
    gapLevel = 'recommended';
    gapReason = 'With a loan-to-value above 110%, your loan balance will likely exceed the vehicle\'s value for a significant period. GAP coverage protects you from a major financial loss if the vehicle is totaled or stolen.';
  } else if (ltv >= LTV.gapWorthConsidering) {
    gapLevel = 'worth-considering';
    gapReason = 'With a low down payment, the loan balance may stay above the vehicle\'s value early on. GAP could prevent a meaningful out-of-pocket cost in a total loss.';
  } else {
    gapLevel = 'not-priority';
    gapReason = 'Your down payment provides reasonable equity from the start. GAP is less critical in this situation, though still available if you want extra peace of mind.';
  }

  const gapRec: ProtectionRecommendation = {
    product: 'gap',
    level: gapLevel,
    reason: gapReason,
    paymentImpact: gapCost,
  };
  if (gapLevel !== 'not-priority') addedBurden += gapCost;
  protections.push(gapRec);

  // ── Service Contract ───────────────────────────────────────────────────
  const scCost = PROTECTION_COSTS['service-contract'].mid;
  let scLevel: ProtectionLevel;
  let scReason: string;

  if (age >= SERVICE_CONTRACT.highValue.minAge && vehicle.mileage >= SERVICE_CONTRACT.highValue.minMileage) {
    scLevel = 'recommended';
    scReason = `At ${vehicle.mileage.toLocaleString()} miles and ${age} years old, this vehicle has higher repair probability. A service contract can protect against costly unexpected repairs that strain your budget.`;
  } else if (age >= SERVICE_CONTRACT.moderate.minAge || vehicle.mileage >= SERVICE_CONTRACT.moderate.minMileage) {
    scLevel = 'worth-considering';
    scReason = 'This vehicle is approaching the age and mileage where repair costs can become less predictable. A service contract may help keep your ownership costs more stable.';
  } else if (shopper.priority === 'reliability') {
    scLevel = 'optional';
    scReason = 'This is a relatively newer vehicle, but since predictable costs are a priority for you, a service contract could provide peace of mind against unexpected repairs.';
  } else {
    scLevel = 'not-priority';
    scReason = 'This vehicle is newer with lower mileage. Manufacturer warranty likely covers most concerns for now. A service contract is probably not a high priority.';
  }

  const scRec: ProtectionRecommendation = {
    product: 'service-contract',
    level: scLevel,
    reason: scReason,
    paymentImpact: scCost,
  };
  if (scLevel !== 'not-priority' && scLevel !== 'optional') addedBurden += scCost;
  protections.push(scRec);

  // ── Maintenance Plan ───────────────────────────────────────────────────
  const mpCost = PROTECTION_COSTS['maintenance-plan'].mid;
  let mpLevel: ProtectionLevel;
  let mpReason: string;

  if (shopper.priority === 'reliability' && shopper.ownershipYears >= 3) {
    mpLevel = 'optional';
    mpReason = 'A prepaid maintenance plan provides predictable upkeep costs and may be convenient if you plan to keep the vehicle several years.';
  } else {
    mpLevel = 'not-priority';
    mpReason = 'Routine maintenance costs for this vehicle are relatively predictable. A prepaid plan is a convenience, not a financial necessity for most shoppers.';
  }

  protections.push({
    product: 'maintenance-plan',
    level: mpLevel,
    reason: mpReason,
    paymentImpact: mpCost,
  });

  // ── Stacking Warning ──────────────────────────────────────────────────
  const strainRatio = addedBurden / payment.monthlyPayment;
  if (strainRatio > BACKEND_STRAIN_THRESHOLD) {
    // Add warning to the last recommended product
    const lastRecommended = [...protections].reverse().find(
      p => p.level === 'recommended' || p.level === 'worth-considering'
    );
    if (lastRecommended) {
      lastRecommended.warningIfAdded = `Adding multiple protection products could increase your payment by ~$${addedBurden}/mo, which may move this deal out of your comfortable range. Consider prioritizing the product most important to your situation.`;
    }
  }

  return protections;
}

// ── Lead Summary Builder ─────────────────────────────────────────────────────

export function buildLeadSummary(
  shopper: ShopperProfile,
  vehicle: Vehicle,
  fit: PaymentFitResult,
  protections: ProtectionRecommendation[],
  suggestions: StructureSuggestion[],
): LeadSummary {
  const concerns: string[] = [];
  if (fit.level === 'caution' || fit.level === 'stretch') concerns.push('affordability');
  if (shopper.priority === 'reliability') concerns.push('reliability');
  if (shopper.hasTradeIn && shopper.tradeInOwed > shopper.tradeInValue) concerns.push('negative equity');
  if (shopper.payFrequency === 'biweekly') concerns.push('payment timing alignment');

  const protectionPriorities = protections
    .filter(p => p.level === 'recommended' || p.level === 'worth-considering')
    .map(p => {
      const names = { gap: 'GAP coverage', 'service-contract': 'Service contract', 'maintenance-plan': 'Maintenance plan' };
      return names[p.product];
    });

  const idealPct = vehicle.condition === 'new' ? DOWN_PAYMENT.idealPctNew : DOWN_PAYMENT.idealPctUsed;
  const suggestedDown = Math.max(shopper.downPayment, Math.round(vehicle.price * idealPct));

  const checklist = [
    'Valid driver\'s license',
    'Proof of income (recent pay stubs)',
    'Proof of residence (utility bill or bank statement)',
    'Insurance information',
  ];
  if (shopper.hasTradeIn) {
    checklist.push('Trade-in vehicle title');
    checklist.push('Trade-in payoff amount (current)');
  }
  if (shopper.downPayment > 0) {
    checklist.push(`Down payment of $${suggestedDown.toLocaleString()} (or as close as possible)`);
  }

  const vehicleDesc = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const priorityLabel = shopper.priority === 'reliability'
    ? 'Interested in keeping total ownership cost predictable.'
    : shopper.priority === 'lowest-payment'
      ? 'Focused on the lowest comfortable payment.'
      : 'Looking for a balance of payment and reliability.';

  return {
    comfortPaymentRange: {
      min: shopper.monthlyBudgetMin,
      max: shopper.monthlyBudgetMax,
    },
    suggestedDownPayment: suggestedDown,
    preferredVehicles: [vehicleDesc],
    tradeStatus: shopper.hasTradeIn
      ? `Has trade-in valued ~$${shopper.tradeInValue.toLocaleString()}, owes ~$${shopper.tradeInOwed.toLocaleString()}`
      : 'No trade-in',
    protectionPriorities,
    likelyConcerns: concerns,
    appointmentFraming: `Customer prefers ${vehicle.type.toLowerCase()}. Comfortable payment band: $${shopper.monthlyBudgetMin}–$${shopper.monthlyBudgetMax}. ${priorityLabel} ${protectionPriorities.length > 0 ? `Open to ${protectionPriorities.join(' and ').toLowerCase()}.` : ''} Would benefit from seeing two structures within budget and one reliability-focused option.`,
    visitChecklist: checklist,
  };
}

// ── Biweekly Savings Calculator ──────────────────────────────────────────────

export interface BiweeklySavings {
  monthlyTotalInterest: number;
  biweeklyTotalInterest: number;
  interestSaved: number;
  monthsShaved: number;
  monthlyTotalCost: number;
  biweeklyTotalCost: number;
}

export function calculateBiweeklySavings(shopper: ShopperProfile, vehicle: Vehicle): BiweeklySavings {
  const apr = APR_BY_CREDIT[shopper.creditBand];
  const termConfig = TERM_GUIDANCE[vehicle.condition];
  const termMonths = termConfig.recommended;
  const tradeEquity = shopper.hasTradeIn ? shopper.tradeInValue - shopper.tradeInOwed : 0;
  const principal = Math.max(0, vehicle.price - shopper.downPayment - tradeEquity);

  // Monthly scenario
  const monthlyPayment = calcMonthlyPayment(principal, apr, termMonths);
  const monthlyTotalCost = monthlyPayment * termMonths;
  const monthlyTotalInterest = monthlyTotalCost - principal;

  // Biweekly scenario: 26 payments/year = 13 monthly equivalents
  // Effectively makes one extra monthly payment per year
  const biweeklyPayment = monthlyPayment / 2;
  let balance = principal;
  const biweeklyRate = apr / 26;
  let biweeklyPayments = 0;
  let biweeklyTotalPaid = 0;

  while (balance > 0 && biweeklyPayments < termMonths * 3) {
    const interest = balance * biweeklyRate;
    const principalPaid = Math.min(biweeklyPayment - interest, balance);
    if (principalPaid <= 0) break;
    balance -= principalPaid;
    biweeklyTotalPaid += biweeklyPayment;
    biweeklyPayments++;
  }

  const biweeklyMonthsEquiv = Math.round(biweeklyPayments / 2.17);
  const biweeklyTotalInterest = biweeklyTotalPaid - principal;

  return {
    monthlyTotalInterest: Math.round(monthlyTotalInterest),
    biweeklyTotalInterest: Math.round(Math.max(0, biweeklyTotalInterest)),
    interestSaved: Math.round(Math.max(0, monthlyTotalInterest - biweeklyTotalInterest)),
    monthsShaved: Math.max(0, termMonths - biweeklyMonthsEquiv),
    monthlyTotalCost: Math.round(monthlyTotalCost),
    biweeklyTotalCost: Math.round(biweeklyTotalPaid),
  };
}

// ── Main Analysis Function ───────────────────────────────────────────────────

export function analyzeAffordability(
  shopper: ShopperProfile,
  vehicle: Vehicle,
  segment?: SegmentProfile,
): AffordabilityAnalysis {
  // Apply segment adjustment to budget max for scoring
  const adjustedShopper = segment
    ? { ...shopper, monthlyBudgetMax: shopper.monthlyBudgetMax * segment.comfortBandAdjustment }
    : shopper;

  const paymentEstimate = estimatePayment(shopper, vehicle);
  const ownership = buildOwnershipSnapshot(shopper, vehicle, paymentEstimate);
  const paymentFit = assessPaymentFit(adjustedShopper, vehicle, paymentEstimate, ownership);
  const structureSuggestions = generateStructureSuggestions(shopper, vehicle, paymentEstimate, paymentFit);
  const protections = generateProtectionGuidance(shopper, vehicle, paymentEstimate, paymentFit);
  const leadSummary = buildLeadSummary(shopper, vehicle, paymentFit, protections, structureSuggestions);

  return {
    paymentFit,
    ownership,
    structureSuggestions,
    protections,
    leadSummary,
    paymentEstimate,
  };
}
